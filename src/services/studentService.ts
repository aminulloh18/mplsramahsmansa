import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Student } from '../types/database.types';
import { localDb } from './localDb';

export const studentService = {
  async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(
            *,
            teacher:teachers(*)
          )
        `)
        .is('deleted_at', null);

      if (error) {
        console.warn('Supabase getStudents error:', error);
        return localDb.getStudents();
      }
      return data as Student[];
    }
    return localDb.getStudents();
  },

  async searchStudent(registrationNo: string): Promise<Student | null> {
    const term = registrationNo.trim().toUpperCase();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(
            *,
            teacher:teachers(*)
          )
        `)
        .eq('registration_number', term)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.warn('Supabase searchStudent error:', error);
        return this.searchStudentLocal(term);
      }
      return data;
    }
    return this.searchStudentLocal(term);
  },

  searchStudentLocal(registrationNo: string): Student | null {
    const students = localDb.getStudents();
    return (
      students.find(
        (s) => s.registration_number.toUpperCase() === registrationNo.toUpperCase()
      ) || null
    );
  },

  async searchStudentByNisnAndDob(nisn: string, birthDate: string): Promise<Student | null> {
    const sanitizedNisn = nisn.trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(
            *,
            teacher:teachers(*)
          )
        `)
        .eq('nisn', sanitizedNisn)
        .eq('birth_date', birthDate)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.warn('Supabase searchStudentByNisnAndDob error:', error);
        return this.searchStudentByNisnAndDobLocal(sanitizedNisn, birthDate);
      }
      return data;
    }
    return this.searchStudentByNisnAndDobLocal(sanitizedNisn, birthDate);
  },

  searchStudentByNisnAndDobLocal(nisn: string, birthDate: string): Student | null {
    const students = localDb.getStudents();
    return (
      students.find(
        (s) => s.nisn === nisn && s.birth_date === birthDate
      ) || null
    );
  },

  async createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>, adminEmail: string): Promise<Student> {
    const newId = `s-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newStudent: Student = {
      ...student,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    if (isSupabaseConfigured && supabase) {
      // Omit relation properties like 'class' that are not columns in the students table
      const { class: _, ...supabaseStudent } = newStudent;
      const { data, error } = await supabase
        .from('students')
        .insert([supabaseStudent])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createStudent error:', error);
        // Fallback to local
      } else {
        localDb.addLog(adminEmail, 'Tambah Siswa', `Menambahkan siswa baru: ${student.full_name} (${student.registration_number}) via Cloud SQL.`);
        return data as Student;
      }
    }

    // Local DB save
    const students = localDb.getStudents();
    students.push(newStudent);
    localDb.saveStudents(students);
    localDb.addLog(adminEmail, 'Tambah Siswa', `Menambahkan siswa baru: ${student.full_name} (${student.registration_number}).`);
    return newStudent;
  },

  async updateStudent(id: string, updates: Partial<Student>, adminEmail: string): Promise<Student> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      // Omit relation properties like 'class' that are not columns in the students table
      const { class: _, ...supabaseUpdates } = updates;
      const { data, error } = await supabase
        .from('students')
        .update({ ...supabaseUpdates, updated_at: timestamp })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateStudent error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update Siswa', `Mengubah data siswa ID: ${id} via Cloud SQL.`);
        return data as Student;
      }
    }

    const students = localDb.getStudents();
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student not found');

    const updated = {
      ...students[idx],
      ...updates,
      updated_at: timestamp,
    };

    students[idx] = updated;
    localDb.saveStudents(students);
    localDb.addLog(adminEmail, 'Update Siswa', `Mengubah data siswa: ${updated.full_name} (${updated.registration_number}).`);
    return updated;
  },

  async deleteStudent(id: string, adminEmail: string): Promise<void> {
    const timestamp = new Date().toISOString();
    let supabaseSuccess = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('students')
          .update({ deleted_at: timestamp })
          .eq('id', id);

        if (error) {
          console.warn('Supabase soft-delete failed, falling back to hard delete:', error);
          const { error: hardDeleteError } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

          if (hardDeleteError) {
            console.warn('Supabase hard delete failed as well, will use Local Hybrid fallback:', hardDeleteError);
          } else {
            localDb.addLog(adminEmail, 'Hapus Siswa', `Melakukan hard-delete siswa ID: ${id} via Cloud SQL.`);
            supabaseSuccess = true;
          }
        } else {
          localDb.addLog(adminEmail, 'Hapus Siswa', `Melakukan soft-delete siswa ID: ${id} via Cloud SQL.`);
          supabaseSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase delete exception, falling back to local storage:', err);
      }
    }

    // Local storage robust delete (hard delete from array to ensure perfect sync)
    const allRaw = JSON.parse(localStorage.getItem('mpls_students') || '[]') as Student[];
    const student = allRaw.find((s) => s.id === id);
    const filtered = allRaw.filter((s) => s.id !== id);
    localStorage.setItem('mpls_students', JSON.stringify(filtered));

    if (!supabaseSuccess) {
      if (student) {
        localDb.addLog(adminEmail, 'Hapus Siswa', `Menghapus siswa: ${student.full_name} (${student.registration_number}).`);
      } else {
        localDb.addLog(adminEmail, 'Hapus Siswa', `Menghapus siswa ID: ${id}.`);
      }
    }
  },

  async bulkDeleteStudents(ids: string[], adminEmail: string): Promise<void> {
    const timestamp = new Date().toISOString();
    let supabaseSuccess = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('students')
          .update({ deleted_at: timestamp })
          .in('id', ids);

        if (error) {
          console.warn('Supabase bulk soft-delete failed, falling back to hard delete:', error);
          const { error: hardDeleteError } = await supabase
            .from('students')
            .delete()
            .in('id', ids);

          if (hardDeleteError) {
            console.warn('Supabase bulk hard delete failed as well, will use Local Hybrid fallback:', hardDeleteError);
          } else {
            localDb.addLog(adminEmail, 'Hapus Siswa Massal', `Menghapus massal ${ids.length} siswa via Cloud SQL (hard-delete).`);
            supabaseSuccess = true;
          }
        } else {
          localDb.addLog(adminEmail, 'Hapus Siswa Massal', `Menghapus massal ${ids.length} siswa via Cloud SQL (soft-delete).`);
          supabaseSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase bulk delete exception, falling back to local storage:', err);
      }
    }

    // Local storage robust bulk delete (hard delete from array)
    const allRaw = JSON.parse(localStorage.getItem('mpls_students') || '[]') as Student[];
    const filtered = allRaw.filter((s) => !ids.includes(s.id));
    const deletedCount = allRaw.length - filtered.length;
    localStorage.setItem('mpls_students', JSON.stringify(filtered));

    if (!supabaseSuccess) {
      localDb.addLog(adminEmail, 'Hapus Siswa Massal', `Menghapus massal ${deletedCount} data siswa.`);
    }
  },

  async importStudentsBulk(studentsList: Omit<Student, 'id' | 'created_at' | 'updated_at'>[], adminEmail: string): Promise<void> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('students')
        .insert(studentsList);

      if (error) {
        console.warn('Supabase importStudentsBulk error:', error);
      } else {
        localDb.addLog(adminEmail, 'Import Excel Siswa', `Berhasil mengimpor ${studentsList.length} siswa baru dari file Excel ke Cloud SQL.`);
        return;
      }
    }

    const currentStudents = localDb.getStudents();
    const newStudents = studentsList.map((s, index) => ({
      ...s,
      id: `s-imported-${Date.now()}-${index}`,
      created_at: timestamp,
      updated_at: timestamp,
    }));

    const combined = [...currentStudents, ...newStudents];
    localDb.saveStudents(combined);
    localDb.addLog(adminEmail, 'Import Excel Siswa', `Berhasil mengimpor ${studentsList.length} siswa baru dari file Excel.`);
  }
};
