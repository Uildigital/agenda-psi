export interface Patient {
  id: string;
  doctor_id: string;
  full_name: string;
  whatsapp: string;
  email?: string;
  cpf?: string;
  date_of_birth?: string;
  notes?: string;
  created_at?: string;
  base_session_value?: number;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  content: string;
  created_at: string;
  symptoms?: string;
  obs?: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id?: string;
  patient_name: string;
  whatsapp: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'finished' | 'no_show';
  notes?: string;
  is_recurrent: boolean;
  price?: number;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  payment_method?: 'pix' | 'money' | 'card' | 'other';
}

export interface DoctorProfile {
  id: string;
  full_name: string;
  specialty?: string;
  bio?: string;
  avatar_url?: string;
  crm_crp?: string;
  whatsapp_number?: string;
  instagram_url?: string;
  custom_color?: string;
  slug: string;
  default_session_value?: number;
}
