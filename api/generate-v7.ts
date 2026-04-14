/**
 * PPT生成API - Laf云函数 V7.0 (完整版)
 * Phase 8: 集成PPTX导出功能
 * 
 * 新增功能：
 * - 生成背景图片后自动生成PPTX文件
 * - PPTX包含可编辑的文字图层
 * - 返回图片预览 + PPTX下载链接
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// ============ 禁用词列表 ============
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
        bgColor: '#8B0000',
        textColor: 'FFD700'
      },
      'gov_blue': {
        name: '政务蓝',
        keywords: ['政务', '政策', '政府', '机关', '汇报', '政策解读'],
        visualStyle: '政务蓝风格，深蓝色背景，白色线条装饰。标题白色粗体，正文浅蓝。整体严肃规范。不要出现人像。',
        bgColor: '#1E3A5F',
        textColor: 'FFFFFF'
      },
      'culture': {
        name: '文化古典',
        keywords: ['历史', '国学', '传统文化', '古典', '文化', '遗产'],
        visualStyle: '古典文化风格，米黄色宣纸肌理背景，深棕色边框装饰。标题深棕色书法感，正文深灰。整体典雅古朴。不要出现人像。',
        bgColor: '#F5DEB3',
        textColor: '4A3728'
      },
      'tech_warm': {
        name: '米白暖色',
        keywords: ['互联网', '科技', '创意', '教育培训', '年轻', '创业'],
        visualStyle: '米色图纸感的背景，整体呈低饱和暖色系。标题的字号小，正文的字号非常小，保持留白充足，搭配少量扁平化插画。不要出现人像。',
        bgColor: '#F5F5DC',
        textColor: '333333'
      },
      'general_blue': {
        name: '通用蓝白',
        keywords: [],
        visualStyle: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。标题的字号小，正文的字号非常小，保持留白充足，适当搭配少量扁平的图解元素。不要出现人像。',
        bgColor: '#E8F4FC',
        textColor: '1A5276'
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
        bgColor: '#2F4F4F',
        textColor: 'FFFFFF'
      },
      'flat_illustration': {
        name: '扁平插画',
        keywords: ['小学课件', '企业培训', '安全教育', '健康科普', '科普宣传'],
        visualStyle: '扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。',
        bgColor: '#87CEEB',
        textColor: '1A5276'
      },
      'warm_yellow': {
        name: '暖黄亲切',
        keywords: ['生活技能', '健康', '育儿', '家庭'],
        visualStyle: '扁平插画风格，暖黄色背景。扁平矢量插画，几何化简化，色彩温暖。整体温暖、亲切。',
        bgColor: '#FFFACD',
        textColor: '5D4E37'
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
        bgColor: '#F0F8FF',
        textColor: '2C3E50'
      },
      'city': {
        name: '城市建筑',
        keywords: ['建筑', '城市', '商务', '地标', '金融'],
        visualStyle: '商务科技风格，深蓝色纯色背景与高清城市实景图结合。文字清晰有力，配色为白金搭配。严禁大面积使用金色背景。无人物。',
        bgColor: '#1E3A5F',
        textColor: 'FFFFFF'
      },
      'food': {
        name: '美食摄影',
        keywords: ['美食', '餐饮', '菜品', '餐厅'],
        visualStyle: '美食摄影风格，高质量美食照片为主体，浅色背景衬托。文字简洁，配色为暖色调。无人物。',
        bgColor: '#FFF8DC',
        textColor: '5D4E37'
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
        bgColor: '#FFFACD',
        textColor: 'FF69B4'
      },
      'watercolor': {
        name: '绘本水彩',
        keywords: ['故事', '童话', '动物', '绘本'],
        visualStyle: '绘本水彩风格，浅粉色背景，手绘水彩质感，温馨童话。标题深棕色圆润字体。',
        bgColor: '#FFF0F5',
        textColor: '8B4513'
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
        bgColor: '#FAF0E6',
        textColor: '2C3E50'
      }
    }
  }
}

// ============ 内容结构模板 ============
const NARRATIVE_STRUCTURES = {
  report: {
    name: '工作汇报',
    pages: [
      { type: 'cover', section: '封面', title: '标题' },
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
  
  const keys = Object.keys(styleConfig.subStyles)
  const defaultKey = keys[keys.length - 1]
  return { subStyleKey: defaultKey, subStyleConfig: styleConfig.subStyles[defaultKey] }
}

function checkForbiddenWords(text) {
  const found = FORBIDDEN_WORDS.filter(word => text.includes(word))
  return found.length > 0 ? found : null
}

function generatePrompt(page, style, subStyleConfig, context) {
  const visualStyle = subStyleConfig?.visualStyle || SUB_STYLE_CONFIG[style]?.description || ''
  const textColor = subStyleConfig?.textColor || '1A1A1A'
  
  let prompt = ''
  
  if (page.type === 'cover') {
    prompt = `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面中央位置展示主标题区域，留白充足。
整体留白充足，聚焦标题区域。禁止任何人物、人像、照片。`
  } else if (page.type === 'ending') {
    prompt = `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面中央位置展示结语区域，留白充足。
整体留白充足。禁止任何人物、人像、照片。`
  } else {
    prompt = `生成一张信息图海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面顶部标题区域，中央内容区域。
整体留白充足，层次清晰。禁止任何人物、人像、照片。`
  }
  
  // 检查禁用词
  const forbiddenFound = checkForbiddenWords(prompt)
  if (forbiddenFound) {
    forbiddenFound.forEach(word => {
      prompt = prompt.replace(new RegExp(word, 'g'), '')
    })
  }
  
  return prompt
}

function generateContentPoints(section, count) {
  // 根据场景生成具体内容
  const contentTemplates = {
    '背景与目标': ['项目背景与现状分析', '核心目标与预期成果', '关键里程碑与时间节点'],
    '执行过程': ['前期调研与方案设计', '资源配置与团队分工', '实施步骤与关键动作', '风险识别与应对措施'],
    '关键成果': ['量化成果与数据表现', '质量提升与效率优化', '用户反馈与市场反响'],
    '问题与挑战': ['执行过程中的主要困难', '解决方案与经验总结'],
    '下一步计划': ['短期目标与行动计划', '资源配置与优先级', '预期成果与评估指标'],
    '培训目标': ['知识目标：掌握核心概念', '技能目标：提升实操能力', '态度目标：培养职业素养'],
    '基础知识': ['概念定义与核心原理', '发展历程与现状分析', '关键术语与专业概念', '相关法规与标准规范'],
    '核心技能': ['技能一：具体操作步骤', '技能二：注意事项要点', '技能三：常见问题解决']
  }
  
  return contentTemplates[section]?.slice(0, count) || 
    Array.from({ length: count }, (_, i) => `${section}要点${i + 1}：具体内容描述`)
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

// ============ PPTX生成 ============
async function generatePPTX(pages, images, title, style, subStyleConfig) {
  console.log('=== 开始生成PPTX文件 ===')
  
  const pptxgen = require('pptxgenjs')
  const pptx = new pptxgen()
  
  // 设置PPT属性
  pptx.author = 'DeckCraft AI'
  pptx.title = title
  pptx.subject = `由DeckCraft AI生成的${title}PPT`
  
  // 设置幻灯片尺寸 (16:9)
  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 })
  pptx.layout = 'CUSTOM'
  
  const textColor = subStyleConfig?.textColor || '1A1A1A'
  
  // 为每页创建幻灯片
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const img = images[i]
    const slide = pptx.addSlide()
    
    console.log(`处理第${i + 1}页: ${page.type}`)
    
    // 添加背景图片
    if (img && img.url) {
      try {
        const response = await fetch(img.url)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'
        const dataUrl = `data:${contentType};base64,${base64}`
        
        slide.addImage({
          data: dataUrl,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          sizing: { type: 'cover', w: '100%', h: '100%' }
        })
        
      } catch (error) {
        console.error('添加背景图片失败:', error.message)
        slide.background = { color: subStyleConfig?.bgColor?.replace('#', '') || 'FFFFFF' }
      }
    } else {
      slide.background = { color: subStyleConfig?.bgColor?.replace('#', '') || 'FFFFFF' }
    }
    
    // 添加可编辑的文本框
    if (page.type === 'cover') {
      // 封面页
      slide.addText(title, {
        x: 0.5,
        y: 2.5,
        w: 12.33,
        h: 1.5,
        align: 'center',
        fontSize: 48,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei',
        valign: 'middle'
      })
      
      slide.addText('点击编辑副标题', {
        x: 0.5,
        y: 4.2,
        w: 12.33,
        h: 0.8,
        align: 'center',
        fontSize: 24,
        color: textColor,
        fontFace: 'Microsoft YaHei'
      })
      
    } else if (page.type === 'ending') {
      // 结尾页
      slide.addText('感谢聆听', {
        x: 0.5,
        y: 3,
        w: 12.33,
        h: 1.5,
        align: 'center',
        fontSize: 48,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei'
      })
      
    } else {
      // 内容页
      slide.addText(page.section || `第${i}部分`, {
        x: 0.5,
        y: 0.5,
        w: 12.33,
        h: 1,
        align: 'left',
        fontSize: 32,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei'
      })
      
      // 添加要点
      const points = page.points || generateContentPoints(page.section, 3)
      points.forEach((point, idx) => {
        slide.addText(`• ${point}`, {
          x: 1,
          y: 2.0 + idx * 1.2,
          w: 11,
          h: 0.8,
          align: 'left',
          fontSize: 20,
          color: textColor,
          fontFace: 'Microsoft YaHei'
        })
      })
    }
  }
  
  console.log('=== 开始生成PPTX文件 ===')
  
  const pptxData = await pptx.write({ outputType: 'base64' })
  
  console.log('PPTX生成成功，大小:', (pptxData.length / 1024).toFixed(2), 'KB')
  
  return {
    filename: `${title}.pptx`,
    data: pptxData,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
}

// ============ 主函数 ============
export default async function (ctx) {
  console.log('=== DeckCraft V7.0 生成开始 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  const scene = ctx.body?.scene || 'report'
  const pageCount = parseInt(ctx.body?.pageCount) || 5
  const subStyleKey = ctx.body?.subStyle
  
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
      totalSteps: pageCount + 3,
      totalPages: pageCount,
      style: style,
      subStyle: recommendedKey
    })
    
    const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other
    const pages = structure.pages.slice(0, pageCount)
    
    // 为每个内容页生成具体内容
    pages.forEach(page => {
      if (page.type === 'content' && !page.points) {
        page.points = generateContentPoints(page.section, page.points || 3)
      }
    })
    
    const images = []
    const context = { topic: topic }
    
    // ========== 生成每页背景 ==========
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      await updateProgress(taskId, {
        currentStep: i + 2,
        currentPage: i + 1,
        message: `正在生成第${i + 1}页背景...`,
        totalPages: pages.length
      })
      
      const prompt = generatePrompt(page, style, subStyleConfig, context)
      console.log(`\n=== 第${i + 1}页 Prompt ===\n${prompt}\n`)
      
      const result = await generateBackground(prompt, apiKey, `${platformSize.width}x${platformSize.height}`)
      
      images.push({
        page: i + 1,
        type: page.type,
        url: result.url,
        error: result.error
      })
      
      if (result.error) {
        console.error(`第${i + 1}页生成失败:`, result.error)
      } else {
        console.log(`第${i + 1}页生成成功`)
      }
    }
    
    // ========== 生成PPTX文件 ==========
    await updateProgress(taskId, {
      currentStep: pages.length + 2,
      message: '正在生成PPTX文件...'
    })
    
    let pptxResult = null
    try {
      pptxResult = await generatePPTX(pages, images, topic, style, subStyleConfig)
    } catch (error) {
      console.error('PPTX生成失败:', error)
    }
    
    // ========== 完成 ==========
    const finalProgress = await updateProgress(taskId, {
      status: 'completed',
      currentStep: pages.length + 3,
      progress: 100,
      message: '生成完成'
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
        pptx: pptxResult,
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
