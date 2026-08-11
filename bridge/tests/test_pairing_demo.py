# codex: 2026-08-10 防止配对演示将六组位点误画成十二条方向应答线。
from pathlib import Path
import subprocess


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def test_pairing_demo_explains_dynamic_lehman_tree_repair() -> None:
    demo = (REPOSITORY_ROOT / "pairing_demo.html").read_text(encoding="utf-8")

    assert 'js/lehman.js?v=1.0.8' in demo
    assert "LehmanPairingStrategy.PLANS['3x4']" in demo
    assert "终端 S：顶部 3 个蓝点收缩为 1 个点" in demo
    assert "终端 T：底部 3 个蓝点收缩为 1 个点" in demo
    assert "LehmanPairingStrategy._findResponse" in demo
    assert "LehmanPairingStrategy._applyResponse" in demo
    assert "切断已定位" in demo
    assert "修复的作用" in demo
    assert ".cut" in demo
    assert ".repair" in demo
    assert '树乙 T2：S → T' in demo
    assert 'treeHasSTPath' in demo
    assert '两棵树都计入' in demo
    assert 'data-tree-focus="treeOne"' in demo
    assert 'data-tree-focus="treeTwo"' in demo
    assert 'setTreeFocus' in demo
    assert '.focused-tree' in demo
    assert '.muted-tree' in demo
    assert '.shared-overlay' in demo
    assert 'shared.forEach' in demo
    assert 'function describeEdge' in demo
    assert '从上数第 ${row} 排' in demo
    assert '<code>${chosen.redId}</code>' not in demo
    assert "'步骤 8 / 8'" in demo
    assert 'renderCutParts' in demo
    assert '部分 A' in demo
    assert '为什么选绿色边' in demo
    assert '下一轮为何仍可应对' in demo
    assert 'id="changeCutBtn"' in demo
    assert '本轮讲解沿用你选择的切割' in demo
    assert 'savedCut' in demo
    assert "selectCut('rh_0_0', 'example')" in demo


def test_pairing_demo_avoids_window_top_collision() -> None:
    # codex: 2026-08-10 演示脚本运行在浏览器全局作用域，不能重声明 window.top。
    demo = (REPOSITORY_ROOT / "pairing_demo.html").read_text(encoding="utf-8")

    assert "boardTop = 92" in demo
    assert " top = 92" not in demo


def test_pairing_demo_first_render_smoke() -> None:
    # codex: 2026-08-10 运行内联脚本，确保首次加载能实际创建 SVG 节点。
    result = subprocess.run(
        ["node", "tests/smoke_pairing_demo.js"],
        cwd=REPOSITORY_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "SVG nodes" in result.stdout
