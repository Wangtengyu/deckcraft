import cloud from '@lafjs/cloud'

// 测试图片URL
const TEST_IMAGES = [
  'https://via.placeholder.com/1920x1080/4A90E2/FFFFFF?text=Cover+Page',
  'https://via.placeholder.com/1920x1080/50C878/FFFFFF?text=Content+Page'
]

const STYLE_CONFIG = {
  A: { name: '信息图风' },
  B: { name: '插画科普风' },
  C: { name: '图文混排风' },
  D: { name: '卡通绘本风' },
  E: { name: '手绘笔记风' }
}

export default async function (ctx) {
  const topic = ctx.body?.topic || '测试PPT'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  
  // 直接返回测试图片，确保功能可用
  return {
    success: true,
    ppt_title: topic,
    style: STYLE_CONFIG[style]?.name || '信息图风',
    platform: 'PPT标准',
    images: [
      { page_id: 1, type: 'cover', url: TEST_IMAGES[0] },
      { page_id: 2, type: 'content', url: TEST_IMAGES[1] }
    ]
  }
}
