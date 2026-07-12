import { Teacher, Class, Student, Announcement, FAQ, Setting, ActivityLog } from '../types/database.types';
import {
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_FAQS,
  INITIAL_SETTINGS,
  INITIAL_LOGS,
} from '../constants';

const KEYS = {
  TEACHERS: 'mpls_teachers',
  CLASSES: 'mpls_classes',
  STUDENTS: 'mpls_students',
  ANNOUNCEMENTS: 'mpls_announcements',
  FAQS: 'mpls_faqs',
  SETTINGS: 'mpls_settings',
  LOGS: 'mpls_logs',
};

// Helper to safely parse localStorage or set default
function getStored<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error('Failed to parse storage for key', key, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Global state controller for simulation
export const localDb = {
  getTeachers(): Teacher[] {
    return getStored<Teacher[]>(KEYS.TEACHERS, INITIAL_TEACHERS);
  },

  saveTeachers(teachers: Teacher[]): void {
    setStored(KEYS.TEACHERS, teachers);
  },

  getClasses(): Class[] {
    const classes = getStored<Class[]>(KEYS.CLASSES, INITIAL_CLASSES);
    const teachers = this.getTeachers();
    const students = this.getStudents();

    return classes.map((c) => {
      const initialCls = INITIAL_CLASSES.find((ic) => ic.id === c.id);
      const teacher = teachers.find((t) => t.id === c.teacher_id);
      const student_count = students.filter((s) => s.class_id === c.id && s.status === 'Aktif').length;
      return {
        ...c,
        binkel_name: c.binkel_name ?? initialCls?.binkel_name,
        binkel_phone: c.binkel_phone ?? initialCls?.binkel_phone,
        teacher,
        student_count,
      };
    });
  },

  saveClasses(classes: Class[]): void {
    // Save only core Class properties to prevent nested duplicates
    const stripped = classes.map(({ teacher, student_count, ...rest }) => rest);
    setStored(KEYS.CLASSES, stripped);
  },

  getStudents(): Student[] {
    const students = getStored<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = getStored<Class[]>(KEYS.CLASSES, INITIAL_CLASSES);
    const teachers = this.getTeachers();

    // Filter out soft deleted
    const activeStudents = students.filter((s) => !s.deleted_at);

    return activeStudents.map((s) => {
      const cls = classes.find((c) => c.id === s.class_id);
      if (cls) {
        const teacher = teachers.find((t) => t.id === cls.teacher_id);
        s.class = { ...cls, teacher };
      }
      return s;
    });
  },

  saveStudents(students: Student[]): void {
    const stripped = students.map(({ class: cls, ...rest }) => rest);
    setStored(KEYS.STUDENTS, stripped);
  },

  getAnnouncements(): Announcement[] {
    return getStored<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  saveAnnouncements(announcements: Announcement[]): void {
    setStored(KEYS.ANNOUNCEMENTS, announcements);
  },

  getFAQs(): FAQ[] {
    return getStored<FAQ[]>(KEYS.FAQS, INITIAL_FAQS).sort((a, b) => a.order_num - b.order_num);
  },

  saveFAQs(faqs: FAQ[]): void {
    setStored(KEYS.FAQS, faqs);
  },

  getSettings(): Setting {
    return getStored<Setting>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  saveSettings(settings: Setting): void {
    setStored(KEYS.SETTINGS, settings);
  },

  getLogs(): ActivityLog[] {
    return getStored<ActivityLog[]>(KEYS.LOGS, INITIAL_LOGS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  addLog(user_email: string, action: string, details: string): void {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      user_email,
      action,
      details,
      ip_address: '127.0.0.1 (Local Session)',
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStored(KEYS.LOGS, logs.slice(0, 500)); // Limit to last 500 logs
  },

  clearLogs(): void {
    setStored(KEYS.LOGS, []);
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.TEACHERS);
    localStorage.removeItem(KEYS.CLASSES);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(KEYS.FAQS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.LOGS);
    window.location.reload();
  },
};
