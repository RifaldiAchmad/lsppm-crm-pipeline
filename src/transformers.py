import re
import pandas as pd

def clean_name(name: str) -> str:
    """
    Membersihkan nama dari gelar akademik/profesi (Contoh: Dr., S.E., M.Si).
    """
    if pd.isna(name):
        return ""
    # Hapus gelar umum di depan atau belakang menggunakan regex
    cleaned = re.sub(r'\b(Dr\.|Ir\.|Drs\.|Prof\.)\s*', '', str(name), flags=re.IGNORECASE)
    cleaned = re.sub(r',?\s*\b(S\.E\.|M\.Si|M\.M\.|Ak\.|CPA)\b', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def transform_certificate_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Melakukan transformasi dan standarisasi pada data sertifikat.
    """
    # 1. Bersihkan nama
    if "Nama" in df.columns:
        df["clean_name"] = df["Nama"].apply(clean_name)
        
    # 2. Standarisasi format tanggal (YYYY-MM-DD)
    date_columns = ["Tanggal Lahir", "Tanggal Publish", "Tanggal Expired"]
    for col in date_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
            
    # 3. Filter data institusi yang tidak valid (institusi sampah)
    invalid_institutions = ["-", "N/A", "Pribadi", "Freelance", ""]
    if "Institusi" in df.columns:
        df = df[~df["Institusi"].isin(invalid_institutions)]

    print(f"[TRANSFORM] Data berhasil dibersihkan. Total baris valid: {len(df)}")
    return df
