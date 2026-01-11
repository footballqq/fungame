import os
import json
import common
from PIL import Image, ImageDraw, ImageFont

# Setup Logger
logger = common.setup_logging('GenImage')

def create_mock_image(card_dir, data):
    image_path = os.path.join(card_dir, 'image.png')
    if os.path.exists(image_path):
        logger.info(f"Image exists for {data['name']}, skipping.")
        return

    # Create a simple image
    width, height = 300, 400
    color = (200, 190, 160)  # Beige/Paper-like
    image = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(image)

    # Draw Text (Need to handle fonts, defaulting to basic for now)
    # Ideally we'd use a Chinese font, but for mock we can just confirm it works
    # Or just save the file. 
    # To avoid font issues in this mock env, we'll just save the colored block.
    # In a real scenario we would try to load a font or use default.
    
    # Draw Border
    draw.rectangle([10, 10, width-10, height-10], outline=(100, 50, 50), width=5)
    
    # Try to draw text if safe, otherwise just color is fine for mock
    try:
        # Use default font
        # draw.text((50, 150), data['name'], fill=(0,0,0)) 
        pass 
    except Exception:
        pass

    image.save(image_path)
    logger.info(f"Generated mock image for {data['name']}")

def main():
    cards_root = common.CARDS_DIR
    if not os.path.exists(cards_root):
        logger.error("No cards directory found.")
        return

    for card_id in os.listdir(cards_root):
        card_dir = os.path.join(cards_root, card_id)
        data_file = os.path.join(card_dir, 'data.json')
        
        if not os.path.exists(data_file):
            continue

        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        create_mock_image(card_dir, data)

if __name__ == "__main__":
    main()
