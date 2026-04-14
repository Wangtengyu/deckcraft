/**
 * PPT生成API - Laf云函数 V6.0 (完整优化版)
 * Phase 1: 完善Prompt模板，添加禁用词、布局规范、细分风格
 * Phase 2: 添加细分风格配置，实现场景关键词自动推荐
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// ============ 禁用词列表 ============
// 这些词会导致生图模型输出人像，必须禁止
const FORBIDDEN_WORDS = [
  '商务', '现代', '专业', '商业', '咨询', '高端', '大气', 
  '童趣', '稳重', '政务', '正式', '规范', '精英', '职场'
]

// ============ 细分风格配置 ============
const SUB_STYLE_CONFIG = {
  A: {
    name: '信息图风',
    description: '汇报导向内容，几何图形承载文字',
    subStyles: {
      'party_red': {
        name: '党政红金',
        keywords: ['党建', '党课', '主题党日', '表彰大会', '党委', '党支部'],
        visualStyle: '红金配色风格，深红色背景，金色线条装饰。标题金色粗体，正文白色。整体庄重大气。不要出现人像。',
        bgColor: '#8B0000'
      },
      'gov_blue': {
        name: '政务蓝',
        keywords: ['政务', '政策', '政府', '机关', '汇报', '政策解读'],
        visualStyle: '政务蓝风格，深蓝色背景，白色线条装饰。标题白色粗体，正文浅蓝。整体严肃规范。不要出现人像。',
        bgColor: '#1E3A5F'
      },
      'culture': {
        name: '文化古典',
        keywords: ['历史', '国学', '传统文化', '古典', '文化', '遗产'],
        visualStyle: '古典文化风格，米黄色宣纸肌理背景，深棕色边框装饰。标题深棕色书法感，正文深灰。整体典雅古朴。不要出现人像。',
        bgColor: '#F5DEB3'
      },
      'tech_warm': {
        name: '米白暖色',
        keywords: ['互联网', '科技', '创意', '教育培训', '年轻', '创业'],
        visualStyle: '米色图纸感的背景，整体呈低饱和暖色系。标题的字号小，正文的字号非常小，保持留白充足，搭配少量扁平化插画。不要出现人像。',
        bgColor: '#F5F5DC'
      },
      'general_blue': {
        name: '通用蓝白',
        keywords: [], // 默认风格
        visualStyle: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。标题的字号小，正文的字号非常小，保持留白充足，适当搭配少量扁平的图解元素。不要出现人像。',
        bgColor: '#E8F4FC'
      }
    }
  },
  
  B: {
    name: '插画科普风',
    description: '插画/图标辅助解释概念，增强理解',
    subStyles: {
      'blackboard': {
        name: '黑板粉笔',
        keywords: ['课堂', '教学', '知识竞赛', '数学', '物理', '公式'],
        visualStyle: '黑板粉笔风格，深绿色黑板背景。粉笔白色为主色调，线条带粉笔颗粒感。整体手绘自然、课堂板书感。',
        bgColor: '#2F4F4F'
      },
      'flat_illustration': {
        name: '扁平插画',
        keywords: ['小学课件', '企业培训', '安全教育', '健康科普', '科普宣传'],
        visualStyle: '扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。',
        bgColor: '#87CEEB'
      },
      'warm_yellow': {
        name: '暖黄亲切',
        keywords: ['生活技能', '健康', '育儿', '家庭'],
        visualStyle: '扁平插画风格，暖黄色背景。扁平矢量插画，几何化简化，色彩温暖。整体温暖、亲切。',
        bgColor: '#FFFACD'
      }
    }
  },
  
  C: {
    name: '图文混排风',
    description: '实景照片是主要视觉元素',
    subStyles: {
      'nature': {
        name: '自然风光',
        keywords: ['旅游', '风景', '自然', '山水', '户外'],
        visualStyle: '极简艺术风格，全屏高清自然风景摄影图作为背景，中心叠加纯色矩形画框承载文字。整体构图对称、稳定、高级。无人物。',
        bgColor: '#F0F8FF'
      },
      'city': {
        name: '城市建筑',
        keywords: ['建筑', '城市', '商务', '地标', '金融'],
        visualStyle: '商务科技风格，深蓝色纯色背景与高清城市实景图结合。文字清晰有力，配色为白金搭配。严禁大面积使用金色背景。无人物。',
        bgColor: '#1E3A5F'
      },
      'food': {
        name: '美食摄影',
        keywords: ['美食', '餐饮', '菜品', '餐厅'],
        visualStyle: '美食摄影风格，高质量美食照片为主体，浅色背景衬托。文字简洁，配色为暖色调。无人物。',
        bgColor: '#FFF8DC'
      }
    }
  },
  
  D: {
    name: '卡通绘本风',
    description: '卡通插画为主，文字大而少',
    subStyles: {
      'candy': {
        name: '糖果色',
        keywords: ['数字', '形状', '颜色', '认知', '幼儿安全', '日常生活'],
        visualStyle: '儿童绘本风格，浅黄色背景，糖果色装饰，可爱温馨。标题彩色圆润字体。',
        bgColor: '#FFFACD'
      },
      'watercolor': {
        name: '绘本水彩',
        keywords: ['故事', '童话', '动物', '绘本'],
        visualStyle: '绘本水彩风格，浅粉色背景，手绘水彩质感，温馨童话。标题深棕色圆润字体。',
        bgColor: '#FFF0F5'
      }
    }
  },
  
  E: {
    name: '手绘笔记风',
    description: '手绘线条 + 信息图结构',
    subStyles: {
      'hand_drawn': {
        name: '手绘信息图',
        keywords: ['知识分享', '生活常识', '产品科普', '经验总结', '读书笔记', '方法论'],
        visualStyle: '手绘信息图风格，米白色纸张肌理背景，黑色细描边，柔和马克笔平涂。标题的字号小，正文的字号非常小，保持留白充足，搭配简笔图标和符号化小人。',
        bgColor: '#FAF0E6'
      }
    }
  }
}

// ============ Prompt模板（完整版） ============
const PROMPT_TEMPLATES = {
  A: {
    cover: `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示主标题「{title}」，{titleColor}粗体，字号小，单行展示。
主标题下方展示副标题「{subtitle}」，{subtitleColor}，字号更小。
页面底部小字显示「{footer}」

整体留白充足，聚焦标题。禁止任何人物、人像、照片。`,

    content: `生成一张信息图海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{contentDescription}

整体留白充足，层次清晰。禁止任何人物、人像、照片。`,

    ending: `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示结语「{endingText}」，{titleColor}粗体，字号小。

整体留白充足。禁止任何人物、人像、照片。`
  },

  B: {
    cover: `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央展示主标题「{title}」，彩色圆润字体，字号小。
主标题下方展示副标题「{subtitle}」，深棕色，字号更小。
页面底部小字显示「{footer}」

页面配与主题相关的可爱扁平插画，Q版造型。
整体活泼可爱。`,

    content: `生成一张{topic}科普海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{contentDescription}

整体清爽、易理解。禁止任何人物、人像。`,

    ending: `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示结语「{endingText}」，彩色圆润字体，字号小。

整体活泼可爱。禁止任何人物、人像。`
  },

  C: {
    cover: `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{layoutDescription}

主标题「{title}」，{titleColor}粗体。
副标题「{subtitle}」，字号更小。

整体构图对称、稳定。无人物。`,

    content: `生成一张图文混排风格海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{contentDescription}

整体图文协调，层次分明。无人物。`,

    ending: `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示结语「{endingText}」，{titleColor}粗体，字号小。

整体氛围宁静致远。无人物。`
  },

  D: {
    cover: `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央展示主标题「{title}」，彩色圆润字体，字号小。
主标题下方展示副标题「{subtitle}」，深棕色，字号更小。

页面配与主题相关的可爱卡通插画，Q版造型。
整体活泼可爱，适合儿童。禁止恐怖或尖锐元素。`,

    content: `生成一张幼儿认知绘本页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{contentDescription}

整体简洁可爱，适合幼儿认知。禁止恐怖或尖锐元素。`,

    ending: `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示结语「{endingText}」，彩色圆润字体，字号小。

周围点缀云朵、星星装饰。
整体温馨可爱。禁止恐怖或尖锐元素。`
  },

  E: {
    cover: `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示主标题「{title}」，黑色粗体，字号小，单行展示。
主标题下方展示副标题「{subtitle}」，深灰色，字号更小。
页面底部小字显示「{footer}」

整体留白充足，文艺清新。禁止任何人物、人像、照片。`,

    content: `生成一张信息图海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

{contentDescription}

底部浅黄条「{bottomQuote}」

整体留白充足，手绘感。禁止任何人物、人像、照片。`,

    ending: `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：{visualStyle}

页面中央位置展示结语「{endingText}」，黑色粗体，字号小。

整体留白充足，文艺清新。禁止任何人物、人像、照片。`
  }
}

// ============ 布局模板 ============
const LAYOUT_TEMPLATES = {
  // 流程图布局
  process: (steps) => {
    const stepText = steps.map((step, i) => 
      `步骤${i + 1}「${step.title}」\n${step.content}`
    ).join('\n\n')
    return `页面中央是横向${steps.length}步流程图，每步用卡片表示，用箭头连接：\n\n${stepText}`
  },
  
  // 对比布局
  compare: (left, right) => {
    return `页面分为左右两个区域对比：

左侧区域标签「${left.title}」：
${left.content}

右侧区域标签「${right.title}」：
${right.content}

中间用VS符号分隔，强调对比关系。`
  },
  
  // 列表布局
  list: (items) => {
    return items.map((item, i) => 
      `${i + 1}. ${item.title}\n${item.content}`
    ).join('\n\n')
  },
  
  // 多栏布局
  columns: (columns) => {
    return columns.map((col, i) => 
      `第${i + 1}栏「${col.title}」\n${col.content}`
    ).join('\n\n')
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
      { type: 'content', section: '实施计划', points: 4 },
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
      { type: 'content', section: '实践应用', points: 3 },
      { type: 'ending', section: '总结回顾' }
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
  wechat: { width: 1080, height: 1920, name: '微信' }
}

// ============ 辅助函数 ============

/**
 * 根据场景关键词推荐细分风格
 */
function recommendSubStyle(mainStyle, scene, topic) {
  const styleConfig = SUB_STYLE_CONFIG[mainStyle]
  if (!styleConfig || !styleConfig.subStyles) {
    return { subStyleKey: null, subStyleConfig: null }
  }
  
  const combinedText = `${scene} ${topic}`.toLowerCase()
  
  for (const [key, subStyle] of Object.entries(styleConfig.subStyles)) {
    if (subStyle.keywords && subStyle.keywords.length > 0) {
      const hasKeyword = subStyle.keywords.some(kw => combinedText.includes(kw.toLowerCase()))
      if (hasKeyword) {
        return { subStyleKey: key, subStyleConfig: subStyle }
      }
    }
  }
  
  // 返回默认风格（最后一个）
  const keys = Object.keys(styleConfig.subStyles)
  const defaultKey = keys[keys.length - 1]
  return { subStyleKey: defaultKey, subStyleConfig: styleConfig.subStyles[defaultKey] }
}

/**
 * 检查文本中是否包含禁用词
 */
function checkForbiddenWords(text) {
  const found = FORBIDDEN_WORDS.filter(word => text.includes(word))
  return found.length > 0 ? found : null
}

/**
 * 生成内容描述
 */
function generateContentDescription(page, mainStyle) {
  const templates = {
    A: (p) => {
      if (p.points && p.points.length > 0) {
        return `标题「${p.title}」位于页面左上角，黑色粗体。

页面中央展示内容要点：
${p.points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

每个要点用卡片承载，用细线分隔。`
      }
      return `标题「${p.title}」位于页面左上角，黑色粗体。
页面中央展示内容区域，留白充足。`
    },
    
    B: (p) => {
      if (p.points && p.points.length > 0) {
        return `标题「${p.title}」位于页面顶部，白色粗体，标题前配小图标。

左侧内容区使用白色圆角卡片，${p.points.length}个要点纵向排列：
${p.points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

右侧配与主题相关的扁平矢量插画，几何化简化。`
      }
      return `标题「${p.title}」位于页面顶部，白色粗体。
页面中央展示内容，配扁平矢量插画。`
    },
    
    C: (p) => {
      return `标题「${p.title}」位于页面顶部，{titleColor}粗体。
左侧展示高质量照片，右侧展示内容文字。
整体图文协调，层次分明。`
    },
    
    D: (p) => {
      if (p.points && p.points.length > 0) {
        return `标题「${p.title}」位于页面顶部，彩色圆润字体。

页面中央展示内容：
${p.points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

周围点缀云朵、星星等可爱装饰。`
      }
      return `标题「${p.title}」位于页面顶部，彩色圆润字体。
页面配可爱卡通插画。`
    },
    
    E: (p) => {
      if (p.points && p.points.length > 0) {
        return `标题「${p.title}」位于页面左上角，黑色粗体。标题下用荧光笔强调关键词。

页面中央展示内容要点：
${p.points.map((pt, i) => `① ${pt}`).join('\n')}

每个要点配简笔图标。`
      }
      return `标题「${p.title}」位于页面左上角，黑色粗体。
页面中央展示内容，配简笔图标和符号化小人。`
    }
  }
  
  return templates[mainStyle] ? templates[mainStyle](page) : templates.A(page)
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
  
  // 检查禁用词
  const forbiddenFound = checkForbiddenWords(prompt)
  if (forbiddenFound) {
    console.warn('警告：prompt中包含禁用词:', forbiddenFound)
    // 替换禁用词
    prompt = forbiddenFound.reduce((text, word) => {
      return text.replace(new RegExp(word, 'g'), '')
    }, prompt)
  }
  
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

// ============ Prompt生成（完整版） ============
function generatePromptV6(page, mainStyle, subStyleConfig, context) {
  const templates = PROMPT_TEMPLATES[mainStyle]
  if (!templates) {
    return `生成一张PPT${page.type}页背景。风格：简洁专业。禁止任何人物、人像、照片。`
  }
  
  let prompt = templates[page.type] || templates.content
  
  // 替换变量
  const visualStyle = subStyleConfig?.visualStyle || SUB_STYLE_CONFIG[mainStyle]?.description || ''
  const titleColor = subStyleConfig?.bgColor === '#8B0000' || subStyleConfig?.bgColor === '#1E3A5F' 
    ? '白色' 
    : subStyleConfig?.bgColor === '#F5DEB3' || subStyleConfig?.bgColor === '#F5F5DC'
    ? '深棕色'
    : '黑色'
  
  prompt = prompt
    .replace('{visualStyle}', visualStyle)
    .replace(/{titleColor}/g, titleColor)
    .replace('{subtitleColor}', subStyleConfig?.bgColor === '#8B0000' ? '金色' : '深灰色')
    .replace('{title}', page.title || context.topic || '')
    .replace('{subtitle}', page.subtitle || '')
    .replace('{footer}', context.footer || '')
    .replace('{topic}', context.topic || '')
    .replace('{endingText}', page.endingText || '感谢聆听')
  
  // 内容描述
  if (page.type === 'content' && !page.contentDescription) {
    page.contentDescription = generateContentDescription(page, mainStyle)
  }
  
  if (page.contentDescription) {
    prompt = prompt.replace('{contentDescription}', page.contentDescription)
  }
  
  if (page.layoutDescription) {
    prompt = prompt.replace('{layoutDescription}', page.layoutDescription)
  }
  
  if (page.bottomQuote) {
    prompt = prompt.replace('{bottomQuote}', page.bottomQuote)
  } else {
    prompt = prompt.replace('底部浅黄条「{bottomQuote}」', '')
  }
  
  return prompt
}

// ============ 主函数 ============
export default async function (ctx) {
  console.log('=== DeckCraft V6.0 生成开始 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  const scene = ctx.body?.scene || 'report'
  const pageCount = parseInt(ctx.body?.pageCount) || 5
  const subStyleKey = ctx.body?.subStyle // 用户指定的细分风格
  
  const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
  const apiKey = COZE_API_KEY
  
  // 推荐或使用指定的细分风格
  const { subStyleKey: recommendedKey, subStyleConfig } = subStyleKey
    ? { subStyleKey, subStyleConfig: SUB_STYLE_CONFIG[style]?.subStyles?.[subStyleKey] }
    : recommendSubStyle(style, scene, topic)
  
  console.log(`主风格: ${style}, 细分风格: ${recommendedKey || '无'}`)
  
  try {
    // ========== 生成内容大纲 ==========
    await updateProgress(taskId, {
      status: 'generating',
      currentStep: 1,
      message: '正在生成内容结构...',
      totalSteps: pageCount + 2,
      totalPages: pageCount,
      style: style,
      subStyle: recommendedKey
    })
    
    const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other
    const images = []
    const context = {
      topic: topic,
      footer: ''
    }
    
    // ========== 生成每页背景 ==========
    const pages = structure.pages.slice(0, pageCount)
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      await updateProgress(taskId, {
        currentStep: i + 2,
        currentPage: i + 1,
        message: `正在生成第${i + 1}页背景...`,
        totalPages: pages.length
      })
      
      // 生成 prompt
      const prompt = generatePromptV6(page, style, subStyleConfig, context)
      console.log(`\n=== 第${i + 1}页 Prompt ===\n${prompt}\n`)
      
      // 调用 Coze API
      const result = await generateBackground(prompt, apiKey, `${platformSize.width}x${platformSize.height}`)
      
      if (result.error) {
        console.error(`第${i + 1}页生成失败:`, result.error)
        images.push({
          page: i + 1,
          type: page.type,
          url: '',
          error: result.error
        })
      } else {
        console.log(`第${i + 1}页生成成功`)
        images.push({
          page: i + 1,
          type: page.type,
          url: result.url,
          error: ''
        })
      }
    }
    
    // ========== 完成 ==========
    const finalProgress = await updateProgress(taskId, {
      status: 'completed',
      currentStep: pages.length + 2,
      progress: 100,
      message: '生成完成',
      images: images
    })
    
    return {
      code: 0,
      message: 'success',
      data: {
        taskId: taskId,
        topic: topic,
        style: style,
        subStyle: recommendedKey,
        subStyleName: subStyleConfig?.name,
        pages: pages,
        images: images,
        progress: finalProgress
      }
    }
    
  } catch (error) {
    console.error('生成失败:', error)
    
    await updateProgress(taskId, {
      status: 'failed',
      message: error.message,
      progress: 0
    })
    
    return {
      code: -1,
      message: error.message,
      data: {
        taskId: taskId,
        error: error.message
      }
    }
  }
}
