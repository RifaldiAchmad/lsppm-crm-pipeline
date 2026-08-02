from extractors import extract_from_gsheets
from transformers import transform_certificate_data
from loaders import load_to_supabase

def run_pipeline():
    print("==========================================")
    print("MEMULAI ETL PIPELINE LSPPM")
    print("==========================================")
    
    # Konfigurasi Target
    SHEET_NAME = "Sheet Data Sertifikat"
    WORKFLOW_TAB = "Sertifikat"
    TARGET_TABLE = "sertifikat"
    
    try:
        # 1. EXTRACT
        raw_df = extract_from_gsheets(SHEET_NAME, WORKFLOW_TAB)
        
        # 2. TRANSFORM
        clean_df = transform_certificate_data(raw_df)
        
        # 3. LOAD
        load_to_supabase(clean_df, TARGET_TABLE)
        
        print("==========================================")
        print("ETL PIPELINE SELESAI DENGAN SUKSES")
        print("==========================================")
        
    except Exception as e:
        print(f"[CRITICAL ERROR] Pipeline gagal dijalankan: {str(e)}")
        raise e

if __name__ == "__main__":
    run_pipeline()
