# run_tests.ps1
# codex: 2026-06-06 运行测试脚本，验证资产门禁与反应堆方程物理正确性

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 开始运行切尔诺贝利交互游戏系统测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "[1/2] 正在运行物理动力学数学模型测试..." -ForegroundColor Yellow
python -m unittest tests/test_reactor_math.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 物理数学模型测试失败！" -ForegroundColor Red
    exit 1
}

Write-Host "✔ 反应堆物理数学模型检验成功！" -ForegroundColor Green

Write-Host "[2/2] 正在运行前端资产完整性与代码门禁测试..." -ForegroundColor Yellow
python -m unittest tests/test_game_assets.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 资产与代码门禁测试失败！" -ForegroundColor Red
    exit 1
}

Write-Host "✔ 资产与行数门禁检验成功！" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Green
Write-Host " 所有自动化单元测试全部通过！系统运行良好。" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
exit 0
