/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  phone: string;
  email: string;
  photo_url?: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  quota: number;
  regu: string;
  floor: number;
  room_number: string;
  whatsapp_link?: string;
  qr_code_link?: string;
  teacher_id?: string;
  teacher?: Teacher; // Joined
  student_count?: number; // Calculated
  binkel_name?: string;
  binkel_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  registration_number: string;
  nisn: string;
  nik: string;
  gender: 'L' | 'P';
  birth_place: string;
  birth_date: string; // YYYY-MM-DD
  address: string;
  school_origin: string;
  phone: string;
  email: string;
  parent_name: string;
  class_id?: string;
  class?: Class; // Joined
  status: 'Aktif' | 'Cadangan' | 'Mengundurkan Diri';
  notes?: string;
  photo_url?: string;
  attendance_status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | null;
  attendance_history?: string | null; // JSON string mapping day key to status, e.g. {"1":"Hadir","2":"Sakit"}
  tb?: number | null;
  bb?: number | null;
  heart_rate?: number | null;
  flexibility?: number | null;
  flexibility_trial1?: number | null;
  flexibility_trial2?: number | null;
  flexibility_trial3?: number | null;
  imt?: number | null;
  imt_status?: string | null;
  graduation_status?: 'Lulus' | 'Tidak Lulus' | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Published';
  is_pinned: boolean;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_num: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  school_name: string;
  school_logo?: string;
  school_banner?: string;
  school_banners?: string[];
  mpls_date: string; // ISO date string
  committee_phone: string;
  status_publish: boolean;
  color_theme: string;
  guidebook_url?: string;
  rules_url?: string;
  embed_type?: 'none' | 'youtube' | 'canva' | 'custom';
  embed_code?: string;
  certificate_template_url?: string;
  is_certificate_published?: boolean;
  certificate_name_x?: number;
  certificate_name_y?: number;
  certificate_name_size?: number;
  certificate_name_color?: string;
  certificate_name_font?: string;
  certificate_name_bold?: boolean;
  certificate_name_italic?: boolean;
  certificate_name_uppercase?: boolean;
}

export interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}
