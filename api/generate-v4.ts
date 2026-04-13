/**
 * PPT生成API - Laf云函数 V4.0 (优化版)
 * 优化内容：
 * 1. 专业化Prompt模板
 * 2. 精确的视觉描述
 * 3. 清晰的布局规范
 * 4. 明确的禁止项
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// ============ 优化后的风格配置 ============
const STYLE_CONFIG = {
  A: {
    name: '信息图风',
    description: '信息图风 - 专业商务风格，适合成人和专业场合',
    prompt_templates: {
      cover: `【PPT封面背景 · 信息图风格】
        
风格定义：线性扁平风格 (Linear Flat Design)
配色方案：
  - 主色：#4A90D9 (科技蓝)
  - 辅色：#F5F7FA (纯净白)
  - 强调：#2C3E50 (深灰蓝)
  - 点缀：#E8EEF4 (浅蓝灰)

背景规范：
  - 底色：纯白 #FFFFFF 或 极浅蓝灰 #F5F7FA
  - 纹理：精细几何网格线，透明度5-10%
  - 噪点：无

布局规范：
  - 左侧1/3区域：几何装饰元素（圆形、矩形、线条组合）
  - 右侧2/3区域：纯净留白，供文字使用
  - 边距：四周保留8-10%的安全边距
  - 分区线：可添加1px浅色分隔线

装饰元素：
  - 类型：抽象几何图形（圆形、弧线、直线、网格）
  - 风格：极简扁平，无渐变，无阴影
  - 位置：左下角或左侧边缘
  - 数量：3-5个元素为宜

禁止项：
  ✗ 禁止出现人物、动物、真实照片
  ✗ 禁止渐变色、大面积色块
  ✗ 禁止复杂纹理、噪点背景
  ✗ 禁止超过两种主装饰元素

输出格式：16:9横版，4K分辨率（4096x2304）`,

      content: `【PPT内容页背景 · 信息图风格】

风格定义：线性扁平风格 (Linear Flat Design)
配色方案：
  - 主色：#4A90D9 (科技蓝)
  - 辅色：#F5F7FA (纯净白)
  - 强调：#2C3E50 (深灰蓝)
  - 点缀：#ECF2F8 (冰蓝)

背景规范：
  - 底色：纯白 #FFFFFF
  - 顶部：可添加2-4px细线装饰
  - 左上角：可放置品牌/标题装饰区

布局规范：
  - 标题区：页面顶部10-15%高度
  - 内容区：页面中央60-70%高度
  - 底部：可添加页码/装饰区域5%
  - 左右边距：5-8%

装饰元素：
  - 顶部：1px细线，颜色#E8EEF4
  - 左上角：小型几何图形或品牌标识占位
  - 角落：淡色圆点或小方块点缀
  - 风格：极简克制，不可喧宾夺主

禁止项：
  ✗ 禁止出现人物、动物、照片
  ✗ 禁止大面积色块或渐变
  ✗ 禁止复杂背景图案
  ✗ 禁止任何文字或数字

输出格式：16:9横版，4K分辨率（4096x2304）`,

      ending: `【PPT结束页背景 · 信息图风格】

风格定义：线性扁平风格，与封面呼应
配色方案：
  - 主色：#4A90D9 (科技蓝)
  - 辅色：#F5F7FA (纯净白)
  - 强调：#2C3E50 (深灰蓝)

布局规范：
  - 中央区域：纯净留白，供"感谢语"文字使用
  - 四角：可添加极简几何装饰
  - 底部：可添加联系方式占位区

禁止项：
  ✗ 禁止复杂装饰
  ✗ 禁止任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`
    },
    visual_styles: {
      default: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调，标题字号小，正文非常小，留白充足，几何装饰简洁。',
      tech: '米色图纸感背景，低饱和暖色系，扁平化插画，少量几何装饰，留白充足。',
      government: '浅红色调背景，淡金色纹理，庄重典雅，字号小而精致。',
      classic: '浅黄色宣纸质感背景，淡传统纹样，古朴典雅，精致小巧。'
    }
  },
  
  B: {
    name: '插画科普风',
    description: '插画科普风 - 教育培训、科普宣传',
    prompt_templates: {
      cover: `【PPT封面背景 · 插画科普风格】

风格定义：扁平插画风格 (Flat Illustration)
配色方案：
  - 主色：#4ECDC4 (清新青)
  - 辅色：#FFE66D (阳光黄)
  - 强调：#FF6B6B (活力红)
  - 点缀：#95E1D3 (薄荷绿)

背景规范：
  - 底色：纯白 #FFFFFF 或 极浅蓝 #E8F4F8
  - 柔和渐变：可从左上角向右下角添加极淡的渐变

布局规范：
  - 中央：主标题区（40%宽度居中）
  - 顶部/底部：可添加插画装饰带
  - 左右边距：10%

装饰元素：
  - 风格：几何化扁平插画
  - 主题：科技、教育、自然等抽象元素
  - 位置：四角或上下边缘
  - 数量：2-3处点缀

禁止项：
  ✗ 禁止真实照片
  ✗ 禁止过于复杂的插画
  ✗ 禁止超过3种主色调
  ✗ 禁止任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`,

      content: `【PPT内容页背景 · 插画科普风格】

风格定义：扁平插画风格
配色方案：
  - 与封面保持一致
  - 可添加#F7F9FC浅灰白作为补充

背景规范：
  - 底色：纯白或极浅色
  - 可添加淡色几何图形作为背景点缀

布局规范：
  - 标题区：顶部10-15%
  - 内容区：中央60-70%
  - 装饰区：角落或边缘
  - 边距：左右8-10%

装饰元素：
  - 角落：小型插画或图标点缀
  - 顶部/底部：淡色装饰带
  - 风格：简洁、科普、易懂

禁止项：
  ✗ 禁止复杂插画遮挡内容
  ✗ 禁止任何文字
  ✗ 禁止过于鲜艳的颜色

输出格式：16:9横版，4K分辨率（4096x2304）`,

      ending: `【PPT结束页背景 · 插画科普风格】

布局：中央留白为主，简洁收尾
装饰：与封面呼应的角部装饰
禁止：任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`
    },
    visual_style: '扁平插画风格，天蓝色背景，橙黄色强调色，清爽易理解，几何化扁平插画辅助说明。'
  },
  
  C: {
    name: '图文混排风',
    description: '图文混排风 - 照片为主的排版风格',
    prompt_templates: {
      cover: `【PPT封面背景 · 图文混排风格】

风格定义：照片背景 + 文字叠加
配色方案：
  - 背景：高质量模糊照片（风景/建筑/抽象）
  - 文字：白色或深色（根据照片明暗）
  - 半透明遮罩：rgba(0,0,0,0.3) 或 rgba(255,255,255,0.8)

照片规范：
  - 类型：自然风景、城市天际线、抽象纹理
  - 处理：背景虚化，聚焦中心
  - 色调：整体统一，可偏暖或偏冷

布局规范：
  - 照片：全屏覆盖
  - 遮罩：可添加渐变遮罩（底部加暗）
  - 文字区：中央或中下位置
  - 边距：左右15-20%

禁止项：
  ✗ 禁止人物特写照片
  ✗ 禁止商业Logo或商标
  ✗ 禁止低质量、模糊不清的照片
  ✗ 禁止任何水印

输出格式：16:9横版，4K分辨率（4096x2304）`,

      content: `【PPT内容页背景 · 图文混排风格】

风格定义：照片点缀 + 大量留白
照片规范：
  - 位置：页面一侧（30-40%宽度）
  - 处理：保持清晰或轻微虚化
  - 风格：与主题相关

布局规范：
  - 照片区：左侧或右侧
  - 文字区：对侧60-70%
  - 边距：上下左右各10%

禁止项：
  ✗ 禁止照片遮挡主要内容
  ✗ 禁止任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`,

      ending: `【PPT结束页背景 · 图文混排风格】

布局：与封面呼应的简洁收尾
照片：可使用与封面相似风格的照片
禁止：任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`
    },
    visual_style: '照片为主的排版风格，留白充足，文字简洁，视觉聚焦。'
  },
  
  D: {
    name: '卡通绘本风',
    description: '卡通绘本风 - 儿童教育、亲子活动',
    prompt_templates: {
      cover: `【PPT封面背景 · 卡通绘本风格】

风格定义：可爱卡通插画风格
配色方案：
  - 主色：#FFB6C1 (粉红)
  - 辅色：#87CEEB (天蓝)
  - 强调：#FFD700 (金黄)
  - 点缀：#98FB98 (嫩绿)

背景规范：
  - 底色：纯白或柔和渐变
  - 可添加云朵、星星等可爱元素

布局规范：
  - 中央：大标题区
  - 角落：卡通装饰
  - 边距：充足留白

装饰元素：
  - 类型：卡通动物、植物、物品
  - 风格：圆润、可爱、色彩柔和
  - 位置：四角或边缘

禁止项：
  ✗ 禁止恐怖或阴暗元素
  ✗ 禁止尖锐形状
  ✗ 禁止超过4种主色调

输出格式：16:9横版，4K分辨率（4096x2304）`,

      content: `【PPT内容页背景 · 卡通绘本风格】

背景规范：
  - 底色：柔和浅色
  - 可添加淡色卡通背景元素

布局规范：
  - 标题区：顶部
  - 内容区：中央
  - 边距：充足

装饰元素：
  - 角落：可爱小图标
  - 背景：淡色卡通图案

禁止项：
  ✗ 禁止遮挡主要内容
  ✗ 禁止任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`,

      ending: `【PPT结束页背景 · 卡通绘本风格】

布局：可爱简洁收尾
装饰：与封面呼应的卡通元素
禁止：任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`
    },
    visual_style: '可爱卡通插画风格，柔和暖色调，标题字号大，文字少，整体活泼有趣。'
  },
  
  E: {
    name: '手绘笔记风',
    description: '手绘笔记风 - 创意展示、手绘风格',
    prompt_templates: {
      cover: `【PPT封面背景 · 手绘笔记风格】

风格定义：手绘线条风格
配色方案：
  - 主色：#F5E6D3 (米色纸)
  - 辅色：#8B4513 (棕色线条)
  - 强调：#4169E1 (蓝色墨水)
  - 点缀：#228B22 (绿色批注)

背景规范：
  - 底色：米色或奶油色纸张质感
  - 纹理：淡色网格线或横线

布局规范：
  - 整体：笔记本页面感
  - 边距：左侧留出"装订区"

装饰元素：
  - 类型：手绘线条、简单插图
  - 风格：轻松、手写感
  - 位置：边缘或角落

禁止项：
  ✗ 禁止过于精细的插画
  ✗ 禁止正式商务感
  ✗ 禁止任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`,

      content: `【PPT内容页背景 · 手绘笔记风格】

背景规范：
  - 底色：米色纸张
  - 纹理：淡网格线或横线

布局规范：
  - 标题区：顶部
  - 内容区：中央
  - 可添加"便签"或"卡片"元素

装饰元素：
  - 手绘线条、箭头、框线
  - 小图标或涂鸦点缀

禁止项：
  ✗ 禁止任何文字
  ✗ 禁止过于正式的设计

输出格式：16:9横版，4K分辨率（4096x2304）`,

      ending: `【PPT结束页背景 · 手绘笔记风格】

布局：与封面呼应的手绘风格收尾
装饰：简单手绘元素
禁止：任何文字

输出格式：16:9横版，4K分辨率（4096x2304）`
    },
    visual_style: '手绘线条风格，米色笔记本背景，淡网格线，轻松易读，手绘元素点缀。'
  }
}

// ============ 预设模板库 ============
const TEMPLATE_LIBRARY = {
  cover: {
    type: 'cover',
    layouts: {
      centered: {
        title: { x: 0.5, y: 2.2, w: 12.33, h: 1.5, align: 'center', fontSize: 48, bold: true },
        subtitle: { x: 0.5, y: 3.8, w: 12.33, h: 0.8, align: 'center', fontSize: 24 }
      },
      left_aligned: {
        title: { x: 0.5, y: 2.5, w: 8, h: 1.2, align: 'left', fontSize: 44, bold: true },
        subtitle: { x: 0.5, y: 3.8, w: 8, h: 0.6, align: 'left', fontSize: 20 },
        decor: { x: 8.5, y: 1, w: 3.5, h: 3, type: 'image' }
      }
    }
  },
  toc: {
    type: 'toc',
    layouts: {
      default: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.8, align: 'center', fontSize: 32, bold: true },
        items: { x: 1, y: 1.5, w: 10.33, h: 3, fontSize: 18, lineHeight: 1.8 }
      },
      numbered: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.8, align: 'center', fontSize: 32, bold: true },
        items: { x: 1.5, y: 1.5, w: 9, h: 3, fontSize: 18, lineHeight: 1.8, numbered: true }
      }
    }
  },
  content: {
    type: 'content',
    layouts: {
      title_top: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.8, fontSize: 28, bold: true },
        content: { x: 0.5, y: 1.3, w: 12.33, h: 3.2, fontSize: 16 }
      },
      title_left: {
        title: { x: 0.5, y: 0.3, w: 4, h: 3.5, fontSize: 24, bold: true, vertical: true },
        content: { x: 5, y: 0.3, w: 7.33, h: 3.5, fontSize: 16 }
      },
      two_column: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.6, fontSize: 26, bold: true },
        left: { x: 0.5, y: 1.2, w: 5.5, h: 2.8, fontSize: 14 },
        right: { x: 6.5, y: 1.2, w: 5.5, h: 2.8, fontSize: 14 }
      },
      bullet_list: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.8, fontSize: 28, bold: true },
        bullets: { x: 0.8, y: 1.3, w: 11, h: 3, fontSize: 16, lineHeight: 2, bullet: true }
      }
    }
  },
  chart: {
    type: 'chart',
    layouts: {
      default: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.6, fontSize: 26, bold: true },
        chart: { x: 0.5, y: 1.1, w: 7, h: 3 },
        legend: { x: 8, y: 1.1, w: 4, h: 3, fontSize: 14 }
      },
      full_width: {
        title: { x: 0.5, y: 0.3, w: 12.33, h: 0.6, fontSize: 26, bold: true },
        chart: { x: 0.5, y: 1.1, w: 12.33, h: 3 }
      }
    }
  },
  ending: {
    type: 'ending',
    layouts: {
      centered: {
        main: { x: 0.5, y: 2.5, w: 12.33, h: 1.2, align: 'center', fontSize: 48 },
        sub: { x: 0.5, y: 4, w: 12.33, h: 0.6, align: 'center', fontSize: 20 }
      }
    }
  }
}

// ============ 内容结构模板 ============
const NARRATIVE_STRUCTURES = {
  report: {
    name: '工作汇报',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '背景与目标', points: 3 },
      { type: 'content', section: '执行过程', points: 4 },
      { type: 'content', section: '关键成果', points: 3 },
      { type: 'chart', section: '数据分析', chartType: 'bar' },
      { type: 'content', section: '问题与挑战', points: 2 },
      { type: 'content', section: '下一步计划', points: 3 },
      { type: 'ending', section: '感谢聆听' }
    ]
  },
  proposal: {
    name: '项目方案',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '问题与机会', points: 3 },
      { type: 'content', section: '解决方案', points: 4 },
      { type: 'content', section: '核心优势', points: 3 },
      { type: 'content', section: '成功案例', points: 2 },
      { type: 'content', section: '实施计划', points: 4 },
      { type: 'content', section: '预期成果', points: 3 },
      { type: 'content', section: '资源需求', points: 2 },
      { type: 'ending', section: '期待合作' }
    ]
  },
  training: {
    name: '培训课件',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '培训目标', points: 3 },
      { type: 'content', section: '基础知识', points: 4 },
      { type: 'content', section: '核心技能', points: 3 },
      { type: 'content', section: '实操演练', points: 3 },
      { type: 'content', section: '案例分析', points: 2 },
      { type: 'content', section: '常见问题', points: 3 },
      { type: 'content', section: '行动计划', points: 3 },
      { type: 'ending', section: '培训总结' }
    ]
  },
  science: {
    name: '知识科普',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '核心概念', points: 3 },
      { type: 'content', section: '关键原理', points: 4 },
      { type: 'content', section: '重要知识点', points: 3 },
      { type: 'chart', section: '数据展示', chartType: 'diagram' },
      { type: 'content', section: '实践应用', points: 3 },
      { type: 'content', section: '延伸阅读', points: 2 },
      { type: 'ending', section: '总结回顾' }
    ]
  },
  process: {
    name: '流程说明',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '流程概述', points: 3 },
      { type: 'content', section: '准备工作', points: 3 },
      { type: 'content', section: '步骤详解', points: 5 },
      { type: 'content', section: '注意事项', points: 4 },
      { type: 'content', section: '常见问题', points: 3 },
      { type: 'content', section: '附录资料', points: 2 },
      { type: 'ending', section: '流程完成' }
    ]
  },
  other: {
    name: '通用模板',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '内容一', points: 3 },
      { type: 'content', section: '内容二', points: 3 },
      { type: 'content', section: '内容三', points: 3 },
      { type: 'ending', section: '感谢聆听' }
    ]
  }
}

// ============ 平台尺寸配置 ============
const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, name: '小红书' },
  wechat: { width: 1080, height: 1920, name: '微信' },
  mobile: { width: 1080, height: 1920, name: '手机竖屏' },
  poster: { width: 2480, height: 3508, name: '海报' }
}

// ============ 进度管理 ============
const PROGRESS_TTL = 300

async function updateProgress(taskId, updates) {
  try {
    let progress = await cloud.cache.get(`progress_${taskId}`)
    if (!progress) {
      progress = { taskId, totalSteps: 5, totalPages: 0 }
    }
    progress = { ...progress, ...updates, updatedAt: Date.now() }
    
    if (progress.totalSteps > 0) {
      const stepWeight = 100 / progress.totalSteps
      progress.progress = Math.min(99, Math.round(progress.currentStep * stepWeight))
    }
    
    await cloud.cache.set(`progress_${taskId}`, progress, PROGRESS_TTL)
    return progress
  } catch (e) {
    console.error('更新进度失败:', e)
    return null
  }
}

// ============ Coze API调用 ============
async function generateBackground(prompt, apiKey, size = '4096x2304') {
  console.log('=== 开始生成背景图片 ===')
  
  try {
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: {
          prompt: prompt,
          images_url: [],
          size: size,
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { url: '', error: result.msg || 'API调用失败' }
    }
    
    const rawData = result.data
    let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    
    const imageUrl = parsedData?.output?.data || ''
    const apiMsg = parsedData?.output?.msg || ''
    
    if (apiMsg !== 'success') {
      return { url: '', error: `Workflow错误: ${apiMsg}` }
    }
    
    if (imageUrl && imageUrl.startsWith('http')) {
      return { url: imageUrl, error: '' }
    }
    
    return { url: '', error: '无效的图片URL格式' }
    
  } catch (error) {
    console.error('Coze API调用失败:', error)
    return { url: '', error: error.message }
  }
}

// ============ 内容生成 ============
function generateContentOutline(topic, scene, pageCount) {
  const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other
  const pages = []
  
  // 封面页
  pages.push({
    type: 'cover',
    title: topic.split('，')[0].substring(0, 20),
    subtitle: topic.length > 20 ? topic.substring(20, 50) : '',
    template: TEMPLATE_LIBRARY.cover.layouts.centered
  })
  
  // 内容页生成逻辑
  const contentPages = structure.pages.filter(p => p.type !== 'cover' && p.type !== 'ending')
  const totalContentPages = Math.min(contentPages.length, pageCount - 2)
  
  for (let i = 0; i < totalContentPages; i++) {
    const pageConfig = contentPages[i]
    
    if (pageConfig.type === 'toc') {
      pages.push({
        type: 'toc',
        title: pageConfig.section,
        items: contentPages.filter(p => p.type === 'content').map(p => p.section),
        template: TEMPLATE_LIBRARY.toc.layouts.default
      })
    } else if (pageConfig.type === 'content') {
      pages.push({
        type: 'content',
        section: pageConfig.section,
        title: pageConfig.section,
        points: generateDefaultPoints(pageConfig.points),
        template: TEMPLATE_LIBRARY.content.layouts.bullet_list
      })
    } else if (pageConfig.type === 'chart') {
      pages.push({
        type: 'chart',
        section: pageConfig.section,
        title: pageConfig.section,
        chartType: pageConfig.chartType || 'bar',
        template: TEMPLATE_LIBRARY.chart.layouts.default
      })
    }
  }
  
  // 结尾页
  pages.push({
    type: 'ending',
    title: '感谢聆听',
    template: TEMPLATE_LIBRARY.ending.layouts.centered
  })
  
  return pages
}

function generateDefaultPoints(count) {
  const templates = [
    '核心要点一：具体描述说明',
    '核心要点二：数据支撑或案例',
    '核心要点三：总结归纳',
    '关键因素：影响和意义',
    '实施建议：具体行动方案'
  ]
  return templates.slice(0, count)
}

// ============ Prompt生成 ============
function generatePrompt(page, styleConfig, platformSize) {
  const promptType = page.type === 'ending' ? 'ending' : page.type
  
  if (styleConfig.prompt_templates && styleConfig.prompt_templates[promptType]) {
    return styleConfig.prompt_templates[promptType]
  }
  
  // 降级处理
  return `生成一张PPT${promptType === 'cover' ? '封面' : promptType === 'ending' ? '结尾' : '内容'}页背景。

风格：${styleConfig.description}
尺寸：${platformSize.width}x${platformSize.height}

要求：
1. 只生成背景和装饰元素
2. 不要包含任何文字
3. 保持专业简洁风格
4. 与风格定义保持一致`
}

// ============ 风格推荐 ============
function recommendStyle(audience) {
  const styleMap = {
    child: 'D',
    student: 'B',
    adult: 'A',
    professional: 'A'
  }
  return styleMap[audience] || 'A'
}

// ============ 主函数 ============
export default async function (ctx) {
  console.log('=== DeckCraft V4.0 生成开始 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  const scene = ctx.body?.scene || 'report'
  const audience = ctx.body?.audience || 'adult'
  const pageCount = parseInt(ctx.body?.pageCount) || 5
  
  const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
  const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.A
  const apiKey = COZE_API_KEY
  
  // 如果受众指定了风格但用户未指定，使用推荐
  const finalStyle = style === 'A' && audience !== 'adult' ? recommendStyle(audience) : style
  const finalStyleConfig = STYLE_CONFIG[finalStyle] || STYLE_CONFIG.A
  
  try {
    // ========== 生成内容大纲 ==========
    await updateProgress(taskId, {
      status: 'generating',
      currentStep: 1,
      message: '正在生成内容结构...',
      totalSteps: pageCount + 2,
      totalPages: pageCount
    })
    
    const contentOutline = generateContentOutline(topic, scene, pageCount)
    const images = []
    
    // ========== 生成每页背景 ==========
    for (let i = 0; i < contentOutline.length; i++) {
      const page = contentOutline[i]
      
      await updateProgress(taskId, {
        currentStep: i + 2,
        currentPage: i + 1,
        message: `正在生成第${i + 1}页背景...`,
        totalPages: contentOutline.length,
        currentContent: page
      })
      
      const prompt = generatePrompt(page, finalStyleConfig, platformSize)
      console.log(`生成第${i + 1}页，类型: ${page.type}`)
      
      const result = await generateBackground(
        prompt, 
        apiKey, 
        `${platformSize.width}x${platformSize.height}`
      )
      
      images.push({
        page_id: i + 1,
        type: page.type,
        url: result.url || '',
        error: result.error || '',
        title: page.title || '',
        subtitle: page.subtitle || '',
        points: page.points || [],
        section: page.section || ''
      })
    }
    
    // ========== 完成 ==========
    await updateProgress(taskId, {
      status: 'completed',
      currentStep: contentOutline.length + 2,
      progress: 100,
      message: '生成完成！',
      images: images
    })
    
    return {
      success: true,
      taskId: taskId,
      ppt_title: topic,
      style: finalStyleConfig.name,
      scene: NARRATIVE_STRUCTURES[scene]?.name || '通用',
      platform: platformSize.name,
      contentOutline: contentOutline,
      images: images,
      totalPages: contentOutline.length
    }
    
  } catch (error) {
    console.error('函数执行出错:', error)
    
    await updateProgress(taskId, {
      status: 'failed',
      currentStep: 0,
      progress: 0,
      message: '生成失败',
      error: error.message
    })
    
    return {
      success: false,
      taskId: taskId,
      error: error.message
    }
  }
}
