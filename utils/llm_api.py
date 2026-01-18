# codex: 2025-11-18 Gemini Web API 鉴权模式增强
import configparser
import os
from typing import Any, Dict, Optional
from openai import OpenAI, BadRequestError
from urllib.parse import urlparse
# from google.oauth2 import service_account
# from google.cloud import aiplatform
# from vertexai.generative_models import GenerativeModel
try:
    from zai import ZhipuAiClient  # New official-style client (OpenAI-like)
except Exception:  # pragma: no cover - optional import fallback
    ZhipuAiClient = None

try:
    from zhipuai import ZhipuAI  # Legacy SDK fallback
except Exception:  # pragma: no cover - optional import fallback
    ZhipuAI = None
# from volcenginesdkarkruntime import Ark
import requests  # Import requests
# from mistralai import Mistral

DEFAULT_LLM_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.ini')


def load_llm_config(config_file: Optional[str] = None):
    """加载 LLM 相关的配置信息"""
    config = configparser.ConfigParser()
    target_path = config_file or DEFAULT_LLM_CONFIG_PATH
    config.read(target_path, encoding='utf-8')  # Specify encoding
    return config

def setup_llm_client(config, logger=None):
    """根据配置设置 LLM 客户端"""
    llm_source_raw = config.get('llmsources', 'llmsource', fallback='zhipuai')
    llm_source = llm_source_raw.lower()

    valid_sources = ['deepseek', 'openai', 'openrouter', 'xiaomimimo', 'google', 'mistral', 'zhipuai', 'googlecloud', 'doubao', 'geminiweb']

    # Read proxy settings
    use_proxy = config.getboolean('Proxy', 'use_proxy', fallback=False)
    http_proxy = config.get('Proxy', 'http_proxy', fallback=None)
    https_proxy = config.get('Proxy', 'https_proxy', fallback=None)
    proxies = {}
    if use_proxy and http_proxy:
        proxies['http'] = http_proxy
    if use_proxy and https_proxy:
        proxies['https'] = https_proxy

    models = []  # Initialize model list for fallback handling

    if llm_source in ['deepseek', 'openai', 'openrouter', 'xiaomimimo']:
        # These are OpenAI-compatible and can support model lists
        # Determine the correct section name, handling capitalization
        if llm_source == 'deepseek': llm_source_name = 'DeepSeek'
        elif llm_source == 'openai': llm_source_name = 'OpenAI'
        elif llm_source == 'openrouter': llm_source_name = 'OpenRouter'
        elif llm_source == 'xiaomimimo': llm_source_name = 'XiaomiMimo'

        api_key = config.get(llm_source_name, 'api_key')
        base_url = config.get(llm_source_name, 'base_url')
        model_str = config.get(llm_source_name, 'model')
        models = [m.strip() for m in model_str.split(',')]  # Parse comma-separated string
        client = OpenAI(api_key=api_key, base_url=base_url)
        llm_info = f"{llm_source_name} API, models: {models}"

    elif llm_source == 'google':
        api_key = config.get('Google', 'api_key')
        model_name = config.get('Google', 'model')
        models = [model_name] # Wrap single model in a list
        region = config.get('Google', 'region')
        llm_info = f"Google API, model: {model_name}, region: {region}"
        client = None  # Placeholder

    elif llm_source == 'mistral':
        api_key = config.get('Mistral', 'api_key')
        model_name = config.get('Mistral', 'model')
        models = [model_name] # Wrap single model in a list
        client = Mistral(api_key=api_key)
        llm_info = f"Mistral API, model: {model_name}"

    elif llm_source == 'zhipuai':
        api_key = config.get('ZhipuAI', 'api_key')
        model_name = config.get('ZhipuAI', 'model')
        models = [model_name] # Wrap single model in a list
        temperature = config.getfloat('ZhipuAI', 'temperature', fallback=0.6)
        system_prompt = config.get('ZhipuAI', 'system_prompt', fallback='你是一个有用的AI助手。')

        if ZhipuAiClient is not None:
            client = {
                "client": ZhipuAiClient(api_key=api_key),
                "temperature": temperature,
                "system_prompt": system_prompt,
            }
        elif ZhipuAI is not None:
            # Legacy fallback keeps compatibility with older environments
            client = {
                "client": ZhipuAI(api_key=api_key),
                "temperature": temperature,
                "system_prompt": system_prompt,
            }
        else:
            raise RuntimeError("ZhipuAI SDK not available: neither 'zai' nor 'zhipuai' import succeeded.")
        llm_info = f"ZhipuAI API, model: {model_name}"

    elif llm_source == 'googlecloud':
        # ... (googlecloud logic remains the same, model will be a list with one item)
        model_name = config.get('googlecloud', 'model')
        models = [model_name]
        # ... (rest of the googlecloud logic)
        llm_info = f"Google Cloud API, model: {model_name}, project: {project_id}, region: {region}"

    elif llm_source == 'doubao':
        api_key = config.get('Doubao', 'api_key')
        base_url = config.get('Doubao', 'base_url')
        model_name = config.get('Doubao', 'model')
        models = [model_name] # Wrap single model in a list
        os.environ['ARK_API_KEY'] = api_key
        client = Ark(base_url=base_url)
        llm_info = f"Doubao API, model: {model_name}"
    elif llm_source == 'geminiweb':
        section = 'GeminiWeb'
        api_key = config.get(section, 'api_key')
        base_url = config.get(section, 'base_url').rstrip('/')
        model_name = config.get(section, 'model')
        timeout = config.getint(section, 'timeout', fallback=60)
        auth_mode = config.get(section, 'auth_mode', fallback='auto').lower()
        auth_header = config.get(section, 'auth_header', fallback='Authorization')
        auth_scheme = config.get(section, 'auth_scheme', fallback='Bearer')
        auth_query_param = config.get(section, 'auth_query_param', fallback='key')
        session = requests.Session()
        if proxies:
            session.proxies.update(proxies)
        client = {
            'session': session,
            'base_url': base_url,
            'api_key': api_key,
            'timeout': timeout,
            'auth_mode': auth_mode,
            'auth_header': auth_header,
            'auth_scheme': auth_scheme,
            'auth_query_param': auth_query_param,
        }
        models = [model_name]
        llm_info = f"Gemini Web API, model: {model_name}, endpoint: {base_url}"
    else:
        error_message = (
            f"Invalid llmsource: '{llm_source_raw}'. "
            f"Please choose from the following valid sources: {valid_sources}"
        )
        if logger:
            logger.error(error_message)
        raise ValueError(error_message)

    if logger:
        logger.info(f"Using LLM: {llm_info}")
    return client, llm_source, models

def generate_llm_response(client, llm_source, prompt, models: list, logger=None):
    """使用 LLM 生成回复，支持对兼容OpenAI的API进行模型回退"""
    errors = []
    # The 'models' parameter is a list of model names.
    # For OpenAI-compatible APIs, we loop through the list.
    # For others, the list will only have one item, so the loop runs once.
    for model_name in models:
        try:
            if logger:
                logger.info(f"Attempting to use model: {model_name} via {llm_source}")

            if llm_source == 'googlecloud':
                response = client.generate_content(prompt)
                return response.text
            elif llm_source == 'zhipuai':
                client_obj = client.get("client") if isinstance(client, dict) else client
                temperature = client.get("temperature", 0.6) if isinstance(client, dict) else 0.6
                system_prompt = client.get("system_prompt") if isinstance(client, dict) else None

                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                response = client_obj.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                )
                return response.choices[0].message.content
            elif llm_source == 'doubao':
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
            elif llm_source == 'mistral':
                response = client.chat.complete(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
            elif llm_source in ['openai', 'deepseek', 'openrouter', 'xiaomimimo']:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}]
                )
                if logger:
                    logger.info(f"Successfully generated response with model: {model_name}")
                return response.choices[0].message.content.strip()
            elif llm_source == 'geminiweb':
                return _invoke_gemini_web(client, model_name, prompt, logger)
            else:
                # This case should ideally not be reached due to checks in setup_llm_client
                raise ValueError(f"Unsupported llm_source: {llm_source}")

        except Exception as e:
            error_msg = f"Model '{model_name}' failed: {e}"
            if logger:
                logger.warning(error_msg)
            errors.append(error_msg)
            # If it's the last model in the list, we will exit the loop and raise the final error
            if model_name == models[-1]:
                break
            continue  # Try the next model

    # If the loop completes, all models have failed.
    final_error_message = f"All fallback models failed for source '{llm_source}'. Errors: {errors}"
    if logger:
        logger.error(final_error_message)
    raise Exception(final_error_message)


def _invoke_gemini_web(client_config: Dict[str, Any], model_name: str, prompt: str, logger=None) -> str:
    """调用 Gemini Web API 并解析响应。"""
    session = client_config.get('session') or requests.Session()
    base_url = client_config.get('base_url', '').rstrip('/')
    timeout = client_config.get('timeout', 60)
    api_key = client_config.get('api_key')
    configured_auth_mode = client_config.get('auth_mode', 'auto')

    if not base_url:
        raise ValueError("Gemini Web API base_url 未配置。")

    endpoint = _build_gemini_endpoint(base_url, model_name)
    auth_mode = _resolve_auth_mode(base_url, configured_auth_mode)
    headers = {'Content-Type': 'application/json'}
    params = None
    auth_header = client_config.get('auth_header', 'Authorization')
    auth_scheme = client_config.get('auth_scheme', 'Bearer')
    auth_query_param = client_config.get('auth_query_param', 'key')

    if auth_mode == 'header':
        token_value = f"{auth_scheme} {api_key}".strip() if auth_scheme else api_key
        headers[(auth_header or 'Authorization')] = token_value
    elif auth_mode == 'query':
        marker = f"{auth_query_param}=".lower()
        if marker not in endpoint.lower():
            params = {auth_query_param: api_key}

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = session.post(
            endpoint,
            json=payload,
            headers=headers,
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        response_text = ""
        if exc.response is not None:
            try:
                response_text = exc.response.text.strip()
            except Exception:  # pragma: no cover - 响应文本读取失败忽略
                response_text = ""
        raise RuntimeError(
            f"Gemini Web API 请求失败: {exc} - {response_text}"
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"Gemini Web API 请求失败: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("Gemini Web API 响应不是有效的 JSON") from exc

    text = _extract_gemini_text(data)
    if logger:
        usage = data.get('usageMetadata', {})
        logger.info(f"Gemini Web API 完成，usage={usage}")
    return text


def _build_gemini_endpoint(base_url: str, model_name: str) -> str:
    """根据 base_url 构建 generateContent 端点。"""
    normalized = base_url.rstrip('/')
    lowered = normalized.lower()
    if 'models/' in lowered and ':generatecontent' in lowered:
        return normalized
    return f"{normalized}/v1beta/models/{model_name}:generateContent"


def _extract_gemini_text(response_json: Dict[str, Any]) -> str:
    """从 Gemini Web 响应中提取文本内容。"""
    candidates = response_json.get('candidates') or []
    if not candidates:
        raise RuntimeError("Gemini Web API 响应缺少 candidates 字段")

    parts = candidates[0].get('content', {}).get('parts') or []
    texts = [part.get('text', '') for part in parts if part.get('text')]
    content = ''.join(texts).strip()
    if not content:
        raise RuntimeError("Gemini Web API 响应缺少文本内容")
    return content


def _resolve_auth_mode(base_url: str, configured_mode: Optional[str]) -> str:
    """根据配置或域名决定鉴权模式。"""
    if configured_mode and configured_mode not in ('', 'auto'):
        return configured_mode
    host = urlparse(base_url).netloc.lower()
    if 'googleapis.com' in host:
        return 'query'
    return 'header'

