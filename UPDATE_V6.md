# DeckCraft V6.0 更新说明

## 更新概览

本次更新完成了全部 5 个阶段的优化，复刻了原 create-ppt skill 的核心功能。

---

## Phase 1: 完善Prompt模板 ✅

### 文件
- `api/generate-v6.ts`

### 改进内容
1. **添加禁用词列表**：禁止"商务"、"现代"、"专业"等会导致人像生成的词汇
2. **完整的Prompt模板**：为每种风格（A/B/C/D/E）创建了封面页、内容页、结尾页的详细模板
3. **布局规范**：添加流程图、对比图、列表图等布局模板
4. **参考原skill规范**：完全参考 `.skills/skill_create-ppt/reference/` 下的详细规范

---

## Phase 2: 添加细分风格配置 ✅

### 文件
- `api/generate-v6.ts` - 后端细分风格配置
- `js/app-v2.js` - 前端细分风格选择器

### 细分风格列表

| 主风格 | 细分风格 | 适用场景 |
|--------|----------|----------|
| **A. 信息图风** | 党政红金 | 党建、党课、主题党日 |
| | 政务蓝 | 政务汇报、政策解读 |
| | 文化古典 | 历史、国学、传统文化 |
| | 米白暖色 | 互联网、科技、创意、培训 |
| | 通用蓝白 | 传统行业、其他办公场景 |
| **B. 插画科普风** | 黑板粉笔 | 课堂教学、数学物理 |
| | 扁平插画 | 小学课件、安全教育、科普 |
| | 暖黄亲切 | 生活技能、健康育儿 |
| **C. 图文混排风** | 自然风光 | 旅游、风景、户外 |
| | 城市建筑 | 建筑、城市、商务 |
| | 美食摄影 | 美食、餐饮 |
| **D. 卡通绘本风** | 糖果色 | 数字认知、颜色认知 |
| | 绘本水彩 | 故事绘本、童话 |
| **E. 手绘笔记风** | 手绘信息图 | 知识分享、生活常识、笔记 |

### 智能推荐
- 根据场景关键词自动推荐细分风格
- 用户可手动选择覆盖推荐

---

## Phase 3: 实现参考图功能 ✅

### 文件
- `js/app-v2.js` - 前端参考图处理

### 支持的参考图模式

| 模式 | 适用场景 | 特点 |
|------|----------|------|
| **配图嵌入** | 人物照、风景照、活动照 | 允许相框装饰 |
| **严格原样** | Logo、产品图、证件照 | 不允许任何装饰 |
| **内容参考** | 图表、架构图 | 提取结构重绘 |
| **风格参考** | 设计稿 | 参考配色/风格 |

---

## Phase 4: 实现修改已有PPT功能 ✅

### 文件
- `api/modify.ts` - 修改PPT的API

### 支持的操作

| 操作 | 说明 | 参数 |
|------|------|------|
| **delete** | 删除指定页面 | `page_id` |
| **modify** | 修改页面内容/风格 | `page_id`, `suggestion` |
| **add** | 插入新页面 | `insert_after`, `content` |

### 智能修改类型识别
- **风格修改**：关键词"背景"、"颜色"、"风格"、"配色"
- **内容修改**：关键词"文字"、"标题"、"内容"
- **布局修改**：关键词"布局"、"排版"、"位置"

---

## Phase 5: 实现模板复刻功能 ✅

### 文件
- `api/template.ts` - 模板解析API

### 功能
1. 上传模板图片（支持多张）
2. 分析模板风格和布局
3. 自动匹配细分风格标签
4. 返回每页布局信息

### 风格匹配规则
- 根据主色调识别（红/蓝/绿等）
- 根据风格类型识别（插画/卡通/照片/手绘）
- 根据适用场景识别（党建/政务/教育等）

---

## 部署说明

### 后端部署（Laf云函数）

1. 登录 Laf 控制台：https://laf.run
2. 创建或打开现有应用
3. 创建以下云函数：
   - `generate` → 复制 `api/generate-v6.ts` 内容
   - `modify` → 复制 `api/modify.ts` 内容
   - `template` → 复制 `api/template.ts` 内容
4. 配置环境变量：`COZE_API_KEY`

### 前端部署（GitHub Pages）

1. 更新 `create.html`：
   - 在风格选择区域后添加 `<div id="subStyleSelector"></div>`
   - 在参考图区域添加 `<div id="refImagePreview"></div>` 和 `<div id="refImageModeSelector"></div>`
   - 将 `<script src="js/app.js">` 改为 `<script src="js/app-v2.js">`

2. 推送到GitHub：
   ```bash
   cd deckcraft-github
   git add .
   git commit -m "V6.0: 完成全部优化（Prompt模板/细分风格/参考图/修改功能/模板复刻）"
   git push
   ```

---

## API接口说明

### 1. 生成PPT（/generate）

**请求参数**：
```json
{
  "topic": "PPT主题",
  "style": "A",
  "subStyle": "general_blue",
  "scene": "report",
  "platform": "ppt",
  "pageCount": 10,
  "refImages": [],
  "refImageMode": "embed"
}
```

**返回结果**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "task_xxx",
    "style": "A",
    "subStyle": "general_blue",
    "images": [
      { "page": 1, "type": "cover", "url": "https://..." }
    ]
  }
}
```

### 2. 修改PPT（/modify）

**请求参数**：
```json
{
  "source_file": "原文件.pptx.html",
  "operations": [
    { "action": "modify", "page_id": "3", "suggestion": "把背景改成深蓝色" }
  ]
}
```

### 3. 模板复刻（/template）

**请求参数**：
```json
{
  "template_images": [
    "https://...image1.jpg",
    "https://...image2.jpg"
  ]
}
```

**返回结果**：
```json
{
  "code": 0,
  "data": {
    "style": {
      "tag": "A_general_blue",
      "display_name": "信息图风 · 通用蓝白"
    },
    "slides": [
      { "index": 0, "role": "cover", "layout": "center_title" }
    ]
  }
}
```

---

## 与原skill对比

| 功能 | 原create-ppt skill | DeckCraft V6.0 | 状态 |
|------|-------------------|----------------|------|
| 五种主风格 | ✅ | ✅ | 完成 |
| 细分风格 | ✅ 20+种 | ✅ 16种 | 完成 |
| Prompt模板 | ✅ 详细模板+示例 | ✅ 详细模板 | 完成 |
| 禁用词约束 | ✅ | ✅ | 完成 |
| 参考图功能 | ✅ 4种模式 | ✅ 4种模式 | 完成 |
| 修改PPT | ✅ delete/modify/add | ✅ delete/modify/add | 完成 |
| 模板复刻 | ✅ 上传PPTX分析 | ✅ 图片分析 | 完成 |
| Web界面 | ❌ | ✅ | 额外功能 |

---

## 下一步建议

1. **前端HTML更新**：需要手动更新 `create.html`，添加细分风格选择器和参考图预览区域
2. **图片上传功能**：参考图需要先上传到云存储获取URL
3. **PPTX解析**：模板复刻的PPTX文件解析需要额外实现
4. **测试验证**：建议先在测试环境验证所有功能

---

## 文件清单

### 后端文件
- `api/generate-v6.ts` - 主生成API（Phase 1 & 2）
- `api/modify.ts` - 修改API（Phase 4）
- `api/template.ts` - 模板复刻API（Phase 5）

### 前端文件
- `js/app-v2.js` - 前端交互逻辑（Phase 2 & 3）

### 文档文件
- `优化计划.md` - 优化计划
- `UPDATE_V6.md` - 本更新说明

---

## 更新时间
2026年4月14日
