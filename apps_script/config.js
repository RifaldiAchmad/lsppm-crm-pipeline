// ==============================================================================
// KONFIGURASI PROYEK (config.gs)
// ==============================================================================
// Semua variabel dan pengaturan untuk proyek ini disimpan di sini.

// --- Konfigurasi Koneksi Supabase ---
const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
const SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY'); // Harus 'anon' key

// --- Konfigurasi Google Sheets ---
const EMAIL_SHEET_NAME = "email";
const PHONE_SHEET_NAME = "phone";

// --- Konfigurasi Notifikasi ---
const ADMIN_EMAIL = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
const FIRST_REMINDER_DAYS = 180; 
const SECOND_REMINDER_DAYS = 90;
const SENDER_NAME = "Lembaga Sertifikasi Profesi Pasar Modal";

// --- Validasi Awal (Penting) ---
if (!SUPABASE_URL || !SUPABASE_KEY || !ADMIN_EMAIL) {
  throw new Error("Konfigurasi penting (SUPABASE_URL, SUPABASE_KEY, ADMIN_EMAIL) belum diatur di Properti Skrip. Silakan atur melalui Setelan Proyek.");
}
