# DeckCraft 部署指南

## 一、后端API部署到Laf

### 1. 注册Laf账号
访问：https://laf.dev/
- 点击"注册"
- 支持GitHub、微信、手机号登录

### 2. 创建应用
- 点击"新建应用"
- 应用名称：`deckcraft`
- 选择区域：上海/北京
- 点击"确定"

### 3. 创建云函数
- 进入应用，点击左侧"函数" → "添加"
- 函数名：`generate`
- 方法：POST
- 模板：空模板
- 点击"确定"

### 4. 复制代码
- 将 `api/generate-v2.js` 的内容粘贴到编辑器
- 点击右上角"部署"

### 5. 获取API地址
- 部署成功后，顶部会显示云函数URL
- 格式：`https://xxxxxx.laf.dev/generate`
- 复制这个URL

## 二、前端配置

### 1. 更新API地址
编辑 `js/app.js`，第5行：
```javascript
const API_URL = 'https://你的云函数地址.laf.dev/generate';
```

### 2. 本地测试
```bash
# 在项目目录启动本地服务器
python3 -m http.server 8080

# 访问
http://localhost:8080/index.html
```

## 三、前端部署到GitHub Pages

### 1. 创建GitHub仓库
- 访问：https://github.com/new
- 仓库名：`deckcraft`
- 设为Public
- 勾选"Add a README file"

### 2. 上传文件
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/deckcraft.git
git push -u origin main
```

### 3. 开启GitHub Pages
- 进入仓库Settings → Pages
- Source: Deploy from a branch
- Branch: main, / (root)
- 点击Save

### 4. 访问地址
`https://你的用户名.github.io/deckcraft/`

## 四、配置环境变量（可选）

在Laf中配置Coze API Key：
- 左侧"设置" → "环境变量"
- 添加：`COZE_API_KEY` = `你的API Key`
- 点击"更新"

这样用户可以使用平台API，无需自己提供Key。

## 五、域名配置（可选）

### GitHub Pages自定义域名
1. 在仓库根目录创建 `CNAME` 文件
2. 内容：`deckcraft.yourdomain.com`
3. 在域名DNS添加CNAME记录指向 `你的用户名.github.io`

### Laf自定义域名
1. 左侧"存储" → 创建Bucket
2. 上传前端文件
3. 开启"网站托管"
4. 配置自定义域名

---

## 文件结构

```
deckcraft/
├── index.html          # 首页
├── create.html         # 创建页
├── api/
│   ├── generate.js     # API v1
│   └── generate-v2.js  # API v2（推荐）
└── js/
    └── app.js          # 前端交互
```

## API参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | string | ✅ | PPT主题 |
| platform | string | | 目标平台：ppt/xiaohongshu/wechat/mobile/poster |
| audience | string | | 受众：child/student/adult/professional |
| scene | string | | 场景：report/proposal/training/science/process |
| style | string | | 风格：A/B/C/D/E |
| pageCount | number | | 页数：5-20 |
| contentDensity | string | | 密度：high/medium/low |
| apiKey | string | | 用户API Key |
| usePlatformApi | boolean | | 是否使用平台API |

## 下一步

1. ✅ 前端完成
2. ✅ 后端API完成
3. ⬜ 部署到Laf
4. ⬜ 部署到GitHub Pages
5. ⬜ 接入支付（可选）
