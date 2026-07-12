import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Class } from '../types/database.types';
import { localDb } from './localDb';

export const classService = {
  async getClasses(): Promise<Class[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:teachers(*)
        `);

      if (error) {
        console.warn('Supabase getClasses error:', error);
        return localDb.getClasses();
      }
      return data as Class[];
    }
    return localDb.getClasses();
  },

  async createClass(cls: Omit<Class, 'id' | 'created_at' | 'updated_at'>, adminEmail: string): Promise<Class> {
    const newId = `c-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newClass: Class = {
      ...cls,
      id: newId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    if (isSupabaseConfigured && supabase) {
      // Omit relation/calculated properties that are not columns in the classes table
      const { teacher, student_count, ...supabaseClass } = newClass;
      const { data, error } = await supabase
        .from('classes')
        .insert([supabaseClass])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createClass error:', error);
      } else {
        localDb.addLog(adminEmail, 'Tambah Kelas', `Menambahkan kelas baru: ${cls.name} via Cloud SQL.`);
        return data as Class;
      }
    }

    const classes = localDb.getClasses();
    classes.push(newClass);
    localDb.saveClasses(classes);
    localDb.addLog(adminEmail, 'Tambah Kelas', `Menambahkan kelas baru: ${cls.name} (${cls.code}).`);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<Class>, adminEmail: string): Promise<Class> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      // Omit relation/calculated properties that are not columns in the classes table
      const { teacher, student_count, ...supabaseUpdates } = updates;
      const { data, error } = await supabase
        .from('classes')
        .update({ ...supabaseUpdates, updated_at: timestamp })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('Supabase updateClass error:', error);
      } else {
        localDb.addLog(adminEmail, 'Update Kelas', `Mengubah data kelas ID: ${id} via Cloud SQL.`);
        return data as Class;
      }
    }

    const classes = localDb.getClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Class not found');

    const updated = {
      ...classes[idx],
      ...updates,
      updated_at: timestamp,
    };

    classes[idx] = updated;
    localDb.saveClasses(classes);
    localDb.addLog(adminEmail, 'Update Kelas', `Mengubah data kelas: ${updated.name}.`);
    return updated;
  },

  async deleteClass(id: string, adminEmail: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase deleteClass error:', error);
      } else {
        localDb.addLog(adminEmail, 'Hapus Kelas', `Menghapus kelas ID: ${id} via Cloud SQL.`);
        return;
      }
    }

    const classes = localDb.getClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const cls = classes[idx];
      classes.splice(idx, 1);
      localDb.saveClasses(classes);
      localDb.addLog(adminEmail, 'Hapus Kelas', `Menghapus kelas: ${cls.name}.`);
    }
  }
};
