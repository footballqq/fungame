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


def test_files_exist_and_under_line_limits():
    """验证主页三件套与说明文档文件存在且单文件 <= 500 行安全边界"""
    for file_path in [INDEX_HTML, CSS_FILE, JS_FILE, GUIDE_FILE]:
        assert os.path.isfile(file_path), f"文件必须存在: {file_path}"
        with open(file_path, "r", encoding="utf-8") as f:
            lines = len(f.readlines())
        assert lines <= 500, f"文件 {os.path.basename(file_path)} 行数为 {lines}，超过 500 行上限"


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
