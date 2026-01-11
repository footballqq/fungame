import os
import json
import common

# Setup Logger
logger = common.setup_logging('Pack')

def pack_resources():
    cards_root = common.CARDS_DIR
    if not os.path.exists(cards_root):
        logger.error("No cards directory found.")
        return

    manifest = {
        "cards": []
    }

    cards_found = 0
    cards_valid = 0

    for card_id in os.listdir(cards_root):
        card_dir = os.path.join(cards_root, card_id)
        if not os.path.isdir(card_dir):
            continue
            
        cards_found += 1
        data_file = os.path.join(card_dir, 'data.json')
        image_file = os.path.join(card_dir, 'image.png')

        is_valid = True
        
        # Validate files exist
        if not os.path.exists(data_file):
            logger.warning(f"Missing data.json for {card_id}")
            is_valid = False
            
        if not os.path.exists(image_file):
            logger.warning(f"Missing image.png for {card_id}")
            is_valid = False
            
        if is_valid:
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # Basic schema validation could go here
                required_fields = ['id', 'name', 'year_estimate']
                for field in required_fields:
                    if field not in data:
                        logger.warning(f"Card {card_id} missing field {field}")
                        is_valid = False
                        break
                
                if is_valid:
                    # Add relative path for image to be used by frontend
                    # Frontend will load 'resources/cards/{id}/image.png'
                    data['image_path'] = f"cards/{card_id}/image.png"
                    manifest['cards'].append(data)
                    cards_valid += 1
                    
            except Exception as e:
                logger.error(f"Error reading {card_id}: {e}")

    # Check for empty manifest
    if cards_valid == 0:
        logger.warning("No valid cards found to pack.")
    else:
        # Save Manifest
        with open(common.MANIFEST_FILE, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        logger.info(f"Packed {cards_valid}/{cards_found} cards into manifest.json")

def main():
    pack_resources()

if __name__ == "__main__":
    main()
