#!/bin/bash
# GitHub 推送脚本

echo "正在推送项目到 GitHub..."

# 创建 GitHub 仓库（如果需要）
echo "请在 GitHub 上手动创建仓库，然后运行以下命令："
echo ""
echo "cd lieping-calculator"
echo "git remote add origin https://github.com/你的用户名/lieping-calculator.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "或者使用 SSH："
echo "git remote add origin git@github.com:你的用户名/lieping-calculator.git"
echo ""

# 备份当前配置
echo "当前 Git 远程仓库："
cd lieping-calculator && git remote -v 2>/dev/null || echo "暂无远程仓库配置"
