# codex: 2026-08-10 guard the victory controls and per-game history markup against identifier regressions
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def test_victory_controls_and_move_history_are_wired() -> None:
    html = (REPOSITORY_ROOT / "index.html").read_text(encoding="utf-8")
    controller = (REPOSITORY_ROOT / "js" / "ui.js").read_text(encoding="utf-8")

    assert 'id="moveHistory"' in html
    assert 'id="moveHistoryCount"' in html
    assert 'id="playAgainBtn"' in html
    assert 'id="closeVictoryBtn"' in html
    assert "document.getElementById('soundToggleBtn')" in controller
    assert "this.dom.closeVictoryBtn.addEventListener" in controller
    assert "this.renderMoveHistory();" in controller
