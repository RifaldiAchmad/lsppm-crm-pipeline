-- View untuk ditarik oleh Google Apps Script (Notifikasi Email)
create view public.v_notifikasi_email as
with
  latestcertificates as (
    select
      sertifikat.peserta_id,
      sertifikat.scheme,
      sertifikat.expires,
      row_number() over (
        partition by
          sertifikat.peserta_id,
          (
            case
              when sertifikat.scheme = any (
                array[
                  'Jenjang Kualifikasi 5 Bidang Pasar Modal Subbidang Manajemen Risiko'::text,
                  'Manajemen Risiko Utama'::text,
                  'Pengembangan Sistem Manajemen Risiko'::text
                ]
              ) then 'Grup Manajemen Risiko Utama'::text
              when sertifikat.scheme = 'Pengelolaan Manajemen Risiko'::text then 'Grup Pengelolaan MR'::text
              else sertifikat.scheme
            end
          )
        order by
          sertifikat.expires desc
      ) as rn
    from
      sertifikat
    where
      sertifikat.scheme = any (
        array[
          'Jenjang Kualifikasi 5 Bidang Pasar Modal Subbidang Manajemen Risiko'::text,
          'Manajemen Risiko Utama'::text,
          'Pengembangan Sistem Manajemen Risiko'::text,
          'Pengelolaan Manajemen Risiko'::text
        ]
      )
  )
select
  row_number() over (
    order by
      s.expires,
      p.name
  ) as no,
  p.name,
  k.nilai_kontak,
  p.birth_date,
  ri.nama_institusi,
  COALESCE(ri.kategori, 'Belum Ditentukan'::text) as kategori_pekerjaan,
  s.scheme,
  s.expires,
  COALESCE(
    rs.link_syarat,
    'https://portal.lsppm.com/rcc'::text
  ) as link_syarat,
  ra.nama_lengkap as assoc_name,
  ra.link_kontak as assoc_contact,
  ra.link_website as assoc_web,
  ra.benefits_html as assoc_benefits,
  COALESCE(ra.warna_utama, '#1565C0'::text) as theme_color,
  COALESCE(ra.warna_bg_box, '#f5f5f5'::text) as theme_bg,
  COALESCE(ra.warna_border_box, '#e0e0e0'::text) as theme_border
from
  profile p
  left join kontak k on p.id = k.peserta_id
  left join latestcertificates s on p.id = s.peserta_id
  and s.rn = 1
  left join referensi_institusi ri on p.institusi_id = ri.id
  left join perpanjangan_sertifikat pr on p.id = pr.peserta_id
  and (
    s.scheme = pr.scheme
    or (
      s.scheme = any (
        array[
          'Jenjang Kualifikasi 5 Bidang Pasar Modal Subbidang Manajemen Risiko'::text,
          'Manajemen Risiko Utama'::text,
          'Pengembangan Sistem Manajemen Risiko'::text
        ]
      )
    )
    and (
      pr.scheme = any (
        array[
          'Jenjang Kualifikasi 5 Bidang Pasar Modal Subbidang Manajemen Risiko'::text,
          'Manajemen Risiko Utama'::text,
          'Pengembangan Sistem Manajemen Risiko'::text
        ]
      )
    )
  )
  left join referensi_skema rs on s.scheme = rs.nama_skema
  left join referensi_asosiasi ra on rs.kode_asosiasi = ra.kode
where
  k.tipe_kontak::text = 'email'::text
  and (
    p.birth_date is not null
    or s.expires is not null
  )
  and pr.id is null;



-- View untuk ditarik oleh Google Apps Script (Notifikasi Whatsapp)
create view public.v_notifikasi_whatsapp as
with
  latestcertificates as (
    select
      sertifikat.peserta_id,
      sertifikat.scheme,
      sertifikat.expires,
      row_number() over (
        partition by
          sertifikat.peserta_id,
          sertifikat.scheme
        order by
          sertifikat.expires desc
      ) as rn
    from
      sertifikat
  )
select
  row_number() over (
    order by
      s.expires,
      p.name
  ) as no,
  p.name,
  k.nilai_kontak,
  p.birth_date,
  s.scheme,
  s.expires
from
  profile p
  left join kontak k on p.id = k.peserta_id
  left join latestcertificates s on p.id = s.peserta_id
  and s.rn = 1
  left join perpanjangan_sertifikat pr on p.id = pr.peserta_id
  and s.scheme = pr.scheme
where
  k.tipe_kontak::text = 'phone'::text
  and (
    p.birth_date is not null
    or s.expires is not null
  )
  and pr.id is null;
