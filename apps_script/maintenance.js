// ==============================================================================
// SKRIP PERBAIKAN & MAINTENANCE (maintenance.gs)
// ==============================================================================
// File ini berisi fungsi-fungsi yang bisa dijalankan secara manual oleh admin
// untuk mengirim ulang notifikasi yang gagal terkirim.


// ==============================================================================
// ALAT 1: KIRIM ULANG UNTUK SATU HARI PENUH YANG GAGAL
// ==============================================================================
/**
 * @description MENJALANKAN ULANG notifikasi perpanjangan yang GAGAL pada tanggal tertentu.
 * Gunakan ini jika seluruh tugas sore (runAfternoonTasks) gagal berjalan.
 * CARA MENGGUNAKAN:
 * 1. Ubah nilai 'failedDateString' di bawah ini menjadi tanggal ketika TUGAS SORE GAGAL berjalan.
 * 2. Pilih fungsi 'rerunFailedExpiryNotifications' dari menu dropdown di atas.
 * 3. Klik "Jalankan".
 */
function rerunFailedExpiryNotifications() {
  // --- UBAH TANGGAL DI SINI ---
  const failedDateString = "YYYY-MM-DD"; // Ganti dengan tanggal yang gagal, contoh: "2025-09-28"
  const failedRunDate = new Date(failedDateString + 'T00:00:00');
  
  if (isNaN(failedRunDate.getTime()) || failedDateString === "YYYY-MM-DD") {
    const msg = "Anda belum mengubah tanggal di dalam skrip 'maintenance.gs'. Buka file tersebut, ubah tanggalnya, lalu jalankan lagi.";
    Logger.log(`ERROR: ${msg}`);
    SpreadsheetApp.getUi().alert(msg); // Menampilkan pop-up peringatan
    return;
  }
  
  // Hitung tanggal kedaluwarsa target berdasarkan tanggal gagalnya tugas
  const firstTargetExpiryDate = new Date(failedRunDate);
  firstTargetExpiryDate.setDate(failedRunDate.getDate() + FIRST_REMINDER_DAYS);
  const firstTargetExpiryDateString = Utilities.formatDate(firstTargetExpiryDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

  const secondTargetExpiryDate = new Date(failedRunDate);
  secondTargetExpiryDate.setDate(failedRunDate.getDate() + SECOND_REMINDER_DAYS);
  const secondTargetExpiryDateString = Utilities.formatDate(secondTargetExpiryDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  Logger.log(`--- Menjalankan Ulang Notifikasi Perpanjangan untuk tugas yang seharusnya berjalan pada: ${failedRunDate.toLocaleDateString('id-ID')} ---`);
  Logger.log(`--- Mencari sertifikat dengan tanggal kedaluwarsa: ${firstTargetExpiryDateString} atau ${secondTargetExpiryDateString} ---`);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet "${EMAIL_SHEET_NAME}" tidak ditemukan.`);
    return;
  }
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  data.forEach(row => {
    const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: row[i] }), {});

    if (rowData.expires) {
      const expiryDate = new Date(rowData.expires);
      const expiryDateString = Utilities.formatDate(expiryDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

      let reminderType = null;
      if (expiryDateString === firstTargetExpiryDateString) {
        reminderType = "Pemberitahuan Pertama";
      } else if (expiryDateString === secondTargetExpiryDateString) {
        reminderType = "Pemberitahuan Kedua";
      }

      if (reminderType) {
        Logger.log(`Menemukan sertifikat untuk dikirim ulang notifikasinya kepada: ${rowData.name}`);
        
        try {
           const template = HtmlService.createTemplateFromFile('expiry_template');
           template.name = rowData.name;
           template.scheme = rowData.scheme;
           template.expires = formatTanggalIndonesia(expiryDate);
           const htmlBody = template.evaluate().getContent();
           
           const subject = `${reminderType} Pemberitahuan Perpanjangan Sertifikat: ${rowData.scheme}`;
           
           GmailApp.sendEmail(rowData.nilai_kontak, subject, "", {
             htmlBody: htmlBody,
             name: SENDER_NAME
           });
           Logger.log(`Email perpanjangan (kirim ulang) berhasil dikirim ke: ${rowData.nilai_kontak}`);
        } catch (e) {
           Logger.log(`Gagal mengirim email kirim ulang ke ${rowData.nilai_kontak}. Error: ${e.toString()}`);
        }
      }
    }
  });
  
  Logger.log("--- Proses Kirim Ulang Selesai ---");
}




// ==============================================================================
// ALAT 2: KIRIM ULANG UNTUK SATU ORANG SPESIFIK
// ==============================================================================
/**
 * @description MENJALANKAN ULANG notifikasi untuk SATU ORANG SPESIFIK.
 * Gunakan ini jika hanya beberapa email yang gagal terkirim.
 *
 * CARA MENGGUNAKAN:
 * 1. Isi nilai 'targetEmail' dengan alamat email penerima.
 * 2. Isi nilai 'notificationType' dengan 'perpanjangan' atau 'ulang tahun'.
 * 3. Pilih fungsi 'resendNotificationToPerson' dari menu dropdown.
 * 4. Klik "Jalankan".
 */
function resendNotificationToPerson() {
  // --- UBAH DATA DI SINI ---
  const targetEmail = "email.penerima@example.com"; // Ganti dengan email tujuan
  const notificationType = "perpanjangan"; // "perpanjangan" atau "ulang tahun"

  if (targetEmail === "email.penerima@example.com") {
     SpreadsheetApp.getUi().alert("Anda belum mengubah email target di dalam skrip 'maintenance.gs'.");
     return;
  }

  Logger.log(`--- Mencari data untuk mengirim ulang notifikasi '${notificationType}' ke ${targetEmail} ---`);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet "${EMAIL_SHEET_NAME}" tidak ditemukan.`);
    return;
  }
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const emailIndex = headers.indexOf('nilai_kontak');

  const targetRow = data.find(row => row[emailIndex] === targetEmail);

  if (!targetRow) {
    Logger.log(`Data untuk email ${targetEmail} tidak ditemukan di sheet.`);
    return;
  }

  const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: targetRow[i] }), {});
  
  try {
    let subject = "";
    let htmlBody = "";

    if (notificationType.toLowerCase() === 'perpanjangan') {
        const expiryDate = new Date(rowData.expires);
        const template = HtmlService.createTemplateFromFile('expiry_template');
        template.name = rowData.name;
        template.scheme = rowData.scheme;
        template.expires = formatTanggalIndonesia(expiryDate);
        template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc';

        htmlBody = template.evaluate().getContent();
        subject = `Pemberitahuan Perpanjangan Sertifikat: ${rowData.scheme}`;

    } else if (notificationType.toLowerCase() === 'ulang tahun') {
        const template = HtmlService.createTemplateFromFile('birthday_template');
        template.name = rowData.name;
        htmlBody = template.evaluate().getContent();
        subject = `Selamat Ulang Tahun, ${rowData.name}!`;
    }

    GmailApp.sendEmail(rowData.nilai_kontak, subject, "", {
      htmlBody: htmlBody,
      name: SENDER_NAME
    });
    Logger.log(`Email (kirim ulang manual) berhasil dikirim ke: ${rowData.nilai_kontak}`);

  } catch (e) {
    Logger.log(`Gagal mengirim email kirim ulang manual ke ${rowData.nilai_kontak}. Error: ${e.toString()}`);
  }
}




// ==============================================================================
// ALAT 3: KIRIM ULANG UNTUK BANYAK ORANG SEKALIGUS
// ==============================================================================
/**
 * @description MENJALANKAN ULANG notifikasi untuk BEBERAPA ORANG SEKALIGUS berdasarkan nomor baris.
 *
 * CARA MENGGUNAKAN:
 * 1. Isi array 'targetNumbers' dengan nomor dari kolom 'no' di sheet Anda.
 * 2. Isi nilai 'notificationType' dengan 'perpanjangan' atau 'ulang tahun'.
 * 3. Pilih fungsi 'resendNotificationsByNumbers' dari menu dropdown.
 * 4. Klik "Jalankan".
 */
function resendNotificationsByNumbers() {
  // --- UBAH DATA DI SINI ---
  const targetNumbers = [5264,10871,13147,17151]; // Masukkan nomor dari kolom 'no' di sheet
  const notificationType = "ulang tahun"; // Pilihan: "perpanjangan" atau "ulang tahun"
  // -------------------------

  if (targetNumbers.length === 0) {
      Logger.log("Peringatan: Daftar nomor (targetNumbers) masih kosong.");
      return;
  }

  Logger.log(`===============================================================`);
  Logger.log(`MEMULAI KIRIM ULANG MANUAL CERDAS (${notificationType.toUpperCase()})`);
  Logger.log(`Target: ${targetNumbers.join(", ")}`);
  Logger.log(`===============================================================`);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const noIndex = headers.indexOf('no');
  const dataMap = new Map(data.map(row => [parseInt(row[noIndex]), row]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let successCount = 0;
  let errorCount = 0;

  targetNumbers.forEach(no => {
    const targetRow = dataMap.get(no);
    
    if (targetRow) {
      const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: targetRow[i] }), {});
      
      try {
        let subject = "";
        let htmlBody = "";

        if (notificationType.toLowerCase() === 'perpanjangan') {
            const expiryDate = new Date(rowData.expires);
            expiryDate.setHours(0, 0, 0, 0);
            
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // --- LOGIKA PENENTUAN SUBJEK BERDASARKAN INTERVAL ---
            if (diffDays < 0) {
              // KASUS: SUDAH LEWAT (OVERDUE)
              subject = `Pemberitahuan: Masa Berlaku Sertifikat ${rowData.scheme} Telah Berakhir`;
            } else if (diffDays >= 0 && diffDays <= 90) {
              // KASUS: ZONA MERAH (0 - 90 HARI)
              subject = `Tindakan Diperlukan: Masa Berlaku Sertifikat ${rowData.scheme} Segera Berakhir`;
            } else {
              // KASUS: ZONA KUNING (91 - 180 HARI ATAU LEBIH)
              subject = `Pemberitahuan Perpanjangan Sertifikat Kompetensi: ${rowData.scheme}`;
            }
            // ----------------------------------------------------

            const template = HtmlService.createTemplateFromFile('expiry_template');
            template.name = rowData.name;
            template.scheme = rowData.scheme;
            template.expires = formatTanggalIndonesia(expiryDate);
            template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc';
            template.assoc_name = rowData.assoc_name;
            template.assoc_contact = rowData.assoc_contact;
            template.assoc_web = rowData.assoc_web;
            template.assoc_benefits = rowData.assoc_benefits;

            const jobCategory = rowData.kategori_pekerjaan ? rowData.kategori_pekerjaan.toString().toLowerCase() : "";
            template.is_pasar_modal = (jobCategory === 'pasar modal');
            template.is_jasa_keuangan = (jobCategory === 'jasa keuangan');
            template.is_non_jasa_keuangan = (jobCategory === 'non jasa keuangan');
            template.bukan_pasar_modal = (template.is_jasa_keuangan || template.is_non_jasa_keuangan || jobCategory === 'belum ditentukan');

            template.theme_color = rowData.theme_color || '#1565C0';
            template.theme_bg = rowData.theme_bg || '#f5f5f5';
            template.theme_border = rowData.theme_border || '#e0e0e0';

            htmlBody = template.evaluate().getContent();
            
        } else if (notificationType.toLowerCase() === 'ulang tahun') {
            const template = HtmlService.createTemplateFromFile('birthday_template');
            template.name = rowData.name;
            htmlBody = template.evaluate().getContent();
            subject = `Selamat Ulang Tahun, ${rowData.name}!`;
        }

        GmailApp.sendEmail(rowData.nilai_kontak, subject, "", {
          htmlBody: htmlBody,
          name: SENDER_NAME
        });
        
        Logger.log(`[OK] No. ${no} - Subjek: "${subject}" dikirim ke: ${rowData.nilai_kontak}`);
        successCount++;
        Utilities.sleep(1000);

      } catch (e) {
        Logger.log(`[GAGAL] No. ${no} - Error: ${e.toString()}`);
        errorCount++;
      }
    } else {
      Logger.log(`[SKIP] No. ${no} tidak ditemukan di sheet.`);
      errorCount++;
    }
  });

  Logger.log(`===============================================================`);
  Logger.log(`PROSES SELESAI. Berhasil: ${successCount}, Gagal: ${errorCount}`);
  Logger.log(`===============================================================`);
}




// ==============================================================================
// ALAT 4: KIRIM ULANG SERTIFIKAT YANG LEWAT MASA EXPIRED
// ==============================================================================
/**
 * @description Mengirim email massal HANYA kepada peserta yang masa berlaku sertifikatnya
 * SUDAH LEWAT dari hari ini (kedaluwarsa).
 */
function runOverdueCatchUp() {
  // --- KONFIGURASI PENGIRIMAN BERTAHAP ---
  const MULAI_DARI_NOMOR = 1; 
  const JUMLAH_DATA = 18534;

  // --- FILTER SKEMA TARGET ---
  // Pilih skema yang ingin diproses. 
  // Contoh 1: ["Pengelolaan Manajemen Risiko"] -> Hanya skema ini
  // Contoh 2: ["Manajemen Risiko Utama", "Pengelolaan Manajemen Risiko"] -> Dua skema ini
  // Contoh 3: [] -> Proses SEMUA skema yang ada di range nomor
  const SKEMA_TARGET = ["Pengelolaan Manajemen Risiko"]; 

  Logger.log(`===============================================================`);
  Logger.log(`PROSES CATCH-UP BERTAHAP DIMULAI (FILTER SKEMA)`);
  Logger.log(`Range: Nomor ${MULAI_DARI_NOMOR} sampai ${MULAI_DARI_NOMOR + JUMLAH_DATA - 1}`);
  Logger.log(`Filter Skema: ${SKEMA_TARGET.length > 0 ? SKEMA_TARGET.join(", ") : "SEMUA SKEMA"}`);
  Logger.log(`===============================================================`);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let countSent = 0;
  let lastProcessedNo = 0;

  for (let i = 0; i < data.length; i++) {
    const rowData = headers.reduce((obj, header, idx) => ({ ...obj, [header]: data[i][idx] }), {});
    const currentNo = parseInt(rowData.no);

    // Filter 1: Range Nomor
    if (currentNo >= MULAI_DARI_NOMOR && currentNo < (MULAI_DARI_NOMOR + JUMLAH_DATA)) {
      
      // Filter 2: Skema Target (Jika diisi)
      const isTargetScheme = SKEMA_TARGET.length === 0 || SKEMA_TARGET.indexOf(rowData.scheme) > -1;

      if (isTargetScheme && rowData.expires) {
        const expiryDate = new Date(rowData.expires);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Syarat Kedaluwarsa (Masa Lalu)
        if (diffDays < 0) {
          try {
            const template = HtmlService.createTemplateFromFile('expiry_template');
            template.name = rowData.name;
            template.scheme = rowData.scheme;
            template.expires = formatTanggalIndonesia(expiryDate);
            template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc';
            template.assoc_name = rowData.assoc_name;
            template.assoc_contact = rowData.assoc_contact;
            template.assoc_web = rowData.assoc_web;
            template.assoc_benefits = rowData.assoc_benefits;
            
            const jobCategory = rowData.kategori_pekerjaan ? rowData.kategori_pekerjaan.toString().toLowerCase() : "";
            template.is_pasar_modal = (jobCategory === 'pasar modal');
            template.is_jasa_keuangan = (jobCategory === 'jasa keuangan');
            template.is_non_jasa_keuangan = (jobCategory === 'non jasa keuangan');
            template.bukan_pasar_modal = (template.is_jasa_keuangan || template.is_non_jasa_keuangan || jobCategory === 'belum ditentukan');
            
            template.theme_color = rowData.theme_color || '#1565C0';
            template.theme_bg = rowData.theme_bg || '#f5f5f5';
            template.theme_border = rowData.theme_border || '#e0e0e0';

            const htmlBody = template.evaluate().getContent();
            const emailSubject = `Pemberitahuan: Masa Berlaku Sertifikat ${rowData.scheme} Telah Berakhir`;
            
            GmailApp.sendEmail(rowData.nilai_kontak, emailSubject, "", {
              htmlBody: htmlBody,
              name: SENDER_NAME
            });
            
            Logger.log(`[OK] No. ${currentNo} - ${rowData.name} (${rowData.scheme}) terkirim.`);
            countSent++;
            lastProcessedNo = currentNo;
            
            Utilities.sleep(1000); 

          } catch (e) {
            Logger.log(`[GAGAL] No. ${currentNo} - ${rowData.nilai_kontak}: ${e.toString()}`);
          }
        }
      }
    }
    
    if (currentNo >= (MULAI_DARI_NOMOR + JUMLAH_DATA)) break;
  }
  
  Logger.log(`===============================================================`);
  Logger.log(`PROSES SELESAI`);
  Logger.log(`Total terkirim: ${countSent}`);
  Logger.log(`Nomor terakhir diperiksa: ${lastProcessedNo > 0 ? lastProcessedNo : MULAI_DARI_NOMOR + JUMLAH_DATA - 1}`);
  Logger.log(`===============================================================`);
}




// ==============================================================================
// ALAT 5: KIRIM ULANG SERTIFIKAT ANTARA H-90 SAMPAI H-0
// ==============================================================================
/**
 * @description Mengirim email massal untuk peserta yang masa berlakunya tinggal 0-89 hari (Zona Merah).
 * Fungsi ini menangkap data yang terlewat dari pengingat otomatis H-90.
 */
function runUpcomingCatchUp() {
  // --- KONFIGURASI PENGIRIMAN BERTAHAP ---
  const MULAI_DARI_NOMOR = 2064;   
  const JUMLAH_DATA = 5000; 

  // --- FILTER SKEMA TARGET ---
  // Contoh: ["Pengelolaan Manajemen Risiko"]
  const SKEMA_TARGET = ["Pengelolaan Manajemen Risiko"]; 

  Logger.log(`===============================================================`);
  Logger.log(`PROSES CATCH-UP ZONA MERAH (0-89 HARI) DIMULAI (FILTER SKEMA)`);
  Logger.log(`Target: Nomor ${MULAI_DARI_NOMOR} sampai ${MULAI_DARI_NOMOR + JUMLAH_DATA - 1}`);
  Logger.log(`Filter Skema: ${SKEMA_TARGET.length > 0 ? SKEMA_TARGET.join(", ") : "SEMUA SKEMA"}`);
  Logger.log(`===============================================================`);
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let countSent = 0;
  let lastProcessedNo = 0;

  for (let i = 0; i < data.length; i++) {
    const rowData = headers.reduce((obj, header, idx) => ({ ...obj, [header]: data[i][idx] }), {});
    const currentNo = parseInt(rowData.no);

    // Filter 1: Range Nomor
    if (currentNo >= MULAI_DARI_NOMOR && currentNo < (MULAI_DARI_NOMOR + JUMLAH_DATA)) {
      
      // Filter 2: Skema Target
      const isTargetScheme = SKEMA_TARGET.length === 0 || SKEMA_TARGET.indexOf(rowData.scheme) > -1;

      if (isTargetScheme && rowData.expires) {
        const expiryDate = new Date(rowData.expires);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // KONDISI: Antara Hari H (0) sampai H-89 (kurang dari 90 hari)
        if (diffDays >= 0 && diffDays < 90) {
          try {
            const template = HtmlService.createTemplateFromFile('expiry_template');
            template.name = rowData.name;
            template.scheme = rowData.scheme;
            template.expires = formatTanggalIndonesia(expiryDate);
            template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc';
            template.assoc_name = rowData.assoc_name;
            template.assoc_contact = rowData.assoc_contact;
            template.assoc_web = rowData.assoc_web;
            template.assoc_benefits = rowData.assoc_benefits;
            
            const jobCategory = rowData.kategori_pekerjaan ? rowData.kategori_pekerjaan.toString().toLowerCase() : "";
            template.is_pasar_modal = (jobCategory === 'pasar modal');
            template.is_jasa_keuangan = (jobCategory === 'jasa keuangan');
            template.is_non_jasa_keuangan = (jobCategory === 'non jasa keuangan');
            template.bukan_pasar_modal = (template.is_jasa_keuangan || template.is_non_jasa_keuangan || jobCategory === 'belum ditentukan');
            
            template.theme_color = rowData.theme_color || '#1565C0';
            template.theme_bg = rowData.theme_bg || '#f5f5f5';
            template.theme_border = rowData.theme_border || '#e0e0e0';

            const htmlBody = template.evaluate().getContent();
            const emailSubject = `Tindakan Diperlukan: Masa Berlaku Sertifikat ${rowData.scheme} Segera Berakhir`;
            
            GmailApp.sendEmail(rowData.nilai_kontak, emailSubject, "", {
              htmlBody: htmlBody,
              name: SENDER_NAME
            });
            
            Logger.log(`[OK] No. ${currentNo} - ${rowData.name} (Sisa ${diffDays} hari) terkirim.`);
            countSent++;
            lastProcessedNo = currentNo;
            Utilities.sleep(1000); 

          } catch (e) {
            Logger.log(`[GAGAL] No. ${currentNo} - ${rowData.nilai_kontak}: ${e.toString()}`);
          }
        }
      }
    }
    if (currentNo >= (MULAI_DARI_NOMOR + JUMLAH_DATA)) break;
  }
  
  Logger.log(`===============================================================`);
  Logger.log(`PROSES SELESAI. Total terkirim: ${countSent}`);
  Logger.log(`Nomor terakhir diperiksa: ${lastProcessedNo > 0 ? lastProcessedNo : MULAI_DARI_NOMOR + JUMLAH_DATA - 1}`);
  Logger.log(`===============================================================`);
}




// --- FUNGSI BANTUAN ---
function formatTanggalIndonesia(tanggal) {
  if (!(tanggal instanceof Date) || isNaN(tanggal)) return "";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${tanggal.getDate()} ${bulan[tanggal.getMonth()]} ${tanggal.getFullYear()}`;
}




// --- FUNGSI CEK LIMIT EMAIL HARIAN ---
function cekLimitEmail() {
  var sisaKuota = MailApp.getRemainingDailyQuota();
  Logger.log("Sisa kuota pengiriman email hari ini: " + sisaKuota);
  return sisaKuota;
}
