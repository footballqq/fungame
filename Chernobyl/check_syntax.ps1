# check_syntax.ps1
# codex: 2026-06-06 检查所有JS文件的语法正确性

$ErrorActionPreference = 'Stop'

$jsFiles = Get-ChildItem -Path "E:\users\kpan\BaiduSyncdisk\program\aigc\fungame\Chernobyl\js\*.js"
foreach ($file in $jsFiles) {
    Write-Host "Checking: $($file.Name)" -ForegroundColor Cyan
    node --check $file.FullName
}
Write-Host "Syntax check completed." -ForegroundColor Green
