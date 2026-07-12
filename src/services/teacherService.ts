import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Teacher } from '../types/database.types';
import { localDb } from './localDb';

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('teachers')
        .select('*');

      if (error) {
        console.warn('Supabase getTeachers error:', error);
        return localDb.getTeachers();
      }
      return data as Teacher[];
    }
    return localDb.getTeachers();
  },

  async createTeacher(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>, adminEmail: string): Promise<Teacher> {
    const newId = `t-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newTeacher: Teacher = {
      ...teacher,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('teachers')
        .insert([newTeacher])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createTeacher error:', error);
      } else {
        localDb.addLog(adminEmail, 'Tambah Wali Kelas', `Menambahkan Wali Kelas baru: ${teacher.name} via Cloud SQL.`);
        return data as Teacher;
      }
    }

    const teachers = localDb.getTeachers();
    teachers.push(newTeacher);
    localDb.saveTeachers(teachers);
    localDb.addLog(adminEmail, 'Tambah Wali Kelas', `Menambahkan Wali Kelas baru: ${teacher.name}.`);
    return newTeacher;
  },

  async updateTeacher(id: string, updates: Partial<Teacher>, adminEmail: string): Promise<Teacher> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('teachers')
        .update({ ...updates, updated_at: timestamp })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateTeacher error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update Wali Kelas', `Mengubah data Wali Kelas ID: ${id} via Cloud SQL.`);
        return data as Teacher;
      }
    }

    const teachers = localDb.getTeachers();
    const idx = teachers.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Teacher not found');

    const updated = {
      ...teachers[idx],
      ...updates,
      updated_at: timestamp,
    };

    teachers[idx] = updated;
    localDb.saveTeachers(teachers);
    localDb.addLog(adminEmail, 'Update Wali Kelas', `Mengubah data Wali Kelas: ${updated.name}.`);
    return updated;
  },

  async deleteTeacher(id: string, adminEmail: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteTeacher error:', error);
      } else {
        localDb.addLog(adminEmail, 'Hapus Wali Kelas', `Menghapus Wali Kelas ID: ${id} via Cloud SQL.`);
        return;
      }
    }

    const teachers = localDb.getTeachers();
    const idx = teachers.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const teacher = teachers[idx];
      teachers.splice(idx, 1);
      localDb.saveTeachers(teachers);
      localDb.addLog(adminEmail, 'Hapus Wali Kelas', `Menghapus Wali Kelas: ${teacher.name}.`);
    }
  }
};
