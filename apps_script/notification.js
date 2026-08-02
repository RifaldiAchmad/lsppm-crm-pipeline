// ==============================================================================
// LOGIKA NOTIFIKASI (notifications.gs)
// ==============================================================================
// Berisi semua fungsi yang berhubungan dengan pengiriman email.

/**
 * @description Mengirim notifikasi untuk sertifikat yang akan kedaluwarsa.
 * Fungsi ini memeriksa dua kondisi: 180 hari dan 90 hari sebelum kedaluwarsa.
 */
function sendExpiryNotifications() {
  Logger.log("Memulai pengecekan notifikasi perpanjangan sertifikat...");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet "${EMAIL_SHEET_NAME}" tidak ditemukan.`);
    return;
  }
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const today = new Date();
  const firstTargetDate = new Date(today);
  firstTargetDate.setDate(today.getDate() + FIRST_REMINDER_DAYS);
  const secondTargetDate = new Date(today);
  secondTargetDate.setDate(today.getDate() + SECOND_REMINDER_DAYS);
  
  const firstTargetDateString = Utilities.formatDate(firstTargetDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const secondTargetDateString = Utilities.formatDate(secondTargetDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // LOG DINAMIS: Mengambil angka langsung dari config.gs
  Logger.log(`Tanggal target pengingat 1 (${FIRST_REMINDER_DAYS} hari): ${firstTargetDateString}`);
  Logger.log(`Tanggal target pengingat 2 (${SECOND_REMINDER_DAYS} hari): ${secondTargetDateString}`);

  data.forEach(row => {
    const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: row[i] }), {});

    if (rowData.expires) {
      const expiryDate = new Date(rowData.expires);
      const expiryDateString = Utilities.formatDate(expiryDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      let logReminderType = null; // Variabel khusus untuk log/catatan admin
      let emailSubject = "";      // Variabel khusus untuk subjek email ke peserta

      if (expiryDateString === firstTargetDateString) {
        logReminderType = "Pemberitahuan Pertama";
        emailSubject = `Pemberitahuan Perpanjangan Sertifikat Kompetensi: ${rowData.scheme}`;
        // LOG DINAMIS
        Logger.log(`Menemukan sertifikat untuk pengingat ${FIRST_REMINDER_DAYS} hari: ${rowData.name}`);
      } else if (expiryDateString === secondTargetDateString) {
        logReminderType = "Pemberitahuan Kedua";
        emailSubject = `Tindakan Diperlukan: Masa Berlaku Sertifikat ${rowData.scheme} Segera Berakhir`;
        // LOG DINAMIS
        Logger.log(`Menemukan sertifikat untuk pengingat ${SECOND_REMINDER_DAYS} hari: ${rowData.name}`);
      }

      if (logReminderType) {
        try {
          const template = HtmlService.createTemplateFromFile('expiry_template');
          template.name = rowData.name;
          template.scheme = rowData.scheme;
          template.expires = formatTanggalIndonesia(expiryDate);
          
          // Link Syarat (Wajib ada)
          template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc'; 

          // Biarkan kosong jika di database kosong.
          // Ini agar logika '<? if (assoc_name) ?>' di HTML bekerja.
          template.assoc_name = rowData.assoc_name;
          template.assoc_contact = rowData.assoc_contact;
          template.assoc_web = rowData.assoc_web;
          template.assoc_benefits = rowData.assoc_benefits;
          
          // --- LOGIKA 3 KATEGORI EKSPLISIT ---
          const jobCategory = rowData.kategori_pekerjaan ? rowData.kategori_pekerjaan.toString().toLowerCase() : "";
          
          // Identifikasi masing-masing kategori
          template.is_pasar_modal = (jobCategory === 'pasar modal');
          template.is_jasa_keuangan = (jobCategory === 'jasa keuangan');
          template.is_non_jasa_keuangan = (jobCategory === 'non jasa keuangan');
          
          // Jika dia Jasa Keuangan ATAU Non Jasa Keuangan (Alias: Bukan Pasar Modal)
          template.bukan_pasar_modal = (template.is_jasa_keuangan || template.is_non_jasa_keuangan || jobCategory === 'belum ditentukan');
          // -----------------------------
          
          // Styling
          template.theme_color = rowData.theme_color || '#1565C0';
          template.theme_bg = rowData.theme_bg || '#f5f5f5';
          template.theme_border = rowData.theme_border || '#e0e0e0';
          // -------------------------------------------------------------

          const htmlBody = template.evaluate().getContent();
          
          // Kirim email menggunakan subjek yang sudah disesuaikan
          GmailApp.sendEmail(rowData.nilai_kontak, emailSubject, "", {
            htmlBody: htmlBody,
            name: SENDER_NAME
          });
          Logger.log(`Email perpanjangan (${logReminderType}) terkirim ke: ${rowData.nilai_kontak}`);
          
          Utilities.sleep(1000); 

        } catch (e) {
          Logger.log(`Gagal mengirim email perpanjangan ke ${rowData.nilai_kontak}. Error: ${e.toString()}`);
        }
      }
    }
  });
  Logger.log("Pengecekan notifikasi perpanjangan selesai.");
}



/**
 * @description Mengirim notifikasi untuk yang berulang tahun hari ini.
 * FUNGSI INI SEKARANG MEMILIKI LOGIKA UNTUK MENCEGAH PENGIRIMAN GANDA.
 */
function sendBirthdayNotifications() {
  Logger.log("Memulai pengecekan notifikasi ulang tahun...");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const sentEmails = [];

  data.forEach(row => {
    const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: row[i] }), {});

    if (rowData.birth_date) {
      const birthDate = new Date(rowData.birth_date);
      if (birthDate.getMonth() === todayMonth && birthDate.getDate() === todayDay) {
        if (sentEmails.indexOf(rowData.nilai_kontak) === -1) {
          Logger.log(`Hari ini ulang tahun: ${rowData.name} (${rowData.nilai_kontak})`);
          try {
            const template = HtmlService.createTemplateFromFile('birthday_template');
            template.name = rowData.name;
            const htmlBody = template.evaluate().getContent();
            const subject = `Selamat Ulang Tahun, ${rowData.name}!`;
            GmailApp.sendEmail(rowData.nilai_kontak, subject, "", {
              htmlBody: htmlBody,
              name: SENDER_NAME
            });
            Logger.log(`Email ulang tahun terkirim ke: ${rowData.nilai_kontak}`);
            sentEmails.push(rowData.nilai_kontak);
            Utilities.sleep(1000);
          } catch (e) {
            Logger.log(`Gagal mengirim email ulang tahun ke ${rowData.nilai_kontak}. Error: ${e.toString()}`);
          }
        } else {
          Logger.log(`Melewatkan duplikat notifikasi ulang tahun untuk: ${rowData.nilai_kontak}`);
        }
      }
    }
  });
  Logger.log("Pengecekan notifikasi ulang tahun selesai.");
}



/**
 * @description Fungsi yang dipanggil oleh fungsi manual untuk mengirim notifikasi massal.
 */
function sendMassOverdueNotifications() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet "${EMAIL_SHEET_NAME}" tidak ditemukan.`);
    return;
  }
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  data.forEach(row => {
    const rowData = headers.reduce((obj, header, i) => ({ ...obj, [header]: row[i] }), {});
    if (rowData.expires) {
      const expiryDate = new Date(rowData.expires);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        Logger.log(`Menemukan sertifikat yang sudah kedaluwarsa untuk: ${rowData.name}`);
        try {
          const template = HtmlService.createTemplateFromFile('expiry_template');
          template.name = rowData.name;
          template.scheme = rowData.scheme;
          template.expires = formatTanggalIndonesia(expiryDate);
          
          template.link_syarat = rowData.link_syarat || 'https://portal.lsppm.com/rcc';

          // --- PERBAIKAN: HAPUS DEFAULT ---
          template.assoc_name = rowData.assoc_name;
          template.assoc_contact = rowData.assoc_contact;
          template.assoc_web = rowData.assoc_web;
          template.assoc_benefits = rowData.assoc_benefits;
          
          template.theme_color = rowData.theme_color || '#1565C0';
          template.theme_bg = rowData.theme_bg || '#f5f5f5';
          template.theme_border = rowData.theme_border || '#e0e0e0';
          // -------------------------------

          const htmlBody = template.evaluate().getContent();
          const subject = `Pemberitahuan Perpanjangan Sertifikat: ${rowData.scheme}`;
          GmailApp.sendEmail(rowData.nilai_kontak, subject, "", {
            htmlBody: htmlBody,
            name: SENDER_NAME
          });
          Logger.log(`Email perpanjangan (kedaluwarsa) terkirim ke: ${rowData.nilai_kontak}`);
          Utilities.sleep(1000);
        } catch (e) {
          Logger.log(`Gagal mengirim email (kedaluwarsa) ke ${rowData.nilai_kontak}. Error: ${e.toString()}`);
        }
      }
    }
  });
}



/**
 * @description Mengirim email notifikasi jika terjadi error.
 * @param {Error} e - Objek error yang ditangkap.
 * @param {string} taskName - Nama tugas yang gagal (misal: "Tugas Pagi").
 */
function sendErrorNotification(e, taskName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const subject = `[Error] Gagal Menjalankan ${taskName} - ${spreadsheet.getName()}`;
  const body = `
    Halo Admin,
    Telah terjadi error saat skrip tugas otomatis (${taskName}) berjalan.

    Nama Spreadsheet: ${spreadsheet.getName()}
    Waktu Error: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

    Detail Error:
    ${e.toString()}

    Stack Trace (untuk debugging):
    ${e.stack}

    Silakan periksa Log Eksekusi di Google Apps Script untuk detail lebih lanjut.
    Link ke Spreadsheet: ${spreadsheet.getUrl()}
  `;
  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
  Logger.log(`ERROR KRITIS TERDETEKSI. Notifikasi error telah dikirim ke ${ADMIN_EMAIL}. Detail: ${e.toString()}`);
}



/**
 * @description Memformat objek tanggal menjadi string "dd NamaBulan yyyy" dalam Bahasa Indonesia.
 * @param {Date} tanggal - Objek tanggal yang akan diformat.
 * @returns {string} Tanggal yang sudah diformat, contoh: "25 Maret 2026".
 */
function formatTanggalIndonesia(tanggal) {
  if (!(tanggal instanceof Date) || isNaN(tanggal)) {
    return ""; // Mengembalikan string kosong jika input tidak valid
  }
  
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const hari = tanggal.getDate();
  const namaBulan = bulan[tanggal.getMonth()];
  const tahun = tanggal.getFullYear();
  
  return `${hari} ${namaBulan} ${tahun}`;
}
