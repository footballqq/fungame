# codex: 2026-07-22 Run frontend JavaScript regression tests from the pytest suite.
import subprocess
from pathlib import Path


def test_frontend_javascript_regression():
    """Verify browser geometry, strategy, and demo data via the real JS source."""
    project_root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        ['node', str(project_root / 'tests' / 'js_frontend_regression.js')],
        cwd=project_root,
        check=False,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr or result.stdout
