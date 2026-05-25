# Flask 计算器启动脚本
Write-Host "🧮 正在启动 Flask 计算器..." -ForegroundColor Green
Write-Host ""

# 激活虚拟环境
Write-Host "📦 激活虚拟环境..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# 检查依赖
Write-Host "🔍 检查依赖..." -ForegroundColor Yellow
pip list | Select-String "Flask"

Write-Host ""
Write-Host "🚀 启动服务..." -ForegroundColor Green
Write-Host "📍 访问地址: http://localhost:5000" -ForegroundColor Cyan
Write-Host "💡 按 Ctrl+C 停止服务" -ForegroundColor Gray
Write-Host ""

# 启动 Flask
python app.py
