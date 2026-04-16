/**
 * 从PPTX文件中提取图片并自动添加到图片库
 * 用于投喂模板的自动化处理
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const sharp = require('sharp');

// 配置
const SOURCE_DIR = path.join(__dirname, '../用户上传');  // 投喂PPT存放目录
const OUTPUT_DIR = path.join(__dirname, '../templates-assets/images/library');  // 提取图片存放目录
const INDEX_PATH = path.join(__dirname, '../templates-assets/image-library-index.json');

// 风格映射（根据PPT颜色自动判断）
const STYLE_PATTERNS = {
  party_red: {
    colors: ['#C41E3A', '#8B0000', '#FFD700', '#DC143C', '#B22222'],
    keywords: ['党建', '党课', '党委', '红色', '党政', '党日', '表彰'],
    mood: '庄重大气、华贵典雅'
  },
  tech_blue: {
    colors: ['#1E90FF', '#00CED1', '#191970', '#4169E1', '#00BFFF'],
    keywords: ['科技', 'AI', '人工智能', '数字化', '互联网', '创新', '未来'],
    mood: '科技感、未来感、专业严谨'
  },
  business: {
    colors: ['#2C5282', '#4A90D9', '#1A365D', '#4682B4', '#5F9EA0'],
    keywords: ['商务', '企业', '汇报', '方案', '计划', '总结', '工作'],
    mood: '简洁专业、清爽大气'
  },
  warm: {
    colors: ['#D4A574', '#F5DEB3', '#8B7355', '#DEB887', '#D2B48C'],
    keywords: ['培训', '教育', '生活', '健康', '家庭'],
    mood: '温暖舒适、亲切自然'
  },
  nature: {
    colors: ['#228B22', '#90EE90', '#006400', '#32CD32', '#3CB371'],
    keywords: ['环保', '自然', '健康', '有机', '生态'],
    mood: '自然清新、生机盎然'
  }
};

class PPTImageExtractor {
  constructor() {
    this.ensureOutputDir();
    this.index = this.loadIndex();
  }
  
  /**
   * 确保输出目录存在
   */
  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }
  
  /**
   * 加载图片库索引
   */
  loadIndex() {
    try {
      if (fs.existsSync(INDEX_PATH)) {
        return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
      }
    } catch (error) {
      console.error('加载索引失败:', error.message);
    }
    return { images: [], stats: {} };
  }
  
  /**
   * 保存索引
   */
  saveIndex() {
    // 更新统计
    this.index.stats = {
      total_images: this.index.images.length,
      by_style: this.groupBy('style'),
      by_type: this.groupBy('type'),
      last_updated: new Date().toISOString(),
      version: this.index.stats?.version || '1.0'
    };
    
    fs.writeFileSync(INDEX_PATH, JSON.stringify(this.index, null, 2));
  }
  
  /**
   * 处理单个PPTX文件
   */
  async processPPTX(pptxPath) {
    const filename = path.basename(pptxPath, '.pptx');
    const templateId = `tpl_${filename}_${Date.now()}`;
    
    console.log(`\n📄 处理PPT: ${filename}`);
    
    try {
      // 1. 解压PPTX文件
      const zip = new AdmZip(pptxPath);
      const entries = zip.getEntries();
      
      // 2. 查找图片文件
      const imageEntries = entries.filter(entry => 
        entry.entryName.match(/\/media\/.+\.(png|jpg|jpeg|gif)$/i)
      );
      
      console.log(`  找到 ${imageEntries.length} 张图片`);
      
      if (imageEntries.length === 0) {
        console.log('  ❌ 没有找到图片');
        return { success: false, count: 0 };
      }
      
      // 3. 提取并分析每张图片
      const extractedImages = [];
      
      for (let i = 0; i < imageEntries.length; i++) {
        const entry = imageEntries[i];
        const imageExt = path.extname(entry.entryName);
        const outputName = `${templateId}_${i + 1}${imageExt}`;
        const outputPath = path.join(OUTPUT_DIR, outputName);
        
        // 提取图片
        const imageBuffer = entry.getData();
        fs.writeFileSync(outputPath, imageBuffer);
        
        console.log(`  ✅ 提取: ${outputName}`);
        
        // 分析图片特征
        const features = await this.analyzeImage(outputPath);
        
        // 判断页面类型
        const pageType = this.detectPageType(i, imageEntries.length);
        
        // 创建索引记录
        const imageData = {
          id: `${templateId}_${i + 1}`,
          path: outputPath.replace(path.join(__dirname, '../'), ''),
          type: pageType,
          style: features.style,
          keywords: features.keywords,
          colors: features.colors,
          layout: features.layout,
          mood: features.mood,
          usage_count: 0,
          quality_score: features.quality_score,
          source: `template_${templateId}`,
          extracted_from: filename
        };
        
        extractedImages.push(imageData);
      }
      
      // 4. 添加到索引
      this.index.images.push(...extractedImages);
      this.saveIndex();
      
      console.log(`\n✅ 完成: ${extractedImages.length}张图片已添加到图片库`);
      
      return {
        success: true,
        count: extractedImages.length,
        templateId: templateId,
        images: extractedImages
      };
      
    } catch (error) {
      console.error(`❌ 处理失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 分析图片特征
   */
  async analyzeImage(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // 提取主色调
      const { dominant } = await image
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
          const colors = {};
          for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / 32) * 32;
            const g = Math.floor(data[i + 1] / 32) * 32;
            const b = Math.floor(data[i + 2] / 32) * 32;
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            colors[hex] = (colors[hex] || 0) + 1;
          }
          
          const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
          return { dominant: sorted.slice(0, 3).map(([c]) => c) };
        });
      
      // 判断风格
      const style = this.matchStyle(dominant);
      
      // 根据风格推断关键词
      const keywords = STYLE_PATTERNS[style].keywords.slice(0, 5);
      
      // 估算质量分数（基于分辨率和色彩丰富度）
      const qualityScore = this.estimateQuality(metadata.width, metadata.height, dominant.length);
      
      return {
        style: style,
        keywords: keywords,
        colors: dominant,
        layout: 'center',  // 默认布局，后续可优化
        mood: STYLE_PATTERNS[style].mood,
        quality_score: qualityScore
      };
      
    } catch (error) {
      console.error('图片分析失败:', error.message);
      
      // 返回默认值
      return {
        style: 'business',
        keywords: ['通用'],
        colors: ['#2C5282', '#4A90D9'],
        layout: 'center',
        mood: '简洁专业',
        quality_score: 4.0
      };
    }
  }
  
  /**
   * 根据主色调匹配风格
   */
  matchStyle(colors) {
    let bestMatch = 'business';
    let maxScore = 0;
    
    for (const [style, pattern] of Object.entries(STYLE_PATTERNS)) {
      let score = 0;
      
      for (const color of colors) {
        if (pattern.colors.some(pc => this.colorDistance(color, pc) < 50)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = style;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * 计算颜色距离
   */
  colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    
    return Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
  }
  
  /**
   * 估算质量分数
   */
  estimateQuality(width, height, colorCount) {
    // 分辨率评分 (0-3分)
    const resolutionScore = Math.min(width * height / (1920 * 1080), 1) * 3;
    
    // 色彩丰富度评分 (0-2分)
    const colorScore = Math.min(colorCount / 3, 1) * 2;
    
    return Math.min(resolutionScore + colorScore + 2, 5.0); // 基础分2分
  }
  
  /**
   * 判断页面类型
   */
  detectPageType(index, total) {
    if (index === 0) return 'cover';
    if (index === total - 1) return 'ending';
    return 'content';
  }
  
  /**
   * 批量处理目录中的所有PPT文件
   */
  async processDirectory(dir = SOURCE_DIR) {
    console.log(`\n📂 扫描目录: ${dir}`);
    
    const files = fs.readdirSync(dir);
    const pptxFiles = files.filter(f => f.endsWith('.pptx'));
    
    console.log(`找到 ${pptxFiles.length} 个PPT文件`);
    
    const results = [];
    
    for (const file of pptxFiles) {
      const pptxPath = path.join(dir, file);
      const result = await this.processPPTX(pptxPath);
      results.push({ file, ...result });
    }
    
    // 统计
    const success = results.filter(r => r.success);
    const totalExtracted = success.reduce((sum, r) => sum + r.count, 0);
    
    console.log(`\n📊 批量处理完成:`);
    console.log(`  成功: ${success.length}/${results.length}`);
    console.log(`  提取图片: ${totalExtracted}张`);
    console.log(`  图片库总数: ${this.index.images.length}张`);
    
    return results;
  }
  
  /**
   * 分组统计
   */
  groupBy(field) {
    const counts = {};
    this.index.images.forEach(img => {
      const key = img[field];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }
}

// ============ CLI 命令 ============
if (require.main === module) {
  const extractor = new PPTImageExtractor();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'single':
      if (args.length < 2) {
        console.log('用法: node extract-images-from-ppt.js single <pptx文件路径>');
        break;
      }
      extractor.processPPTX(args[1]);
      break;
      
    case 'batch':
      const dir = args[1] || SOURCE_DIR;
      extractor.processDirectory(dir);
      break;
      
    case 'stats':
      console.log('\n📊 图片库统计:');
      console.log(`  总数: ${extractor.index.images.length}`);
      console.log(`  按风格: ${JSON.stringify(extractor.groupBy('style'))}`);
      console.log(`  按类型: ${JSON.stringify(extractor.groupBy('type'))}`);
      break;
      
    default:
      console.log(`
PPT图片提取工具

命令:
  single <pptx文件>   处理单个PPT文件
  batch [目录]         批量处理目录中的PPT文件
  stats               查看图片库统计

示例:
  node extract-images-from-ppt.js single 用户上传/test.pptx
  node extract-images-from-ppt.js batch
  node extract-images-from-ppt.js batch ./uploads
      `);
  }
}

module.exports = PPTImageExtractor;
