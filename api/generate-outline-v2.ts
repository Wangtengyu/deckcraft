/**
 * 大纲生成API V2 - 使用智能模板生成大纲
 * 不调用AI图片生成，直接根据主题和场景生成结构化大纲
 */
import cloud from '@lafjs/cloud'

// 场景模板
const SCENE_TEMPLATES = {
  report: {
    name: '工作汇报',
    sections: [
      { section: '背景与目标', points: ['项目背景与现状分析', '核心目标与预期成果', '关键里程碑与时间节点'] },
      { section: '执行过程', points: ['前期调研与方案设计', '资源配置与团队分工', '实施步骤与关键动作', '风险识别与应对措施'] },
      { section: '关键成果', points: ['量化成果与数据表现', '质量提升与效率优化', '用户反馈与市场反响'] },
      { section: '总结与展望', points: ['项目总结与经验沉淀', '下一步计划与改进方向'] }
    ],
    ending: '感谢聆听'
  },
  proposal: {
    name: '项目方案',
    sections: [
      { section: '问题与机会', points: ['现状分析与痛点识别', '市场机会与发展趋势', '目标用户与需求洞察'] },
      { section: '解决方案', points: ['核心理念与设计思路', '技术方案与实施路径', '资源需求与团队配置'] },
      { section: '核心优势', points: ['差异化竞争力', '可行性与风险评估', '预期收益与ROI'] },
      { section: '实施计划', points: ['阶段划分与里程碑', '时间表与资源安排', '成功标准与验收指标'] }
    ],
    ending: '期待合作'
  },
  training: {
    name: '培训课件',
    sections: [
      { section: '培训目标', points: ['知识目标：掌握核心概念', '技能目标：提升实操能力', '态度目标：培养职业素养'] },
      { section: '基础知识', points: ['概念定义与核心原理', '发展历程与现状分析', '关键术语与专业概念'] },
      { section: '核心技能', points: ['技能一：具体操作步骤', '技能二：注意事项要点', '技能三：常见问题解决'] },
      { section: '实践应用', points: ['案例分析与实践演练', '工具使用与资源推荐', '持续学习与能力提升'] }
    ],
    ending: '培训总结'
  },
  science: {
    name: '知识科普',
    sections: [
      { section: '核心概念', points: ['什么是...？', '为什么重要？', '应用场景有哪些？'] },
      { section: '关键原理', points: ['基本原理介绍', '技术实现方式', '发展历程回顾'] },
      { section: '实践应用', points: ['典型案例分析', '实际应用场景', '未来发展趋势'] }
    ],
    ending: '感谢聆听'
  },
  other: {
    name: '通用模板',
    sections: [
      { section: '背景介绍', points: ['背景信息', '核心问题', '解决方案'] },
      { section: '主要内容', points: ['要点一', '要点二', '要点三'] },
      { section: '总结展望', points: ['核心总结', '未来展望'] }
    ],
    ending: '感谢聆听'
  }
}

export default async function (ctx: any) {
  console.log('=== 大纲生成API V2 ===')
  
  try {
    const { topic, pageCount, refDocument, refUrl, scene } = ctx.body
    
    if (!topic) {
      return { ok: false, message: '请提供主题' }
    }
    
    console.log('主题:', topic, '页数:', pageCount, '场景:', scene)
    
    // 选择场景模板
    const template = SCENE_TEMPLATES[scene] || SCENE_TEMPLATES.other
    
    // 根据页数调整章节数量
    const targetPages = pageCount || 5
    const sections = template.sections.slice(0, Math.max(2, targetPages - 2))
    
    // 生成标题（智能优化）
    let title = topic
    // 如果主题太短，添加一些修饰
    if (topic.length < 4) {
      title = `关于${topic}的汇报`
    }
    
    // 构建大纲
    const outline = {
      title: title,
      subtitle: '',
      outline: sections,
      ending: template.ending
    }
    
    console.log('大纲生成成功:', outline.title, outline.outline.length, '个章节')
    
    return {
      ok: true,
      outline: outline
    }
    
  } catch (error) {
    console.error('大纲生成失败:', error)
    return {
      ok: false,
      message: error.message || '大纲生成失败'
    }
  }
}
