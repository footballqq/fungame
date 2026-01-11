import json
import os
import sys
import common
from pypinyin import lazy_pinyin
from llm_api import load_llm_config, setup_llm_client, generate_llm_response

# Setup Logger
logger = common.setup_logging('GenMeta')

def get_pinyin_id(text):
    return "".join(lazy_pinyin(text))

def generate_metadata(idiom, client, llm_source, models):
    pinyin_id = get_pinyin_id(idiom)
    card_dir = os.path.join(common.CARDS_DIR, pinyin_id)
    data_file = os.path.join(card_dir, 'data.json')

    if os.path.exists(data_file):
        logger.info(f"Skipping {idiom} ({pinyin_id}), already exists.")
        return

    logger.info(f"Processing {idiom}...")
    
    prompt = f"""
You are a historian and art director. For the idiom '{idiom}', provide a JSON response with the following fields:
1. "id": "{pinyin_id}"
2. "name": "{idiom}"
3. "period": Estimated historical period (e.g., "Eastern Han Dynasty").
4. "year_estimate": Estimated year (integer, e.g., 208).
5. "meaning": The meaning of the idiom (Chinese).
6. "story": A brief story background (Chinese, ~100 words).
7. "prompt": An image generation prompt describing a scene from the story. Strictly follow this style: 'A trading card design with a heavy historical feel, ancient Chinese art style, realistic texture, [scene description]'.

Output ONLY valid JSON.
"""
    try:
        response_text = generate_llm_response(client, llm_source, prompt, models, logger)
        # Clean up code blocks if Present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(response_text)
        
        # Ensure ID consistency
        data['id'] = pinyin_id
        
        os.makedirs(card_dir, exist_ok=True)
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Saved metadata for {idiom}")
        
    except Exception as e:
        logger.error(f"Failed to generate metadata for {idiom}: {e}")

def main():
    # Load Config
    config = load_llm_config(common.os.path.join(common.WORKSPACE_ROOT, 'utils', 'config.ini'))
    client, llm_source, models = setup_llm_client(config, logger)

    idioms_path = os.path.join(common.RAW_DATA_DIR, 'idioms.txt')
    if not os.path.exists(idioms_path):
        logger.error(f"Idioms file not found at {idioms_path}")
        return

    with open(idioms_path, 'r', encoding='utf-8') as f:
        idioms = [line.strip() for line in f if line.strip()]

    for idiom in idioms:
        generate_metadata(idiom, client, llm_source, models)

if __name__ == "__main__":
    main()
