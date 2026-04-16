# Mixc Universe 推送指南

## 本地文件位置
```
./mixc-universe/index.html
```

## 推送到 GitHub

### 方式一：使用GitHub CLI
```bash
cd /path/to/deckcraft
mkdir -p mixc-universe
# 将 index.html 复制到 mixc-universe/
gh repo clone Wangtengyu/deckcraft
cd deckcraft
git checkout -b feat/mixc-universe
git add mixc-universe/
git commit -m "feat: 添加Mixc产品元宇宙导航中心"
git push -u origin feat/mixc-universe
# 在GitHub创建PR并合并到main
```

### 方式二：手动上传
1. 访问 https://github.com/Wangtengyu/deckcraft
2. 点击 "Add file" → "Create new file"
3. 文件名输入 `mixc-universe/index.html`
4. 粘贴 index.html 的全部内容
5. 点击 "Commit changes"

### 方式三：使用Git命令
```bash
git clone https://github.com/Wangtengyu/deckcraft.git
cd deckcraft
mkdir -p mixc-universe
# 将 index.html 复制到此目录
git add mixc-universe/
git commit -m "feat: 添加Mixc产品元宇宙导航中心"
git push origin main
```

## 启用GitHub Pages
1. 进入 https://github.com/Wangtengyu/deckcraft/settings/pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 "main", folder 选择 "/ (root)"
4. 点击 Save
5. 等待几分钟后访问: https://wangtengyu.github.io/deckcraft/mixc-universe/

## 访问地址
- GitHub Pages: https://wangtengyu.github.io/deckcraft/mixc-universe/
