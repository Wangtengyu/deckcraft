/**
 * 模板解析API - Laf云函数（简化版）
 * 解析上传的PPTX文件，提取基本信息
 */

const cloud = require('@lafjs/cloud')

/**
 * 解析PPT模板
 * POST /parse-template
 * 
 * Body:
 * - file: PPTX文件（base64）
 * - fileName: 文件名
 */
export default async function (ctx: any) {
  const { file, fileName } = ctx.body
  
  if (!file) {
    return {
      success: false,
      message: '缺少文件'
    }
  }

  try {
    // 解析base64获取文件大小
    const base64Data = file.includes(',') ? file.split(',')[1] : file
    const buffer = Buffer.from(base64Data, 'base64')
    
    // 简单检测文件格式（PPTX文件以PK开头）
    const isPPTX = buffer.slice(0, 2).toString() === 'PK'
    if (!isPPTX) {
      return {
        success: false,
        message: '文件格式不正确，需要PPTX文件'
      }
    }
    
    // 根据文件名检测风格
    const styleType = detectStyle(fileName)
    
    // 估算图片数量（基于文件大小粗略估算）
    const estimatedImageCount = Math.floor(buffer.length / 50000) // 约每50KB一张图
    
    // 估算页数（基于XML标签数量）
    const xmlContent = buffer.toString('utf8', 0, Math.min(buffer.length, 100000))
    const pageCount = (xmlContent.match(/<p:sldId\b/g) || []).length || 8
    
    // 提取简单配色
    const colors = extractSimpleColors(xmlContent, styleType)
    
    // 分析布局
    const layouts = analyzeSimpleLayouts(pageCount)
    
    return {
      success: true,
      data: {
        styleType,
        imageCount: Math.min(estimatedImageCount, 30),
        pageCount,
        colors,
        layouts,
        fileSize: buffer.length,
        fileName
      }
    }
    
  } catch (error) {
    console.error('解析失败:', error)
    return {
      success: false,
      message: '解析失败: ' + error.message
    }
  }
}

/**
 * 根据文件名检测风格
 */
function detectStyle(fileName: string): string {
  const lower = (fileName || '').toLowerCase()
  
  if (lower.includes('党') || lower.includes('红') || lower.includes('政') || 
      lower.includes('红色') || lower.includes('党建') || lower.includes('红色')) {
    return '党政红金'
  }
  
  if (lower.includes('科技') || lower.includes('tech') || lower.includes('数码') || 
      lower.includes('互联网') || lower.includes('ai') || lower.includes('智能')) {
    return '科技未来'
  }
  
  if (lower.includes('商务') || lower.includes('business') || lower.includes('汇报') || 
      lower.includes('企业') || lower.includes('方案') || lower.includes('计划')) {
    return '商务简约'
  }
  
  if (lower.includes('教育') || lower.includes('培训') || lower.includes('课件') || 
      lower.includes('学校') || lower.includes('教学') || lower.includes('课程')) {
    return '教育培训'
  }
  
  if (lower.includes('清新') || lower.includes('环保') || lower.includes('健康') || 
      lower.includes('绿色') || lower.includes('生态') || lower.includes('自然')) {
    return '清新生活'
  }
  
  if (lower.includes('婚') || lower.includes('爱情') || lower.includes('情侣') || 
      lower.includes('生日') || lower.includes('纪念日')) {
    return '浪漫温馨'
  }
  
  if (lower.includes('年') && (lower.includes('终') || lower.includes('总结') || lower.includes('汇报'))) {
    return '年终总结'
  }
  
  if (lower.includes('产品') || lower.includes('发布') || lower.includes('新品')) {
    return '产品发布'
  }
  
  return '通用风格'
}

/**
 * 提取简单配色
 */
function extractSimpleColors(xmlContent: string, styleType: string): string[] {
  // 基于风格类型的预设配色
  const styleColors: Record<string, string[]> = {
    '党政红金': ['#C41E3A', '#FFD700', '#DC143C', '#8B0000', '#FFF8DC', '#FFFFFF'],
    '科技未来': ['#00D4FF', '#0066FF', '#00CED1', '#1E90FF', '#E0FFFF', '#FFFFFF'],
    '商务简约': ['#2C5282', '#4A90D9', '#1A365D', '#63B3ED', '#EBF8FF', '#FFFFFF'],
    '教育培训': ['#D4A574', '#8B4513', '#DEB887', '#F5DEB3', '#FFF8DC', '#FFFFFF'],
    '清新生活': ['#228B22', '#90EE90', '#32CD32', '#98FB98', '#F0FFF0', '#FFFFFF'],
    '浪漫温馨': ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#FFF0F5', '#FFFFFF'],
    '年终总结': ['#1A365D', '#2D3748', '#4A5568', '#718096', '#EDF2F7', '#FFFFFF'],
    '产品发布': ['#1A1A1A', '#333333', '#666666', '#999999', '#F5F5F5', '#FFFFFF'],
    '通用风格': ['#00d4ff', '#ff6b9d', '#ffffff', '#1a1a24', '#2a2a3a', '#12121a']
  }
  
  return styleColors[styleType] || styleColors['通用风格']
}

/**
 * 分析简单布局
 */
function analyzeSimpleLayouts(pageCount: number): string[] {
  const layouts = []
  
  for (let i = 0; i < pageCount; i++) {
    if (i === 0) {
      layouts.push('封面')
    } else if (i === pageCount - 1) {
      layouts.push('结尾')
    } else {
      // 根据位置分配不同布局
      const layoutTypes = ['标题+内容', '图片+文字', '两栏布局', '纯内容', '图表']
      layouts.push(layoutTypes[i % layoutTypes.length])
    }
  }
  
  return layouts
}
