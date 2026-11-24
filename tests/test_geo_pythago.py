"""
几何剪拼与弦图小大师 (math/geo_pythago) 自动化验收测试套件
涵盖：
1. 全部 JS 语法检查 (node --check)
2. 题库/微课/试卷数据完整性、无原始 LaTeX 残留、无原生 alert/confirm
3. 核心领域引擎 (engine.js) 判题、星级、模拟卷评分与雷达聚合、错题本持久化验证
4. SVG 渲染引擎 (geometry_svg.js) 全量微课与 32 道真题无异常渲染校验
"""

from pathlib import Path
import json
import re
import subprocess


ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT / "math" / "geo_pythago"
JS_DIR = PROJECT / "js"


def test_required_files_exist():
    expected = [
        PROJECT / "index.html",
        PROJECT / "css" / "style.css",
        PROJECT / "css" / "board.css",
        PROJECT / "css" / "modal.css",
        JS_DIR / "audio.js",
        JS_DIR / "geometry_svg.js",
        JS_DIR / "geo_verify.js",
        JS_DIR / "thinking_data.js",
        JS_DIR / "lessons_data.js",
        JS_DIR / "puzzles_data.js",
        JS_DIR / "exams_data.js",
        JS_DIR / "engine.js",
        JS_DIR / "cut_lab.js",
        JS_DIR / "ui.js",
        PROJECT / "Docs" / "01_几何剪拼与弦图八大核心招式速查手册.md",
        PROJECT / "Docs" / "02_几何SVG精确绘图与数学验算经验手册.md",
    ]
    for path in expected:
        assert path.exists(), f"缺少必需文件: {path}"


def test_js_syntax_with_node():
    for js_file in sorted(JS_DIR.glob("*.js")):
        res = subprocess.run(
            ["node", "--check", str(js_file)],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        assert res.returncode == 0, f"{js_file.name} 语法错误:\n{res.stderr}"


def test_no_raw_latex_or_native_dialogs():
    forbidden_latex = re.compile(r"\$\$|\\times|\\le|\\ge|\\frac|\\sqrt")
    forbidden_dialog = re.compile(r"\b(alert|confirm|prompt)\s*\(")

    for file_path in list(JS_DIR.glob("*.js")) + [PROJECT / "index.html"]:
        content = file_path.read_text(encoding="utf-8")
        assert not forbidden_latex.search(content), f"{file_path.name} 发现原始 LaTeX 标记"
        assert not forbidden_dialog.search(content), f"{file_path.name} 发现原生 alert/confirm/prompt"


def test_engine_and_data_integrity_via_node():
    script = r"""
const path = require('path');
const dir = process.argv[1];
const GeoSVG = require(path.join(dir, 'geometry_svg.js'));
const GeoVerify = require(path.join(dir, 'geo_verify.js'));
const GeoThinking = require(path.join(dir, 'thinking_data.js'));
const { LESSONS, CHEAT_SHEET } = require(path.join(dir, 'lessons_data.js'));
const { PUZZLES } = require(path.join(dir, 'puzzles_data.js'));
const { EXAMS } = require(path.join(dir, 'exams_data.js'));
const Engine = require(path.join(dir, 'engine.js'));

// 0. 解析几何构造数学验算（边长/垂直度/鞋带面积/4倍拼合守恒）
const geoReport = GeoVerify.verifyAllConstructions();
if (!Array.isArray(geoReport) || geoReport.length < 5) {
  throw new Error('解析几何验算项不足');
}
// 0.5 校验 4 条第一性原理 + 8 大招式 + 32 题思维溯源 100% 覆盖
if (!GeoThinking.FIRST_PRINCIPLES || GeoThinking.FIRST_PRINCIPLES.length !== 4) {
  throw new Error('应有 4 条底层第一性原理');
}
for (const ls of LESSONS) {
  if (!GeoThinking.LESSON_THINKING[ls.id]) throw new Error('微课缺少思维溯源: ' + ls.id);
}
for (const p of PUZZLES) {
  if (!GeoThinking.PUZZLE_THINKING[p.id]) throw new Error('真题缺少思维溯源: ' + p.id);
}

// 1. 校验 8 大招式微课完备性
if (LESSONS.length !== 8) throw new Error('应有 8 大招式微课');
const lessonIds = new Set(LESSONS.map(l => l.id));
for (const ls of LESSONS) {
  if (!ls.mantra || !ls.parentScript || ls.steps.length < 3) {
    throw new Error('微课内容不完整: ' + ls.id);
  }
  for (let s = 0; s < ls.steps.length; s++) {
    const svg = GeoSVG.renderSVG(ls.svg, s);
    if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) {
      throw new Error('微课 SVG 渲染异常: ' + ls.id);
    }
  }
}

// 2. 校验 32 道真题完整性与答案校验
if (PUZZLES.length < 28) throw new Error('真题数量不足');
const pidSet = new Set();
for (const p of PUZZLES) {
  if (pidSet.has(p.id)) throw new Error('重复题号: ' + p.id);
  pidSet.add(p.id);
  if (!lessonIds.has(p.routineId)) throw new Error('非法招式 ID: ' + p.id);
  if (!Array.isArray(p.hints) || p.hints.length !== 3) throw new Error('三阶提示不完整: ' + p.id);
  if (!p.parentCoach) throw new Error('缺少家长陪讲话术: ' + p.id);
  if (!Engine.checkAnswer(String(p.answer), p.answer)) throw new Error('标准答案自检失败: ' + p.id);
  if (!Engine.checkAnswer(' ' + p.answer + (p.unit || '') + ' ', p.answer)) throw new Error('带单位答案解析失败: ' + p.id);
  if (Engine.checkAnswer(String(p.answer + 99), p.answer)) throw new Error('错误答案误判通过: ' + p.id);
  const svg = GeoSVG.renderSVG(p.svg, 2);
  if (!svg.startsWith('<svg')) throw new Error('题目 SVG 渲染失败: ' + p.id);
}

// 3. 校验模拟卷与雷达图聚合
for (const ex of EXAMS) {
  const fullCorrectMap = {};
  ex.puzzleIds.forEach(id => {
    const pz = PUZZLES.find(x => x.id === id);
    if (!pz) throw new Error('试卷引用不存在题目: ' + id);
    fullCorrectMap[id] = String(pz.answer);
  });
  const res = Engine.gradeExam(ex, fullCorrectMap, PUZZLES, LESSONS);
  if (res.score !== 100 || !res.passed || res.weakRoutines.length !== 0) {
    throw new Error('满分模拟卷评分异常: ' + ex.id);
  }
  const radarSvg = GeoSVG.renderRadarSVG(res.radar);
  if (!radarSvg.startsWith('<svg')) throw new Error('雷达图 SVG 渲染失败');
}

// 4. 校验进度与错题本内存存储服务（含微课断点、实验室记录与彻底清空）
const mem = {};
const mockStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; }
};
const store = Engine.createProgressStore(mockStorage);
store.recordWrong('P01');
if (store.getState().wrongIds.indexOf('P01') === -1) throw new Error('错题未收录');
store.recordSolve('P01', Engine.calcStars(0));
if (store.getState().wrongIds.indexOf('P01') !== -1) throw new Error('重做答对后未移出错题本');
if (store.getState().solved['P01'].stars !== 3) throw new Error('无提示应得 3 星');
store.recordLessonProgress('R2', 1, false);
store.recordLessonProgress('R2', 2, true);
store.markLabDone('19');
store.saveContext({ parentMode: true });
const stAfter = store.getState();
if (stAfter.lessonsDone.indexOf('R2') === -1 || stAfter.lessonSteps['R2'] !== 2) throw new Error('微课进度未保存');
if (stAfter.labDone.indexOf('19') === -1) throw new Error('实验室进度未保存');
if (!stAfter.lastContext.parentMode) throw new Error('家长模式偏好未保存');
store.reset();
const stReset = store.getState();
if (Object.keys(stReset.solved).length !== 0 || stReset.lessonsDone.length !== 0 || stReset.labDone.length !== 0) {
  throw new Error('清空进度后数据未归零');
}

console.log(JSON.stringify({
  ok: true,
  lessons: LESSONS.length,
  puzzles: PUZZLES.length,
  exams: EXAMS.length,
  xuantuMethods: CHEAT_SHEET.xuantuFiveMethods.length
}));
"""
    res = subprocess.run(
        ["node", "-e", script, str(JS_DIR)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert res.returncode == 0, f"Node 逻辑自检失败:\n{res.stderr}\n{res.stdout}"
    data = json.loads(res.stdout.strip())
    assert data["ok"] is True
    assert data["lessons"] == 8
    assert data["puzzles"] == 32
    assert data["exams"] == 2
    assert data["xuantuMethods"] == 5
