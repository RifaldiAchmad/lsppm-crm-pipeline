import os
import requests
import pandas as pd

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def load_to_supabase(df: pd.DataFrame, table_name: str):
    """
    Melakukan proses load (upsert) data DataFrame ke tabel Supabase.
    """
    if df.empty:
        print(f"[LOAD] DataFrame kosong. Melewati proses load ke tabel {table_name}.")
        return

    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Mendukung Upsert
    }

    # Ubah DataFrame menjadi format dictionary JSON
    records = df.to_dict(orient="records")
    
    # Kirim data secara batch atau sekaligus
    response = requests.post(url, headers=headers, json=records)
    
    if response.status_code in [200, 201]:
        print(f"[LOAD] Sukses memuat {len(records)} baris ke tabel Supabase: {table_name}")
    else:
        print(f"[LOAD ERROR] Gagal memuat data ke {table_name}. Kode: {response.status_code}, Pesan: {response.text}")
