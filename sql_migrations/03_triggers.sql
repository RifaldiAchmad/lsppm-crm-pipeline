-- Pasang Trigger ke tabel sertifikat
CREATE TRIGGER hapus_daftar_tunggu_setelah_terbit
AFTER INSERT ON sertifikat
FOR EACH ROW
EXECUTE FUNCTION auto_delete_waiting_list();
