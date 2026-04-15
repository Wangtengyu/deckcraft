# FDeck（秒演）产品优化方案

## 一、产品流程设计

### 1. 用户主流程

```
首页（index.html）
├── 快速生成入口（主题输入 → 直接生成）
├── 模板投喂入口 → 投喂页面（upload.html）
└── 模板选择入口 → 创建页面（create.html）
```

### 2. 三种制作模式

#### 模式A：按模板制作
- 用户选择已投喂的模板
- 输入主题或上传参考文件
- 系统套用模板风格+结构生成PPT

#### 模式B：无模板制作
- 用户输入主题 → AI生成大纲+内容
- 或用户上传参考文件 → 解析文件生成
- 基于现有逻辑生成PPT

#### 模式C：模板投喂
- 用户上传PPT模板
- 系统解析：模板结构入库（可套用）
- 系统解析：图片入库（可复用）

### 3. 差异化功能：演讲稿生成
- PPT生成完成后，询问用户
- "是否需要生成配套演讲稿？"
- 生成口播风格的Word文档

---

## 二、前端页面规划

### 1. 首页（index.html）- 重构
**核心改动：**
- 顶部导航：首页 | 模板投喂 | 我的模板
- Hero区域：快速生成入口（主题输入框）
- 模板展示区：展示已投喂的模板（分类：党政/商务/科技/教育等）
- 底部：产品特色、使用流程

**页面结构：**
```html
<nav>
  Logo + 首页 | 模板投喂 | 我的模板
</nav>

<hero>
  标题：一键生成专业演示
  副标题：AI驱动，模板丰富，质量保证
  <input> 主题输入框
  <buttons> 快速生成 | 选择模板
</hero>

<templates>
  已投喂模板展示（卡片式）
  - 党政风格
  - 商务风格
  - 科技风格
  - 教育风格
</templates>

<features>
  产品特色
  - 图片库优先，成本降低90%
  - 口播演讲稿生成
  - 模板投喂复用
</features>
```

### 2. 创建页面（create.html）- 优化
**核心改动：**
- 步骤1：选择模式（按模板 / 无模板）
- 步骤2：输入信息（主题/参考文件）
- 步骤3：风格配置
- 步骤4：生成PPT
- 步骤5：演讲稿询问

**新页面结构：**
```html
<step1> 选择创建模式
  - 按模板制作 → 展示模板列表
  - 无模板制作 → 进入自定义流程
</step1>

<step2> 输入内容
  - 主题输入
  - 参考文件上传（可选）
</step2>

<step3> 风格配置
  - 平台选择
  - 页数设置
  - 其他选项
</step4>

<step5> 生成PPT
  - 进度展示
  - 完成后询问：是否生成演讲稿？
</step5>

<step6> 演讲稿生成（可选）
  - 口播风格Word文档
  - 一键下载
</step6>
```

### 3. 模板投喂页面（upload.html）- 新增
**核心功能：**
- 上传PPT模板
- 查看解析结果
- 管理已投喂模板

**页面结构：**
```html
<upload-area>
  拖拽上传或点击选择
  支持格式：.pptx
</upload-area>

<parse-result>
  解析结果预览
  - 模板结构信息
  - 提取图片数量
  - 风格识别
</parse-result>

<template-list>
  已投喂模板列表
  - 缩略图
  - 名称、风格、图片数量
  - 删除按钮
</template-list>
```

---

## 三、后端API规划

### 1. PPT生成API（已有，需优化）

#### `/api/generate` - V9版本
**请求参数：**
```json
{
  "mode": "template|custom",
  "templateId": "tpl_xxx",  // 模板模式必填
  "topic": "主题内容",
  "refFiles": ["文件URL"],  // 参考文件（可选）
  "platform": "ppt|xiaohongshu|wechat",
  "style": "auto|party_red|business|tech_blue",
  "pageCount": 10,
  "hasCover": true,
  "hasCatalog": false,
  "hasEnding": true
}
```

**响应：**
```json
{
  "success": true,
  "downloadUrl": "xxx.pptx",
  "askSpeechScript": true  // 是否询问生成演讲稿
}
```

### 2. 演讲稿生成API（新增）

#### `/api/generate-speech-script`
**请求参数：**
```json
{
  "pptContent": {
    "title": "xxx",
    "pages": [
      {"title": "封面", "content": "..."},
      {"title": "第一节", "content": "..."}
    ]
  },
  "style": "formal|casual|storytelling"  // 正式/轻松/故事化
}
```

**响应：**
```json
{
  "success": true,
  "downloadUrl": "xxx.docx",
  "preview": "演讲稿预览文本..."
}
```

### 3. 模板投喂API（新增）

#### `/api/upload-template`
**请求：** multipart/form-data
```
file: PPT文件
name: 模板名称
category: 分类（party|business|tech|education）
```

**响应：**
```json
{
  "success": true,
  "templateId": "tpl_xxx",
  "parseResult": {
    "structure": "结构信息",
    "imageCount": 8,
    "style": "party_red",
    "images": [
      {"id": "img_001", "url": "xxx.png", "type": "cover"}
    ]
  }
}
```

### 4. 模板列表API（新增）

#### `/api/list-templates`
**请求参数：**
```json
{
  "category": "party|business|tech|education",
  "page": 1,
  "pageSize": 20
}
```

**响应：**
```json
{
  "success": true,
  "templates": [
    {
      "id": "tpl_xxx",
      "name": "党政红金模板",
      "thumbnail": "xxx.png",
      "category": "party",
      "style": "party_red",
      "imageCount": 20,
      "usageCount": 15,
      "createdAt": "2026-04-15"
    }
  ],
  "total": 10
}
```

---

## 四、数据库设计

### 1. templates 集合（已有，需扩展）
```json
{
  "_id": "tpl_xxx",
  "name": "党政红金模板",
  "category": "party",
  "style": "party_red",
  "thumbnail": "封面缩略图URL",
  "structure": {
    "hasCover": true,
    "hasCatalog": true,
    "layoutTypes": ["center", "left_title", "two_column"]
  },
  "imageCount": 20,
  "usageCount": 15,
  "createdAt": "2026-04-15T10:00:00Z"
}
```

### 2. image_library 集合（已有）
```json
{
  "_id": "img_xxx",
  "templateId": "tpl_xxx",
  "path": "图片URL",
  "type": "cover|content|toc|end",
  "style": "party_red",
  "keywords": ["党建", "红色"],
  "colors": ["#C41E3A", "#FFD700"],
  "layout": "center",
  "mood": "庄重大气",
  "quality_score": 4.8,
  "usage_count": 0
}
```

### 3. speech_scripts 集合（新增）
```json
{
  "_id": "script_xxx",
  "taskId": "task_xxx",
  "pptTitle": "PPT标题",
  "content": "演讲稿全文",
  "style": "formal",
  "createdAt": "2026-04-15T10:00:00Z"
}
```

---

## 五、开发优先级

### P0（核心功能）
1. ✅ 图片库系统（已完成）
2. ✅ V9 API（已完成，含自动初始化）
3. ⬜ 演讲稿生成API
4. ⬜ 模板投喂API

### P1（前端改造）
1. ⬜ 首页重构（index.html）
2. ⬜ 创建页优化（create.html）
3. ⬜ 模板投喂页（upload.html）

### P2（优化迭代）
1. ⬜ 模板解析算法优化
2. ⬜ 图片匹配算法优化
3. ⬜ 演讲稿质量优化

---

## 六、技术要点

### 1. 图片库优先策略
- 匹配分数≥65分：使用库图（免费）
- 匹配分数<65分：AI生图（~0.1元/张）
- 成本降低约90%

### 2. 模板解析
- 结构解析：提取页面布局、字体、配色
- 图片提取：自动入库并标记类型/风格
- 风格识别：基于配色和元素自动分类

### 3. 演讲稿生成
- 口播风格：像讲故事一样表达
- 内容结构：开场→主体→结尾
- 质量保证：流畅自然，适合朗读

---

## 七、预期效果

### 用户体验
- 模板丰富：用户可选择已投喂的高质量模板
- 成本低：图片库优先，降低90%成本
- 差异化：口播演讲稿，其他平台没有

### 产品优势
- 质量保证：投喂模板经过人工筛选
- 一致性强：图片复用，风格统一
- 功能完整：PPT+演讲稿，一站式解决
