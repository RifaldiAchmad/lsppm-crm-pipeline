# lsppm-crm-pipeline

# 🚀 End-to-End Automated CRM & Data Pipeline (LSPPM)

Sebuah sistem *Data Pipeline* dan *Customer Relationship Management* (CRM) otomatis yang dibangun untuk **Lembaga Sertifikasi Profesi Pasar Modal (LSPPM)**. 

Sistem ini mengekstraksi data operasional dari Spreadsheet, melakukan standarisasi data secara otomatis (ETL) menggunakan Python, menyimpannya secara terpusat di RDBMS (PostgreSQL/Supabase), dan menggunakan Google Apps Script untuk mengirimkan *email blasting* (notifikasi perpanjangan sertifikat dan ucapan ulang tahun) secara presisi dan personal.

---

## 🏗️ Architecture & Tech Stack

Sistem ini 100% *Cloud-Native* dan terotomatisasi secara terjadwal (Cron Jobs).

*   **Data Source & UI:** Spreadsheet Online (Input Data Operasional)
*   **ETL Processor:** Python (Pandas, Gspread, Regex) diorkestrasi oleh GitHub Actions
*   **Data Warehouse / RDBMS:** PostgreSQL (Supabase)
*   **Data Activation / Reverse ETL:** Google Apps Script (Sinkronisasi & Eksekusi Gmail API)
*   **Templating:** HTML / CSS (Responsive Email Templates)

---

## 💡 Business Problem & Solution

### Latar Belakang Masalah
1. **Inefisiensi Operasional:** Kesulitan melacak ribuan data asesi yang masa berlaku sertifikatnya akan habis. Proses manual memakan waktu dan berpotensi memicu *human error* (seperti salah kirim, *double-send*, atau salah skema).
2. **Manajemen Retensi Pelanggan (CRM):** Tidak adanya sistem proaktif untuk menjaga relasi pelanggan pasca-sertifikasi. Padahal, sentuhan personal (seperti ucapan ulang tahun) sangat krusial untuk membangun loyalitas dan memicu *awareness* terhadap skema sertifikasi lainnya (*cross-selling*).
3. **Standarisasi Data (Data Cleansing):** Input data yang masuk sering kali tidak seragam (penggunaan gelar pada nama, format tanggal yang bervariasi, dan penulisan institusi yang berantakan).

### Solusi
Membangun sistem *End-to-End Pipeline* otomatis yang:
1. **Pembersihan Data (ETL):** Skrip Python yang cerdas menghapus gelar akademik/profesi (Dr., S.E., dll.), menstandarisasi format NIK dan Tanggal Lahir, serta memfilter data institusi.
2. **Pengingat Pintar (Smart Reminder):** Sistem *trigger* Google Apps Script yang mengevaluasi *View* dari Supabase untuk mengirimkan email H-180 dan H-90 kedaluwarsa sertifikat. Notifikasi ini dirancang secara hierarkis (mencegah duplikasi peringatan untuk skema level atas/bawah) dan menyertakan promo asosiasi secara dinamis (berdasarkan kategori pekerjaan asesi).
3. **Loyalty Campaign:** Skrip pengecekan harian yang secara otomatis mengirimkan email ucapan selamat ulang tahun kepada asesi, menggunakan *template* HTML profesional dan responsif, guna menjaga *customer engagement*.

---

## ✨ Fitur Unggulan (Key Features)

*   **Additive Update (Upsert) Logic:** Skrip Python dirancang agar tidak menimpa/menghapus data (seperti NIK atau DOB) yang sudah ada di *database* jika *cell* pada *spreadsheet* sumber ternyata kosong.
*   **Smart Institution Filter:** Mencegah masuknya "data sampah" (seperti "-", "N/A", "Pribadi", atau "Freelance") ke dalam tabel referensi perusahaan.
*   **Automated "Waiting List" Trigger:** Memanfaatkan *Database Trigger* PostgreSQL (`auto_delete_waiting_list`) yang otomatis menghapus data asesi dari daftar tunggu perpanjangan (RCC) ketika sertifikat baru mereka berhasil diterbitkan dan di-*insert* ke dalam sistem.
*   **Fail-safe Notification System (Maintenance Mode):** Tersedia *tool* pemeliharaan (`maintenance.js`) bagi admin untuk melakukan *resend* (kirim ulang) notifikasi jika terjadi kegagalan sistem (*timeout* pada API Gmail), baik secara massal untuk tanggal tertentu maupun secara spesifik ke satu orang asesi.

---

## 🗄️ Database Schema (Data Modeling)

Sistem ini menerapkan Normalisasi (3NF) pada PostgreSQL. Berikut adalah struktur utama yang dibangun:

```mermaid
erDiagram
    profile ||--o{ sertifikat : "memiliki"
    profile ||--o{ perpanjangan_sertifikat : "masuk_daftar_tunggu"
    profile ||--o{ kontak : "punya_kontak"
    referensi_institusi ||--o{ profile : "tempat_bekerja"
    referensi_asosiasi ||--o{ referensi_skema : "mewadahi"
    referensi_skema ||--o{ sertifikat : "diambil_sebagai"

    profile {
        bigint id PK
        text name
        date birth_date
        varchar(16) nik UK
        bigint institusi_id FK
    }

    referensi_institusi {
        bigint id PK
        text nama_institusi UK
        text kategori
    }

    sertifikat {
        bigint id PK
        bigint peserta_id FK
        text scheme
        varchar serti_id
        date publish
        date expires
    }

    perpanjangan_sertifikat {
        bigint id PK
        bigint peserta_id FK
        text scheme
        date tanggal_ujian
        timestamp created_at
    }

    kontak {
        bigint id PK
        bigint peserta_id FK
        varchar(10) tipe_kontak
        text nilai_kontak
    }

    referensi_asosiasi {
        bigint id PK
        text kode UK
        text nama_lengkap
        text link_kontak
        text link_website
    }

    referensi_skema {
        bigint id PK
        text nama_skema UK
        text kode_asosiasi FK
        text link_syarat
    }
---

## ⚙️ Workflow Automasi Harian

Proses ini berjalan di latar belakang tanpa intervensi manual:
1. **ETL Job:** GitHub Actions menarik data operasional dari Tab `Sertifikat` dan `RCC`, memodifikasinya dengan Python, lalu memuatnya (*Load*) ke Supabase.
2. **Sync Job (Pukul 01:00 Pagi):** Google Apps Script menarik pembaruan data dari *View* Supabase (`v_notifikasi_email` dan `v_notifikasi_whatsapp`) kembali ke Sheet Kontrol Khusus untuk diaktifkan.
3. **Birthday Job (Pukul 07:00 Pagi):** Sistem mencari asesi yang berulang tahun pada hari tersebut dan mengirimkan *email* ucapan (*Loyalty Campaign*).
4. **Reminder Job (Pukul 17:00 Sore):** Sistem mengevaluasi tanggal *expired* dan mengirim *email* peringatan untuk H-180 atau H-90.

---

## 📂 Struktur Repositori

```text
├── .github/workflows/        # File orkestrasi jadwal cron (GitHub Actions)
├── sql_migrations/           # Skrip DDL Database (Tables, Views, Triggers, Functions)
├── src/                      # Skrip Python (Pembersihan Data & ETL Pipeline)
├── apps_script/              # Skrip Google Apps Script (Sistem Sinkronisasi & Email)
│   └── templates/            # File template HTML (.html) untuk body email
├── requirements.txt          # Dependensi Python
└── README.md                 # Dokumentasi Proyek
