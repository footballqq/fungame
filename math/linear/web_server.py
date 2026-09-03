import argparse
import json
import urllib.parse
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from equation_generator import EquationGenerator
from html_renderer import HTMLRenderer

DEFAULT_PORT = 8080

INDEX_HTML = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>方程与方程组自动出题系统</title>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --bg-color: #f3f4f6;
            --panel-bg: #ffffff;
            --text-main: #1f2937;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* 左侧配置面板 */
        .sidebar {
            width: 360px;
            background-color: var(--panel-bg);
            border-right: 1px solid #e5e7eb;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.03);
            overflow-y: auto;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
            font-weight: 700;
            color: var(--primary);
            padding-bottom: 12px;
            border-bottom: 2px solid #e5e7eb;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group label {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
        }

        input[type="text"], input[type="number"], select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s;
        }

        input[type="text"]:focus, input[type="number"]:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .type-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .type-card label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            cursor: pointer;
        }

        .type-card input[type="number"] {
            width: 70px;
            text-align: center;
        }

        .radio-group {
            display: flex;
            gap: 15px;
        }

        .radio-group label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            cursor: pointer;
        }

        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: auto;
        }

        .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-primary {
            background-color: var(--primary);
            color: #ffffff;
        }

        .btn-primary:hover {
            background-color: var(--primary-hover);
        }

        .btn-secondary {
            background-color: #10b981;
            color: #ffffff;
        }

        .btn-secondary:hover {
            background-color: #059669;
        }

        .btn-outline {
            background-color: transparent;
            border: 1px solid #d1d5db;
            color: #374151;
        }

        .btn-outline:hover {
            background-color: #f3f4f6;
        }

        /* 右侧预览区 */
        .preview-area {
            flex-grow: 1;
            background-color: #e5e7eb;
            overflow-y: auto;
            padding: 30px;
            display: flex;
            justify-content: center;
        }

        .preview-frame {
            width: 100%;
            max-width: 850px;
            height: 100%;
            min-height: 900px;
            border: none;
            background: #fff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-radius: 4px;
        }

        @media print {
            .sidebar {
                display: none !important;
            }
            body {
                overflow: visible !important;
            }
            .preview-area {
                padding: 0 !important;
                background: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="sidebar">
        <div class="brand">
            <span>📐</span> 方程自动出题器
        </div>

        <div class="form-group">
            <label for="paperTitle">试卷标题</label>
            <input type="text" id="paperTitle" value="方程与方程组小测验">
        </div>

        <div class="form-group">
            <label>题目类型与数量</label>
            
            <div class="type-card">
                <label><input type="checkbox" id="enable_1var" checked> 一元一次方程</label>
                <input type="number" id="count_1var" value="3" min="0" max="20">
            </div>

            <div class="type-card">
                <label><input type="checkbox" id="enable_2var" checked> 二元一次方程组</label>
                <input type="number" id="count_2var" value="2" min="0" max="20">
            </div>

            <div class="type-card">
                <label><input type="checkbox" id="enable_3var" checked> 三元一次方程组</label>
                <input type="number" id="count_3var" value="0" min="0" max="20">
            </div>
        </div>

        <div class="form-group">
            <label>题目难度/结构</label>
            <div class="radio-group">
                <label><input type="radio" name="difficulty" value="advanced" checked> 进阶复杂型 (推荐/同看图样式)</label>
            </div>
            <div class="radio-group" style="margin-top: 5px;">
                <label><input type="radio" name="difficulty" value="basic"> 基础标准型 (ax+b=c)</label>
            </div>
        </div>

        <div class="form-group">
            <label for="solutionMax">正整数解上限</label>
            <input type="number" id="solutionMax" value="15" min="5" max="50">
        </div>

        <div class="btn-group">
            <button class="btn btn-primary" onclick="generatePaper()">🔄 生成/换一批题目</button>
            <button class="btn btn-secondary" onclick="printPaper()">🖨️ 打印试卷 (A4/PDF)</button>
            <button class="btn btn-outline" onclick="downloadHTML()">💾 导出 HTML 文件</button>
        </div>
    </div>

    <div class="preview-area">
        <iframe id="previewFrame" class="preview-frame"></iframe>
    </div>

    <script>
        function getFormConfig() {
            const e1 = document.getElementById('enable_1var').checked;
            const e2 = document.getElementById('enable_2var').checked;
            const e3 = document.getElementById('enable_3var').checked;

            return {
                title: document.getElementById('paperTitle').value.trim() || '方程与方程组小测验',
                enable_1var: e1,
                count_1var: e1 ? Math.max(0, parseInt(document.getElementById('count_1var').value) || 0) : 0,
                enable_2var: e2,
                count_2var: e2 ? Math.max(0, parseInt(document.getElementById('count_2var').value) || 0) : 0,
                enable_3var: e3,
                count_3var: e3 ? Math.max(0, parseInt(document.getElementById('count_3var').value) || 0) : 0,
                difficulty: document.querySelector('input[name="difficulty"]:checked').value,
                solution_max: parseInt(document.getElementById('solutionMax').value) || 15
            };
        }

        async function generatePaper() {
            const config = getFormConfig();
            const totalCount = config.count_1var + config.count_2var + config.count_3var;
            
            if (totalCount === 0) {
                alert('⚠️ 题目总数不能为 0！请至少勾选一种题型并设置题目数量大于 0。');
                return;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const html = await response.text();
            const frame = document.getElementById('previewFrame');
            frame.srcdoc = html;
        }


        function printPaper() {
            const frame = document.getElementById('previewFrame');
            if (frame && frame.contentWindow) {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            }
        }

        function downloadHTML() {
            const frame = document.getElementById('previewFrame');
            const htmlContent = frame.srcdoc;
            if (!htmlContent) return;
            
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = '方程与方程组小测验.html';
            link.click();
        }

        // 页面加载完成后自动生成一次
        window.onload = generatePaper;
    </script>
</body>
</html>
'''

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(INDEX_HTML.encode('utf-8'))
        else:
            self.send_error(404, "File Not Found")

    def do_POST(self):
        if self.path == '/api/generate':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))

            questions = []
            seen_questions = set()
            difficulty = config.get('difficulty', 'advanced')
            sol_max = config.get('solution_max', 15)

            def get_unique_question(gen_fn):
                for _ in range(30):
                    item = gen_fn(difficulty, sol_max)
                    q_key = str(item["question"])
                    if q_key not in seen_questions:
                        seen_questions.add(q_key)
                        return item
                return item

            # 1. 一元一次方程
            if config.get('enable_1var'):
                for _ in range(config.get('count_1var', 0)):
                    questions.append(get_unique_question(EquationGenerator.generate_linear_1var))

            # 2. 二元一次方程组
            if config.get('enable_2var'):
                for _ in range(config.get('count_2var', 0)):
                    questions.append(get_unique_question(EquationGenerator.generate_linear_2var))

            # 3. 三元一次方程组
            if config.get('enable_3var'):
                for _ in range(config.get('count_3var', 0)):
                    questions.append(get_unique_question(EquationGenerator.generate_linear_3var))


            # 渲染 HTML 试卷
            paper_title = config.get('title', '方程与方程组小测验')
            html_output = HTMLRenderer.render_paper(paper_title, questions)

            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_output.encode('utf-8'))
        else:
            self.send_error(404, "API Not Found")

def start_server(port=DEFAULT_PORT):
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    url = f"http://localhost:{port}"
    print(f"==================================================")
    print(f"🚀 方程与方程组自动出题服务已启动！")
    print(f"👉 请在浏览器中打开: {url}")
    print(f"==================================================")
    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已关闭。")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="启动方程出题器 Web 服务")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help=f"服务器端口号 (默认: {DEFAULT_PORT})")
    args = parser.parse_args()
    start_server(args.port)

