-- Fungsi untuk menghapus asesi dari tabel antrean RCC (Daftar Tunggu) 
-- ketika sertifikat barunya sudah terbit
CREATE OR REPLACE FUNCTION auto_delete_waiting_list()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM perpanjangan_sertifikat
    WHERE peserta_id = NEW.peserta_id 
      AND scheme = NEW.scheme;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
