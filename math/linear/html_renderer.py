class HTMLRenderer:
    """
    负责将生成的题目转化成精美的 HTML 页面
    支持浏览器实时预览、打印及 180 度颠倒倒置答案印刷
    """

    @staticmethod
    def render_paper(paper_title, questions, subtitle="方程与方程组专项训练"):
        """
        渲染完整试卷 HTML 字符串
        """
        items_html = []
        answers_html = []

        for idx, item in enumerate(questions, 1):
            q_type = item["type"]
            q_content = item["question"]
            sol = item["solution"]

            # 题目渲染
            if isinstance(q_content, list):
                # 方程组 (带大括号)
                eq_lines = "".join([f"<div>{eq}</div>" for eq in q_content])
                item_body = f'''
                <div class="system-eq">
                    <span class="left-brace">&#123;</span>
                    <div class="eq-lines">{eq_lines}</div>
                    <span class="ans-blank">的解为 ______.</span>
                </div>
                '''
            else:
                # 单个方程
                item_body = f'''
                <div class="single-eq">
                    <span>{q_content}</span>
                    <span class="ans-blank">的解为 ______.</span>
                </div>
                '''

            items_html.append(f'''
            <div class="question-item">
                <div class="q-num">{idx}、</div>
                <div class="q-content">{item_body}</div>
            </div>
            ''')

            # 答案渲染
            answers_html.append(f'<div class="ans-item"><b>{idx}.</b> {sol}</div>')

        questions_block = "\n".join(items_html)
        answers_block = "\n".join(answers_html)

        html_template = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{paper_title}</title>
    <style>
        * {{
            box-sizing: border-box;
            font-family: "SimSun", "STSong", "KaiTi", "Microsoft YaHei", serif;
        }}
        body {{
            background-color: #f4f6f9;
            margin: 0;
            padding: 20px;
            color: #111;
        }}
        .paper-container {{
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 50px;
            border-radius: 6px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            min-height: 1000px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .header {{
            text-align: center;
            border-bottom: 2px solid #222;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }}
        .title {{
            font-size: 26px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }}
        .subtitle {{
            font-size: 14px;
            color: #555;
            margin-bottom: 15px;
        }}
        .meta-info {{
            display: flex;
            justify-content: space-around;
            font-size: 15px;
            font-weight: 500;
        }}
        .meta-item {{
            border-bottom: 1px solid #333;
            padding: 0 15px 2px 15px;
            min-width: 100px;
            display: inline-block;
        }}
        .questions-list {{
            flex-grow: 1;
        }}
        .question-item {{
            display: flex;
            align-items: flex-start;
            margin-bottom: 45px;
            font-size: 17px;
            line-height: 1.8;
            page-break-inside: avoid;
        }}
        .q-num {{
            font-weight: bold;
            min-width: 35px;
        }}
        .q-content {{
            flex-grow: 1;
        }}
        .single-eq {{
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }}
        .system-eq {{
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }}
        .left-brace {{
            font-size: 42px;
            font-weight: 300;
            line-height: 1;
            margin-right: 2px;
            font-family: "Times New Roman", serif;
        }}
        .eq-lines {{
            display: flex;
            flex-direction: column;
            justify-content: center;
            font-size: 16px;
            line-height: 1.5;
        }}
        .ans-blank {{
            margin-left: 20px;
            letter-spacing: 1px;
        }}

        /* 倒置答案样式 */
        .answer-section {{
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px dashed #aaa;
            transform: rotate(180deg);
            transform-origin: center center;
            page-break-inside: avoid;
        }}
        .answer-title {{
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            color: #444;
        }}
        .answer-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 10px 20px;
            font-size: 13px;
            color: #333;
        }}
        .ans-item {{
            background: #fafafa;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #eee;
        }}

        @media print {{
            body {{
                background-color: #fff;
                padding: 0;
            }}
            .paper-container {{
                box-shadow: none;
                padding: 10mm 15mm;
                max-width: 100%;
                width: 100%;
                border-radius: 0;
            }}
            .no-print {{
                display: none !important;
            }}
        }}
    </style>
</head>
<body>

    <div class="paper-container">
        <div class="main-content">
            <div class="header">
                <div class="title">{paper_title}</div>
                <div class="subtitle">{subtitle}</div>
                <div class="meta-info">
                    <div>姓名：<span class="meta-item"></span></div>
                    <div>日期：<span class="meta-item"></span></div>
                    <div>得分：<span class="meta-item"></span></div>
                </div>
            </div>

            <div class="questions-list">
                {questions_block}
            </div>
        </div>

        <div class="answer-section">
            <div class="answer-title">【 参考答案（反向倒置印刷） 】</div>
            <div class="answer-grid">
                {answers_block}
            </div>
        </div>
    </div>

</body>
</html>
'''
        return html_template
