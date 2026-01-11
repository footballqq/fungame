# `llm_api.py` 使用说明

本模块提供了一个统一的接口，用于调用不同提供商的大语言模型（LLM）。它的核心功能包括：

- **多提供商支持**：通过配置文件可以轻松切换不同的 LLM 服务（如 ZhipuAI, OpenRouter, OpenAI, Gemini Web API 等）。
- **模型自动回退**：对于兼容 OpenAI API 的服务，支持配置多个模型，当首选模型调用失败时，会自动尝试下一个，提高了服务的健壮性。
- **统一的调用接口**：无论后端是哪个 LLM，都使用相同的函数进行调用。
- **代理支持**：内置了通过 HTTP/HTTPS 代理发起请求的功能。

## 1. 配置文件 (`config.ini`)

模块的行为完全由 `config.ini` 文件驱动。您需要创建一个这样的文件，并根据您的需求进行配置。

**`config.ini` 文件结构示例：**

```ini
[llmsources]
; 在这里选择要使用的 LLM 源，例如 zhipuai, openrouter, openai, geminiweb 等
llmsource = openrouter

[Proxy]
; 是否使用代理
use_proxy = false
; 代理地址，如果 use_proxy = true，则需要配置
http_proxy = http://127.0.0.1:7890
https_proxy = http://127.0.0.1:7890

; --- ZhipuAI 配置 ---
[ZhipuAI]
api_key = YOUR_ZHIPUAI_API_KEY
model = glm-4

; --- OpenRouter 配置 (支持模型回退) ---
[OpenRouter]
api_key = YOUR_OPENROUTER_API_KEY
base_url = https://openrouter.ai/api/v1
; 模型可以配置多个，用逗号分隔。当第一个失败时，会自动尝试下一个。
model = google/gemini-flash-1.5, claude-3-haiku, mistralai/mistral-7b-instruct

; --- OpenAI 配置 ---
[OpenAI]
api_key = YOUR_OPENAI_API_KEY
base_url = https://api.openai.com/v1
model = gpt-4-turbo

; --- Gemini Web API 配置 (通过通用 HTTP 请求调用) ---
[GeminiWeb]
api_key = YOUR_GEMINI_API_KEY
base_url = https://generativelanguage.googleapis.com
model = gemini-1.5-flash-latest
; 超时时间（秒），默认为 60
timeout = 120
; 鉴权模式（auto, header, query），默认为 auto，会自动根据域名判断
; googleapis.com 使用 query, 其他使用 header
auth_mode = auto
; 以下为自定义鉴权细节，通常在 auth_mode = auto 时无需修改
auth_header = Authorization
auth_scheme = Bearer
auth_query_param = key

```

### 配置项说明：

- **`[llmsources]`**:
  - `llmsource`: **必需项**。指定当前要使用的 LLM 服务提供商。值必须与下面配置的某个 Section 名称（例如 `ZhipuAI`, `OpenRouter`）对应（不区分大小写）。
- **`[Proxy]`**:
  - `use_proxy`: `true` 或 `false`，控制是否启用代理。
  - `http_proxy`/`https_proxy`: 代理服务器的地址。
- **提供商配置 `[ZhipuAI]`, `[OpenRouter]`, `[OpenAI]`等**:
  - `api_key`: **必需项**。您的 API 密钥。
  - `base_url`: API 的基地址。对于非官方部署或代理时需要配置。
  - `model`: **必需项**。要使用的模型名称。
    - **特别注意**: 对于 `OpenRouter`, `OpenAI`, `DeepSeek` 等兼容 OpenAI API 的服务，`model` 字段可以包含一个或多个模型名称，用**逗号**分隔。这会激活**模型回退/轮换机制**。

## 2. 核心函数调用流程

使用 `llm_api.py` 的基本流程分为三步：

1.  **加载配置**：使用 `load_llm_config()` 从 `config.ini` 文件中加载配置。
2.  **设置客户端**：使用 `setup_llm_client()` 根据加载的配置初始化对应的 LLM 客户端。
3.  **生成回复**：使用 `generate_llm_response()` 发送提示词并获取模型的回复。

## 3. 代码示例

下面是一个完整的使用示例。假设您的 `config.ini` 文件与此代码文件在同一目录下。

```python
import os
import logging
from utils.llm_api import load_llm_config, setup_llm_client, generate_llm_response

# --- 1. 基础设置 ---
# 设置日志记录器，方便观察模块内部信息
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('LLM_API_User')

# 假设 config.ini 在项目根目录的 utils 文件夹下
try:
    from utils.config import get_utils_config_path
    config_path = get_utils_config_path('config.ini')
except (ImportError, ModuleNotFoundError):
    # 如果无法导入，使用相对路径作为备选
    config_path = os.path.join(os.path.dirname(__file__), '..', 'utils', 'config.ini')


# --- 2. 加载配置 ---
logger.info(f"从 {config_path} 加载配置...")
try:
    llm_config = load_llm_config(config_path)
    # 检查 llmsource 是否配置
    if not llm_config.has_option('llmsources', 'llmsource'):
        raise ValueError("配置文件中缺少 [llmsources] 或 llmsource 键")
except Exception as e:
    logger.error(f"加载配置文件失败: {e}")
    exit()

# --- 3. 初始化 LLM 客户端 ---
logger.info("初始化 LLM 客户端...")
try:
    # `setup_llm_client` 会根据 config.ini 的 llmsource 配置自动选择并初始化客户端
    client, llm_source, models = setup_llm_client(llm_config, logger)
    logger.info(f"客户端设置成功: source='{llm_source}', models={models}")
except ValueError as e:
    logger.error(f"设置 LLM 客户端失败: {e}")
    exit()


# --- 4. 生成回复 ---
prompt = "你好，请介绍一下你自己。"
logger.info(f"向 LLM 发送 Prompt: '{prompt}'")

try:
    # 调用 generate_llm_response 函数，它会自动处理模型回退
    response_text = generate_llm_response(client, llm_source, prompt, models, logger)
    
    logger.info("成功获取 LLM 回复:")
    print("--- LLM Response ---")
    print(response_text)
    print("--------------------")

except Exception as e:
    logger.error(f"调用 LLM 失败: {e}")

```

## 4. 函数详解

### `load_llm_config(config_file: str) -> configparser.ConfigParser`

- **功能**：加载并解析 `.ini` 配置文件。
- **参数**：
  - `config_file` (str): `config.ini` 文件的路径。
- **返回**：一个 `configparser.ConfigParser` 对象，包含了所有配置信息。

### `setup_llm_client(config: configparser.ConfigParser, logger=None) -> tuple`

- **功能**：根据配置创建并返回相应的 LLM 客户端实例。
- **参数**：
  - `config` (`ConfigParser`): 从 `load_llm_config` 返回的配置对象。
  - `logger` (optional): 一个日志记录器实例，用于输出内部状态信息。
- **返回**：一个元组 `(client, llm_source, models)`
  - `client`: 初始化好的客户端对象。注意，它的类型取决于 `llmsource`（例如，可能是 `openai.OpenAI` 的实例，或是一个字典）。您通常不需要直接操作它，只需将其传递给 `generate_llm_response`。
  - `llm_source` (str): 当前使用的 LLM 源的小写字符串，例如 `'openrouter'`。
  - `models` (list): 一个包含一个或多个模型名称的列表。

### `generate_llm_response(client, llm_source: str, prompt: str, models: list, logger=None) -> str`

- **功能**：向指定的 LLM 发送 `prompt` 并返回文本回复。它会自动处理模型轮换/回退。
- **参数**：
  - `client`, `llm_source`, `models`: 从 `setup_llm_client` 返回的元组中的三个元素。
  - `prompt` (str): 您想要发送给大模型的提示词。
  - `logger` (optional): 日志记录器实例。
- **返回**：`str` - LLM 生成的回复文本。
- **异常**：如果所有模型（包括回退模型）都调用失败，会抛出 `Exception`。
