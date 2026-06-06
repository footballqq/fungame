# run_tests.ps1
# codex: 2026-06-06 运行测试脚本，验证资产门禁与反应堆方程物理正确性

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Running Chernobyl Game Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "[1/2] Running Physics Dynamics Math Tests..." -ForegroundColor Yellow
python tests/test_reactor_math.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Physics Math model tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[PASS] Physics Math model tests passed!" -ForegroundColor Green

Write-Host "[2/2] Running Front-End Asset Integrity & Line Limit Tests..." -ForegroundColor Yellow
python tests/test_game_assets.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Asset & code limit tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[PASS] Asset & code limit tests passed!" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Green
Write-Host " All unit tests completed successfully." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
exit 0
