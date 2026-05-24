#!/bin/bash

# =======================================================================
# 阿里云本地全自动全栈部署脚本 (无视任何 CI/CD 平台格式限制)
# =======================================================================

# 确保脚本遇到错误立即停止，防止污染现网环境
set -e

echo "🚀 [1/5] 开始在阿里云本地编译前端..."
# 走国内淘宝镜像源，全面提速
npm config set registry https://registry.npmmirror.com
npm install
npm run build

echo "📦 [2/5] 开始处理后端 Node 依赖..."
cd server
npm config set registry https://registry.npmmirror.com
npm install --production
cd ..

echo "📂 [3/5] 正在向宝塔静态网站目录同步前端静态文件 (dist)..."
# 既然是在阿里云本地运行，直接用 cp 强行覆盖，连 SSH 密码和端口都不需要了！
mkdir -p /www/wwwroot/ai-workflow
cp -r dist/* /www/wwwroot/ai-workflow/

echo "🚚 [4/5] 正在向宝塔目录同步后端文件..."
cp -r server /www/wwwroot/ai-workflow/
cp package.json /www/wwwroot/ai-workflow/

echo "🔄 [5/5] 正在热重启宝塔中的 PM2 Node 进程..."
cd /www/wwwroot/ai-workflow/server
pm2 delete server || true
pm2 start index.js --name "server"

echo "🎉 🎉 恭喜！阿里云本地拉取并自动化部署大获全胜！网站已全面刷新！"