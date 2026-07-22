import pypdf
import os

def read_p4_notes(file_path):
    print(f"=== {os.path.basename(file_path)} ===")
    reader = pypdf.PdfReader(file_path)
    # Problem 4 solution notes should be around pages 9-13
    for page_num in range(8, 14):
        if page_num < len(reader.pages):
            print(f"--- Page {page_num+1} ---")
            print(reader.pages[page_num].extract_text())

if __name__ == "__main__":
    base_dir = r"E:\users\kpan\BaiduSyncdisk\program\aigc\fungame\imo2026"
    read_p4_notes(os.path.join(base_dir, "IMO-2026-notes.pdf"))
