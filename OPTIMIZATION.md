# DeckCraft 优化功能部署指南

## 新增功能

### 1. 等待窗口优化 ✅
- **动态进度条动画**：圆形进度环，渐变色
- **实时进度显示**：显示当前生成页数
- **步骤状态指示**：初始化→封面→内容页→完成

### 2. 案例库展示 ✅
- **横向滚动轮播**：自动滚动，可暂停
- **真实案例数据**：从 `data/cases.json` 读取
- **交互功能**：左右箭头、暂停/播放、悬停效果

### 3. 访问统计 ✅
- **生成次数显示**：首页显示"已有XXX次生成"
- **动态更新**：生成完成后自动+1

---

## 文件清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `api/deckcraft-stats.ts` | 统计、限流、案例库API |
| `api/progress.ts` | 进度查询API |
| `api/generate-v3.ts` | 支持进度返回的生成API |
| `data/cases.json` | 案例数据 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `index.html` | 添加案例滚动展示区域、JavaScript逻辑 |
| `js/app.js` | 添加进度条轮询逻辑 |
| `create.html` | 兼容进度条显示 |

---

## 快速配置（无需飞书）

当前实现为**离线模式**，数据存储在本地缓存中，可以立即使用。

如需使用飞书多维表格存储，请按以下步骤配置：

### 飞书多维表格配置

#### 1. 创建应用
1. 打开 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 获取 `App ID` 和 `App Secret`

#### 2. 配置权限
在应用权限管理中添加：
- `bitable:app` - 多维表格
- `bitable:table` - 多维表格表项

#### 3. 创建多维表格

**案例库表** (bitable_cases)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | 文本 | 案例标题 |
| style | 文本 | 风格 |
| platform | 文本 | 平台 |
| thumbnail | 文本 | 缩略图URL |
| author | 文本 | 作者 |
| page_count | 数字 | 页数 |
| created_at | 时间 | 创建时间 |

**访问统计表** (bitable_stats)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| ip | 文本 | IP地址 |
| endpoint | 文本 | API端点 |
| params | 文本 | 参数 |
| created_at | 时间 | 时间 |
| date | 文本 | 日期 |

**限流表** (bitable_rate)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| ip | 文本 | IP地址 |
| action | 文本 | 动作 |
| reason | 文本 | 原因 |
| banned_until | 时间 | 封禁截止 |
| created_at | 时间 | 创建时间 |

#### 4. 配置环境变量

在 Laf 云函数中设置：
```
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
BITABLE_APP_TOKEN=xxxxx
BITABLE_TABLE_ID=xxxxx
STATS_TABLE_ID=xxxxx
RATE_TABLE_ID=xxxxx
```

---

## API 接口说明

### 统计API
```
POST https://ig8u65l6vm.sealosbja.site/deckcraft-stats
```

**请求参数：**
```json
{
  "action": "get_stats" | "record_visit" | "increment_gen" | "add_case" | "get_cases"
}
```

### 进度API
```
POST https://ig8u65l6vm.sealosbja.site/progress
```

**请求参数：**
```json
{
  "action": "create" | "update" | "get" | "complete" | "fail",
  "taskId": "task_xxx"
}
```

---

## 案例数据更新

编辑 `data/cases.json` 文件即可更新案例：

```json
{
  "cases": [
    {
      "id": "case_001",
      "title": "您的案例标题",
      "style": "信息图风",
      "platform": "PPT",
      "thumbnail": "图片URL（可选）",
      "author": "作者名",
      "created_at": "2026-04-15"
    }
  ],
  "total_generations": 12345,
  "last_updated": "2026-04-15"
}
```

---

## 部署检查清单

- [x] `api/generate-v3.ts` - 上传到Laf云函数
- [x] `api/progress.ts` - 上传到Laf云函数
- [x] `api/deckcraft-stats.ts` - 上传到Laf云函数
- [x] `index.html` - 更新到GitHub Pages
- [x] `js/app.js` - 更新到GitHub Pages
- [x] `data/cases.json` - 更新到GitHub Pages

---

## 注意事项

1. **缩略图URL**：当前案例数据中的缩略图URL是示例，请替换为真实图片URL
2. **飞书配置**：可选功能，不配置也可正常使用
3. **限流保护**：已内置基础限流，1分钟最多5次请求
