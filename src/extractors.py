import os
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd

def extract_from_gsheets(sheet_name: str, worksheet_name: str) -> pd.DataFrame:
    """
    Mengambil data mentah dari Google Sheets dan mengembalikannya dalam bentuk Pandas DataFrame.
    """
    scope = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly"
    ]
    
    # Memuat kredensial dari environment variable atau file lokal
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "service_account.json")
    creds = Credentials.from_service_account_file(creds_path, scopes=scope)
    client = gspread.authorize(creds)
    
    # Buka spreadsheet dan worksheet
    spreadsheet = client.open(sheet_name)
    worksheet = spreadsheet.worksheet(worksheet_name)
    
    # Ambil semua data sebagai dataframe
    data = worksheet.get_all_records()
    df = pd.DataFrame(data)
    
    print(f"[EXTRACT] Berhasil menarik {len(df)} baris dari Sheet: {sheet_name} ({worksheet_name})")
    return df
