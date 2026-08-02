// ==============================================================================
// PUSAT KENDALI UTAMA (Code.gs)
// ==============================================================================
// File ini hanya berisi fungsi-fungsi utama yang akan dijalankan oleh pemicu
// (trigger) atau dieksekusi secara manual.

/**
 * @description TUGAS PAGI: HANYA kirim notifikasi ulang tahun.
 * Atur pemicu (trigger) untuk berjalan setiap hari antara jam 7 pagi - 8 pagi.
 */
function runMorningTasks() {
  try {
    Logger.log("Memulai tugas pagi (Notifikasi Ulang Tahun)...");
    
    // Langsung kirim notifikasi menggunakan data yang sudah ada di sheet
    sendBirthdayNotifications();
    
    Logger.log("Tugas pagi selesai dengan sukses.");

  } catch (e) {
    sendErrorNotification(e, "Tugas Pagi (Ulang Tahun)");
  }
}



/**
 * @description TUGAS SORE: HANYA kirim notifikasi perpanjangan.
 * Atur pemicu (trigger) untuk berjalan setiap hari antara jam 5 sore - 6 sore.
 */
function runAfternoonTasks() {
  try {
    Logger.log("Memulai tugas sore (Notifikasi Perpanjangan)...");
    
    // Langsung kirim notifikasi menggunakan data yang sudah ada di sheet
    sendExpiryNotifications();
    
    Logger.log("Tugas sore selesai dengan sukses.");

  } catch (e) {
    sendErrorNotification(e, "Tugas Sore (Perpanjangan)");
  }
}



/**
 * @description FUNGSI MANUAL: Mengirim notifikasi massal untuk SEMUA sertifikat yang SUDAH kedaluwarsa.
 * JALANKAN FUNGSI INI SECARA MANUAL HANYA SEKALI.
 */
function sendOverdueExpiryNotifications() {
  Logger.log("Memulai pengiriman notifikasi massal untuk sertifikat yang sudah kedaluwarsa...");
  sendMassOverdueNotifications(); // Memanggil fungsi dari file notifications.gs
  Logger.log("Pengiriman notifikasi massal selesai.");
}
