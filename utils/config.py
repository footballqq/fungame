# codex: 2025-11-18 暴露 utils 配置路径以支撑 Gemini Web API
# codex: 2024-05-29 同步滚动配置键名以匹配页面控制器
import os
import json
import logging

logger = logging.getLogger('XChrome')
CONFIG_DIR = os.path.dirname(__file__)
UTILS_CONFIG_PATH = os.path.join(CONFIG_DIR, 'config.ini')


def get_utils_config_path(filename: str = 'config.ini') -> str:
    """返回 utils 目录下配置文件的绝对路径。"""
    target_path = os.path.join(CONFIG_DIR, filename)
    return os.path.abspath(target_path)


def load_config(config_path=None):
    """加载配置文件。"""

    default_config = {
        'chrome': {
            'port': 9222,
            'timeout': 30,
            'retry_count': 3
        },
        'storage': {
            'db_path': 'tweets.db',
            'batch_size': 100
        },
        'scraper': {
            'max_scrolls': 10,
            'scroll_interval': 2,
            'wait_time': 5
        },
        'logging': {
            'level': 'INFO',
            'file': 'twitter_parse.log'
        }
    }

    if not config_path:
        logger.info('使用默认配置')
        return default_config

    try:
        if not os.path.exists(config_path):
            logger.warning(f'配置文件不存在: {config_path}，使用默认配置')
            return default_config

        with open(config_path, 'r', encoding='utf-8') as file:
            user_config = json.load(file)

        merged_config = default_config.copy()
        for section, values in user_config.items():
            if section in merged_config and isinstance(values, dict):
                merged_config[section].update(values)
            else:
                merged_config[section] = values

        logger.info('成功加载配置文件')
        return merged_config
    except Exception as exc:  # pragma: no cover - 兜底日志
        logger.error(f'加载配置文件失败: {exc}')
        return default_config
