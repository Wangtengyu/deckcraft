# 🚀 Agentia API Vercel 部署教程

## 📋 部署前准备

### 1. 准备 GitHub 账号
- 如果没有 GitHub 账号，先注册：https://github.com
- 登录你的 GitHub

### 2. 准备 Vercel 账号
- 访问：https://vercel.com
- 点击 "Sign Up"
- 选择 "Continue with GitHub"（用 GitHub 账号登录）
- 授权 Vercel 访问你的 GitHub

---

## 📤 部署步骤

### 第1步：推送代码到 GitHub

如果代码已经在 GitHub：
```
✅ 跳过这一步
```

如果代码在本地：
```bash
# 在 deckcraft-github 目录下
git add .
git commit -m "Add Agentia API"
git push origin main
```

### 第2步：在 Vercel 创建新项目

1. 登录 Vercel：https://vercel.com
2. 点击右上角 **"Add New..."** → **"Project"**
3. 选择 **"Import Git Repository"**
4. 找到你的 `deckcraft` 仓库
5. 点击 **"Import"**

### 第3步：配置项目

在项目配置页面：

**Framework Preset:**
```
选择: Other
```

**Root Directory:**
```
点击 "Edit"
输入: agentia-api
```

**Build Command:**
```
留空（不需要构建）
```

**Output Directory:**
```
留空
```

**Install Command:**
```
npm install
```

### 第4步：设置环境变量

在配置页面下方找到 **"Environment Variables"**：

添加以下变量：

| Name | Value |
|------|-------|
| `JWT_SECRET` | `agentia-production-secret-key-2024` |

**添加方式：**
1. 在 Name 输入框输入：`JWT_SECRET`
2. 在 Value 输入框输入：`agentia-production-secret-key-2024`
3. 点击 **"Add"**

### 第5步：部署

1. 检查所有配置是否正确
2. 点击 **"Deploy"**
3. 等待部署完成（约 1-2 分钟）
4. 看到 🎉 庆祝动画表示部署成功！

---

## ✅ 部署成功后

### 获取 API 地址

部署成功后，Vercel 会给你一个地址，类似：
```
https://deckcraft-xxx.vercel.app
```

这就是你的 API 地址！

### 测试 API

在浏览器访问：
```
https://你的域名.vercel.app/api/stats
```

应该返回：
```json
{
  "agents": 0,
  "tasks": 0,
  "knowledge": 0,
  "trades": 0
}
```

---

## 🔄 更新代码

以后修改代码后：
```bash
git add .
git commit -m "更新说明"
git push origin main
```

Vercel 会自动重新部署！

---

## 🌐 绑定自定义域名（可选）

### 1. 在 Vercel 添加域名
1. 进入你的项目
2. 点击 **"Settings"**
3. 点击 **"Domains"**
4. 输入你的域名，如：`api.agentia.ai`
5. 点击 **"Add"**

### 2. 配置 DNS
在你的域名服务商处添加 CNAME 记录：
```
类型: CNAME
名称: api
值: cname.vercel-dns.com
```

### 3. 等待生效
DNS 生效后（几分钟到几小时），就可以用自定义域名访问了！

---

## 🆘 常见问题

### Q: 部署失败怎么办？
**A:** 查看部署日志：
1. 点击失败的部署
2. 点击 **"View Function Logs"**
3. 查看错误信息

### Q: API 返回 404？
**A:** 检查路由配置：
- 确保访问的是 `/api/xxx` 路径
- 检查 vercel.json 配置是否正确

### Q: 数据会丢失吗？
**A:** 当前使用内存数据库，重启会清空：
- 这是演示版本，适合测试
- 正式版本需要连接外部数据库（如 PlanetScale、Neon）

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel 部署日志
2. 检查环境变量是否设置正确
3. 确认代码已推送到 GitHub

---

**部署成功后，告诉我你的 API 地址，我帮你更新前端配置！**
\n# Deployed at 2026-04-16 17:33:05
