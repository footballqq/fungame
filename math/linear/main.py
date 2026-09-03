import argparse
import sys
import os
from equation_generator import EquationGenerator
from html_renderer import HTMLRenderer
from web_server import start_server

def generate_cli_paper(title, count_1var, count_2var, count_3var, difficulty, sol_max, output_file):
    total = count_1var + count_2var + count_3var
    if total <= 0:
        print("❌ 错误：题目总数不能为 0！请至少设置一种题型的数量大于 0。")
        sys.exit(1)

    questions = []
    seen_questions = set()

    def get_unique_question(gen_fn):
        for _ in range(30):
            item = gen_fn(difficulty, sol_max)
            q_key = str(item["question"])
            if q_key not in seen_questions:
                seen_questions.add(q_key)
                return item
        return item

    for _ in range(count_1var):
        questions.append(get_unique_question(EquationGenerator.generate_linear_1var))
        
    for _ in range(count_2var):
        questions.append(get_unique_question(EquationGenerator.generate_linear_2var))
        
    for _ in range(count_3var):
        questions.append(get_unique_question(EquationGenerator.generate_linear_3var))

        
    html_content = HTMLRenderer.render_paper(title, questions)
    
    output_path = os.path.abspath(output_file)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"✅ 成功生成 HTML 试卷：{output_path}")
    print(f"📄 共计生成 {len(questions)} 道题目 (一元: {count_1var}, 二元: {count_2var}, 三元: {count_3var})")
    print(f"💡 可用浏览器打开该 HTML 文件并按 Ctrl+P 直接打印。")

def main():
    parser = argparse.ArgumentParser(description="方程与方程组自动出题系统")
    parser.add_argument("--cli", action="store_true", help="使用命令行直接生成 HTML 文件（非 Web 模式）")
    parser.add_argument("--port", "-p", type=int, default=8080, help="Web 服务器端口号 (默认: 8080)")
    parser.add_argument("--title", type=str, default="方程与方程组小测验", help="试卷标题")
    parser.add_argument("--c1", type=int, default=3, help="一元一次方程数量")
    parser.add_argument("--c2", type=int, default=2, help="二元一次方程组数量")
    parser.add_argument("--c3", type=int, default=1, help="三元一次方程组数量")
    parser.add_argument("--difficulty", choices=["advanced", "basic"], default="advanced", help="题目难度结构 (advanced: 进阶复杂型, basic: 基础型)")
    parser.add_argument("--sol-max", type=int, default=15, help="正整数解的上限")
    parser.add_argument("--output", type=str, default="方程试卷.html", help="输出 HTML 文件名")

    args = parser.parse_args()

    if args.cli:
        generate_cli_paper(args.title, args.c1, args.c2, args.c3, args.difficulty, args.sol_max, args.output)
    else:
        start_server(args.port)



if __name__ == "__main__":
    main()
