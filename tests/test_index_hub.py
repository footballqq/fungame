# codex: 2026-09-29 根目录 index.html 现代化改版专项自动化测试：验证5大分类、无重复项、搜索结构、文件行数与相对链接有效性
import os
import re
from bs4 import BeautifulSoup
import pytest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_HTML = os.path.join(PROJECT_ROOT, "index.html")
CSS_FILE = os.path.join(PROJECT_ROOT, "css", "index.css")
JS_FILE = os.path.join(PROJECT_ROOT, "js", "index.js")
GUIDE_FILE = os.path.join(PROJECT_ROOT, "INDEX_GUIDE.md")


def test_files_exist_and_non_empty():
    """验证主页核心文件与说明文档文件存在且非空"""
    for file_path in [INDEX_HTML, CSS_FILE, JS_FILE, GUIDE_FILE]:
        assert os.path.isfile(file_path), f"文件必须存在: {file_path}"
        with open(file_path, "r", encoding="utf-8") as f:
            lines = len(f.readlines())
        assert lines > 0, f"文件 {os.path.basename(file_path)} 不能为空"


def test_index_five_categories_and_pills():
    """验证包含 5 大认知分类专区和对应的筛选胶囊"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 验证分类胶囊
    pills = soup.find_all("button", class_="pill-btn")
    categories = [p["data-category"] for p in pills if p.has_attr("data-category")]
    expected_categories = ["all", "concepts", "olympiad", "boardgame", "language", "life"]
    assert categories == expected_categories, f"分类胶囊与预期不符: {categories}"

    # 验证五个专区容器
    for cat in ["concepts", "olympiad", "boardgame", "language", "life"]:
        sec = soup.find("section", attrs={"data-section-category": cat})
        assert sec is not None, f"必须存在专区容器: {cat}"


def test_no_duplicate_cards_and_forward_slash_links():
    """验证所有卡片标题唯一（无重复项）且链接均采用标准正斜杠 /"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    cards = soup.find_all("div", class_="game-card")
    assert len(cards) >= 35, f"卡片数量应在 35 个以上，当前检测到 {len(cards)}"

    titles = []
    for c in cards:
        h3 = c.find("h3")
        assert h3 is not None, "卡片必须包含 h3 标题"
        title = h3.get_text(strip=True)
        assert title not in titles, f"检测到重复游戏卡片: {title}"
        titles.append(title)

        links = c.find_all("a")
        assert len(links) >= 1, f"卡片 {title} 必须至少有 1 个操作按键"
        for a in links:
            href = a.get("href", "")
            assert not href.startswith("\\"), f"卡片 {title} 链接禁止使用 Windows 反斜杠: {href}"
            assert "\\" not in href, f"链接路径中不应含有反斜杠: {href}"


def test_key_games_integrated_with_rich_actions():
    """验证正方形拼图与 Dittle 等明星项目具备完备的辅助动作入口"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 正方形拼图挑战
    sq_link = soup.find("a", href="boardgame/square/index.html")
    assert sq_link is not None, "必须包含正方形拼图挑战入口"
    sq_card = sq_link.find_parent("div", class_="game-card")
    assert sq_card is not None
    sq_hrefs = [a["href"] for a in sq_card.find_all("a")]
    assert "boardgame/square/index.html#rules" in sq_hrefs, "必须包含玩法规则直达"
    assert "boardgame/square/index.html#math" in sq_hrefs, "必须包含数学原理直达"
    assert "boardgame/square/README.md" in sq_hrefs, "必须包含说明文档直达"

    # Dittle 骰战棋
    dittle_link = soup.find("a", href="boardgame/tzarr/dittle_game.html")
    assert dittle_link is not None, "必须包含 Dittle 骰战棋入口"
    dittle_card = dittle_link.find_parent("div", class_="game-card")
    dittle_hrefs = [a["href"] for a in dittle_card.find_all("a")]
    assert "boardgame/tzarr/pyxorDittle_rules_zh.html" in dittle_hrefs, "必须包含 Dittle 规则手册"


def test_search_and_empty_state_present():
    """验证即时搜索输入框与空状态容器齐备"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    assert 'id="hubSearchInput"' in html, "必须包含搜索输入框 #hubSearchInput"
    assert 'id="btnClearSearch"' in html, "必须包含清空搜索按键 #btnClearSearch"
    assert 'id="hubEmptyState"' in html, "必须包含空状态容器 #hubEmptyState"


def test_stones_parity_puzzle_in_boardgame_category():
    """验证奇偶棋子谜题归属于策略棋盘专区 (boardgame) 且配置了原理解析入口"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 验证奇偶棋子谜题卡片属性
    stones_link = soup.find("a", href="stones/index.html")
    assert stones_link is not None, "必须包含奇偶棋子谜题入口"
    stones_card = stones_link.find_parent("div", class_="game-card")
    assert stones_card is not None
    assert stones_card.get("data-category") == "boardgame", "奇偶棋子谜题类别必须为 boardgame"

    # 验证所在父专区
    parent_sec = stones_card.find_parent("section", class_="category-section")
    assert parent_sec is not None
    assert parent_sec.get("data-section-category") == "boardgame", "奇偶棋子谜题必须坐落在策略棋盘专区内"

    # 验证双动作按钮：挑战 + 原理解析
    stones_hrefs = [a["href"] for a in stones_card.find_all("a")]
    assert "stones/README.md" in stones_hrefs, "必须包含原理解析文档直达按键"

    # 验证各分类卡片数与胶囊指示一致
    pills = soup.find_all("button", class_="pill-btn")
    for p in pills:
        cat = p.get("data-category")
        count_span = p.find("span", class_="pill-count")
        if not count_span or cat == "all":
            continue
        expected_cnt = int(count_span.get_text(strip=True))
        sec = soup.find("section", attrs={"data-section-category": cat})
        assert sec is not None
        actual_cnt = len(sec.find_all("div", class_="game-card"))
        assert actual_cnt == expected_cnt, f"专区 {cat} 卡片数 ({actual_cnt}) 与胶囊指示 ({expected_cnt}) 不一致"


def test_qa_edu_mgjywyh_integrated_in_life():
    """验证民國教育委員會街机问答游戏成功接入生活素养专区且总数达到 40 项"""
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 验证游戏卡片存在
    qa_link = soup.find("a", href="oldgame/QA_edu_mgjywyh/index.html")
    assert qa_link is not None, "必须包含民國教育委員會游戏入口链接"
    qa_card = qa_link.find_parent("div", class_="game-card")
    assert qa_card is not None
    assert qa_card.get("data-category") == "life", "民國教育委員會类别必须为 life"

    # 验证所在父专区
    parent_sec = qa_card.find_parent("section", class_="category-section")
    assert parent_sec is not None
    assert parent_sec.get("data-section-category") == "life", "必须坐落在生活数学与启蒙素养专区内"

    # 验证实体文件存在
    target_html = os.path.join(PROJECT_ROOT, "oldgame", "QA_edu_mgjywyh", "index.html")
    assert os.path.isfile(target_html), f"游戏入口文件必须实际存在: {target_html}"

    # 验证全站总卡片数达到 40 项
    cards = soup.find_all("div", class_="game-card")
    assert len(cards) == 40, f"全站独立卡片数应为 40，实为 {len(cards)}"


