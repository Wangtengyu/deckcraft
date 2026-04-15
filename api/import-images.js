/**
 * 图片库数据导入函数
 * 执行一次即可导入所有图片数据到 image_library 集合
 */

const cloud = require('@lafjs/cloud')

exports.main = async (ctx) => {
  const db = cloud.database()
  const images = [
    {
      "_id": "tpl_guobao_001_cover",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image1.png",
      "type": "cover",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示", "高端", "党政"],
      "colors": ["#C41E3A", "#FFD700", "#8B0000"],
      "layout": "center",
      "mood": "庄重大气、华贵典雅",
      "usage_count": 0,
      "quality_score": 4.8,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_content_01",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image2.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "left_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_content_02",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image3.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "right_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_content_03",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image4.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_content_04",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image5.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_content_05",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image6.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_toc",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image7.png",
      "type": "toc",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.6,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_001_end",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image8.png",
      "type": "end",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.6,
      "source": "template_tpl_guobao_001"
    },
    {
      "_id": "tpl_guobao_002_cover",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image1.png",
      "type": "cover",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示", "高端", "党政"],
      "colors": ["#C41E3A", "#FFD700", "#8B0000"],
      "layout": "center",
      "mood": "庄重大气、华贵典雅",
      "usage_count": 0,
      "quality_score": 4.8,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_content_01",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image2.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "left_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_content_02",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image3.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "right_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_content_03",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image4.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_content_04",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image5.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_content_05",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image6.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_toc",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image7.png",
      "type": "toc",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.6,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_002_end",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image8.png",
      "type": "end",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.6,
      "source": "template_tpl_guobao_002"
    },
    {
      "_id": "tpl_guobao_003_cover",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image1.png",
      "type": "cover",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示", "高端", "党政"],
      "colors": ["#C41E3A", "#FFD700", "#8B0000"],
      "layout": "center",
      "mood": "庄重大气、华贵典雅",
      "usage_count": 0,
      "quality_score": 4.8,
      "source": "template_tpl_guobao_003"
    },
    {
      "_id": "tpl_guobao_003_content_01",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image2.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "left_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_003"
    },
    {
      "_id": "tpl_guobao_003_content_02",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image3.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFD700"],
      "layout": "right_title",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_003"
    },
    {
      "_id": "tpl_guobao_003_content_03",
      "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image4.png",
      "type": "content",
      "style": "party_red",
      "keywords": ["国宝", "文化", "展示"],
      "colors": ["#C41E3A", "#FFF8DC"],
      "layout": "center",
      "mood": "庄重典雅",
      "usage_count": 0,
      "quality_score": 4.5,
      "source": "template_tpl_guobao_003"
    }
  ]
  
  try {
    // 先清空集合
    const collection = db.collection('image_library')
    
    // 批量插入
    const result = await collection.add(images)
    
    return {
      success: true,
      message: `成功导入 ${images.length} 张图片数据`,
      inserted: result.insertedIds
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
