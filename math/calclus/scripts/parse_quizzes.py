import re
import json
import os

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by questions
    blocks = re.split(r'(?m)^### Q', content)
    
    quizzes = []
    
    for block in blocks:
        if not block.strip():
            continue
            
        lines = block.strip().split('\n')
        
        # parse header (since '### Q' is removed by split)
        header_match = re.match(r'^(\d+)-(\d+)\s+\[(?:难度)?(L\d+)\]', lines[0])
        if not header_match:
            continue
        chapter_id, question_id, level = header_match.groups()
        
        question_data = {
            'id': f'q_{chapter_id}_{question_id}',
            'chapter': f'chapter_{chapter_id}',
            'level': level,
            'type': '',
            'topic': '',
            'question': '',
            'options': [],
            'correct': '',
            'explanations': {}
        }
        
        mode = None
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('**类型**：'):
                question_data['type'] = line.split('：')[1].strip()
            elif line.startswith('**知识点**：'):
                question_data['topic'] = line.split('：')[1].strip()
            elif line.startswith('**题目**：'):
                question_data['question'] = line.split('：', 1)[1].strip()
                mode = 'question'
            elif re.match(r'^- ([A-D])\.\s+(.*)', line):
                opt_match = re.match(r'^- ([A-D])\.\s+(.*)', line)
                question_data['options'].append({
                    'value': opt_match.group(1),
                    'text': opt_match.group(2)
                })
                mode = 'options'
            elif line.startswith('**正确答案**：'):
                question_data['correct'] = line.split('：')[1].strip()
            elif line.startswith('**解析**：'):
                question_data['explanations'][question_data['correct']] = line.split('：', 1)[1].strip()
                mode = 'explanation'
            elif line.startswith('**干扰项设计**：'):
                mode = 'distractor'
            elif mode == 'distractor' and line.startswith('-'):
                dist_match = re.match(r'^-\s+([A-D])(?:（[^）]+）)?：(.*)', line)
                if dist_match:
                    question_data['explanations'][dist_match.group(1)] = dist_match.group(2)
                elif re.match(r'^-\s+\[(.*?)\]：(.*)', line):
                    # 下册有些是用 - [错误选项]：[解析]
                    dist_match = re.match(r'^-\s+\[(.*?)\]：(.*)', line)
                    if dist_match:
                        # try to map text to A B C D if possible, but actually we need the letter.
                        # Wait, the lower volume uses - [选项A] or - A 
                        pass
            elif mode == 'question' and not line.startswith('**') and not line.startswith('- '):
                question_data['question'] += '\n' + line

        # Only add valid ones
        if question_data['question'] and question_data['options']:
            quizzes.append(question_data)
        
    return quizzes

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(os.path.dirname(base_dir), 'docs')
    
    vol1 = os.path.join(docs_dir, '06-题库-上册.md')
    vol2 = os.path.join(docs_dir, '07-题库-下册.md')
    
    all_quizzes = []
    if os.path.exists(vol1):
        all_quizzes.extend(parse_markdown(vol1))
    if os.path.exists(vol2):
        all_quizzes.extend(parse_markdown(vol2))
        
    # generate JS file
    out_path = os.path.join(base_dir, 'js', 'data', 'quizzes.js')
    
    js_content = f"export const QuizzesData = {json.dumps(all_quizzes, ensure_ascii=False, indent=2)};"
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Successfully generated quizzes.js with {len(all_quizzes)} questions.")

if __name__ == '__main__':
    main()
