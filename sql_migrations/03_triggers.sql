-- 1. Buat Function
CREATE OR REPLACE FUNCTION auto_delete_waiting_list()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM perpanjangan_sertifikat
    WHERE peserta_id = NEW.peserta_id 
      AND scheme = NEW.scheme;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Pasang Trigger ke tabel sertifikat
CREATE TRIGGER hapus_daftar_tunggu_setelah_terbit
AFTER INSERT ON sertifikat
FOR EACH ROW
EXECUTE FUNCTION auto_delete_waiting_list();
