import os
import sys
import logging

# Setup paths
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TOOLS_DIR) # history/
WORKSPACE_ROOT = os.path.dirname(PROJECT_ROOT) # fungame/

# Add utils to sys.path
sys.path.append(os.path.join(WORKSPACE_ROOT, 'utils'))

# Define resource paths
RAW_DATA_DIR = os.path.join(PROJECT_ROOT, 'raw_data')
RESOURCES_DIR = os.path.join(PROJECT_ROOT, 'resources')
CARDS_DIR = os.path.join(RESOURCES_DIR, 'cards')
MANIFEST_FILE = os.path.join(RESOURCES_DIR, 'manifest.json')

# Ensure directories exist
os.makedirs(CARDS_DIR, exist_ok=True)

# Setup logging
def setup_logging(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
