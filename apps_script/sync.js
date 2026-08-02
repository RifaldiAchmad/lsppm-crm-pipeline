// ==============================================================================
// LOGIKA SINKRONISASI DATA (sync.gs)
// ==============================================================================
// Berisi semua fungsi yang berhubungan dengan sinkronisasi data dari Supabase.

/**
 * @description TUGAS MALAM: HANYA sinkronisasi data dari Supabase ke Google Sheets.
 * Atur pemicu (trigger) untuk menjalankan fungsi ini setiap hari antara jam 1-2 pagi.
 */
function runDailySync() {
  try {
    Logger.log("Memulai proses sinkronisasi harian...");
    updateAllSheets();
    Logger.log("Proses sinkronisasi harian selesai dengan sukses.");
  } catch(e) {
    sendErrorNotification(e, "Sinkronisasi Data Harian");
  }
}



/**
 * @description Mengorkestrasi pembaruan untuk semua sheet.
 */
function updateAllSheets() {
  syncDataFromSupabase('v_notifikasi_email', EMAIL_SHEET_NAME);
  syncDataFromSupabase('v_notifikasi_whatsapp', PHONE_SHEET_NAME);
}



/**
 * @description Mengambil data dari VIEW Supabase dan menempelkannya ke sheet target.
 * @param {string} viewName - Nama VIEW di Supabase yang akan dipanggil.
 * @param {string} sheetName - Nama sheet di Google Sheets yang akan diperbarui.
 */
function syncDataFromSupabase(viewName, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet dengan nama "${sheetName}" tidak ditemukan.`);
  }
  
  Logger.log(`Memproses sheet: ${sheetName}...`);

  // --- PERUBAHAN DI SINI: Limit dinaikkan dari 20.000 menjadi 100.000 ---
  const url = `${SUPABASE_URL}/rest/v1/${viewName}?select=*&order=no&limit=100000`;

  const options = {
    'method': 'get',
    'headers': {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 200) {
    const data = JSON.parse(responseBody);
    sheet.clear();
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const values = data.map(row => headers.map(header => row[header]));
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    }
    
    Logger.log(`Berhasil memperbarui ${data.length} baris data di sheet "${sheetName}".`);

  } else {
    throw new Error(`Gagal mengambil data untuk sheet "${sheetName}". Kode Status: ${responseCode}. Response: ${responseBody}`);
  }
}
