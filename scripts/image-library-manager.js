/**
 * FDeck 图片库管理系统
 * 优先使用投喂库图片，AI生图兜底
 */

const fs = require('fs');
const path = require('path');

// ============ 图片库索引结构 ============
/**
 * 图片库索引存储在 templates-assets/image-library-index.json
 * 
 * 结构示例：
 * {
 *   "images": [
 *     {
 *       "id": "img_001",
 *       "path": "templates-assets/images/library/tech_001.jpg",
 *       "type": "cover",          // cover/content/toc/ending
 *       "style": "tech_blue",      // 风格标签
 *       "keywords": ["科技", "AI", "数字化", "未来", "创新"],
 *       "colors": ["#1E90FF", "#00CED1", "#191970"],
 *       "layout": "center",        // 布局类型
 *       "mood": "科技感、未来感",
 *       "usage_count": 5,          // 使用次数（用于推荐）
 *       "quality_score": 4.5,      // 质量评分
 *       "source": "template_xxx"   // 来源模板
 *     }
 *   ],
 *   "stats": {
 *     "total_images": 100,
 *     "by_style": { "tech_blue": 20, "party_red": 15 },
 *     "by_type": { "cover": 25, "content": 60, "ending": 15 }
 *   }
 * }
 */

// ============ 图片匹配器 ============
class ImageLibraryMatcher {
  constructor(indexPath = '../templates-assets/image-library-index.json') {
    this.indexPath = indexPath;
    this.library = this.loadLibrary();
  }
  
  /**
   * 加载图片库索引
   */
  loadLibrary() {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = fs.readFileSync(this.indexPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[图片库] 加载索引失败:', error.message);
    }
    
    // 返回空库
    return { images: [], stats: { total_images: 0 } };
  }
  
  /**
   * 匹配最合适的图片
   * @param {Object} params - 匹配参数
   * @param {string} params.type - 页面类型 (cover/content/toc/ending)
   * @param {string} params.style - 风格 (tech_blue/party_red/business等)
   * @param {string} params.topic - 主题关键词
   * @param {string} params.mood - 情绪氛围
   * @param {number} params.minScore - 最低匹配分 (0-100)
   * @returns {Object|null} - 匹配结果 {image, score, needAI}
   */
  matchImage(params) {
    const { type, style, topic, mood, minScore = 60 } = params;
    
    console.log(`[图片匹配] 类型=${type}, 风格=${style}, 主题=${topic}`);
    
    // 1. 筛选候选图片
    const candidates = this.library.images.filter(img => {
      // 必须匹配页面类型
      if (img.type !== type && img.type !== 'content') return false;
      return true;
    });
    
    if (candidates.length === 0) {
      console.log('[图片匹配] 库中无匹配图片，需AI生成');
      return { image: null, score: 0, needAI: true, reason: '库中无图片' };
    }
    
    // 2. 计算匹配分数
    const scored = candidates.map(img => {
      let score = 0;
      
      // 风格匹配 (权重40%)
      if (img.style === style) {
        score += 40;
      } else if (this.isStyleCompatible(img.style, style)) {
        score += 20; // 兼容风格
      }
      
      // 关键词匹配 (权重30%)
      const topicKeywords = topic.toLowerCase().split(/[,，、\s]+/);
      const matchedKeywords = img.keywords.filter(kw => 
        topicKeywords.some(t => t.includes(kw) || kw.includes(t))
      );
      score += (matchedKeywords.length / img.keywords.length) * 30;
      
      // 情绪氛围匹配 (权重20%)
      if (mood && img.mood && img.mood.includes(mood)) {
        score += 20;
      }
      
      // 质量和使用频率 (权重10%)
      score += (img.quality_score / 5) * 5;
      score += Math.min(img.usage_count * 0.5, 5);
      
      return { image: img, score: Math.round(score) };
    });
    
    // 3. 按分数排序
    scored.sort((a, b) => b.score - a.score);
    
    const best = scored[0];
    
    // 4. 判断是否需要AI生成
    if (best.score >= minScore) {
      console.log(`[图片匹配] 找到匹配图片: ${best.image.id}, 分数=${best.score}`);
      
      // 更新使用次数
      best.image.usage_count++;
      this.saveLibrary();
      
      return {
        image: best.image,
        score: best.score,
        needAI: false
      };
    } else {
      console.log(`[图片匹配] 最佳匹配分数${best.score}低于阈值${minScore}，需AI生成`);
      return {
        image: best.image,
        score: best.score,
        needAI: true,
        reason: '匹配度不足'
      };
    }
  }
  
  /**
   * 判断两个风格是否兼容
   */
  isStyleCompatible(style1, style2) {
    const compatibleGroups = [
      ['tech_blue', 'business'],           // 科技蓝 + 商务
      ['party_red', 'warm'],               // 党政红 + 温暖
      ['nature', 'warm'],                  // 自然 + 温暖
      ['business', 'warm'],                // 商务 + 温暖
    ];
    
    return compatibleGroups.some(group => 
      group.includes(style1) && group.includes(style2)
    );
  }
  
  /**
   * 批量匹配图片（用于整个PPT）
   */
  matchBatch(pages, style, topic, mood) {
    const results = [];
    
    for (const page of pages) {
      const match = this.matchImage({
        type: page.type,
        style: style,
        topic: topic,
        mood: mood,
        minScore: 65  // 批量匹配提高阈值
      });
      
      results.push({
        pageId: page.page_id,
        pageType: page.type,
        ...match
      });
    }
    
    // 统计
    const fromLibrary = results.filter(r => !r.needAI).length;
    const needAI = results.filter(r => r.needAI).length;
    
    console.log(`[图片匹配] 批量匹配完成: 库图=${fromLibrary}, AI生图=${needAI}`);
    
    return {
      matches: results,
      stats: {
        total: results.length,
        fromLibrary,
        needAI,
        libraryRatio: fromLibrary / results.length
      }
    };
  }
  
  /**
   * 保存索引
   */
  saveLibrary() {
    try {
      // 更新统计
      this.library.stats = {
        total_images: this.library.images.length,
        by_style: this.groupBy('style'),
        by_type: this.groupBy('type')
      };
      
      fs.writeFileSync(this.indexPath, JSON.stringify(this.library, null, 2));
    } catch (error) {
      console.error('[图片库] 保存索引失败:', error.message);
    }
  }
  
  groupBy(field) {
    const counts = {};
    this.library.images.forEach(img => {
      const key = img[field];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * 添加图片到库
   */
  addImage(imageData) {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newImage = {
      id,
      path: imageData.path,
      type: imageData.type || 'content',
      style: imageData.style || 'business',
      keywords: imageData.keywords || [],
      colors: imageData.colors || [],
      layout: imageData.layout || 'center',
      mood: imageData.mood || '',
      usage_count: 0,
      quality_score: imageData.quality_score || 4.0,
      source: imageData.source || 'user_upload'
    };
    
    this.library.images.push(newImage);
    this.saveLibrary();
    
    console.log(`[图片库] 添加图片: ${id}`);
    return newImage;
  }
}

// ============ 从模板提取图片并索引 ============
async function extractAndIndexFromTemplate(templatePath, outputPath) {
  const PptxGenJS = require('pptxgenjs');
  const sharp = require('sharp');
  
  console.log(`[图片提取] 从模板提取图片: ${templatePath}`);
  
  // 这里需要解析PPTX文件，提取图片
  // 实际实现需要 pptxgenjs 或其他库的支持
  
  // 伪代码示例：
  // 1. 解析PPTX
  // 2. 提取每页的背景图
  // 3. 分析图片特征（颜色、风格）
  // 4. 生成缩略图
  // 5. 添加到索引
  
  return {
    extracted: 0,
    indexed: 0
  };
}

// ============ 导出 ============
module.exports = {
  ImageLibraryMatcher,
  extractAndIndexFromTemplate
};

// ============ 测试用例 ============
if (require.main === module) {
  const matcher = new ImageLibraryMatcher();
  
  // 测试匹配
  const result = matcher.matchImage({
    type: 'cover',
    style: 'tech_blue',
    topic: 'AI技术发展报告',
    mood: '科技感'
  });
  
  console.log('匹配结果:', result);
}
