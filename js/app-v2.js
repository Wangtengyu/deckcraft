/**
 * DeckCraft - 前端交互逻辑 V2.0
 * Phase 2: 添加细分风格选择
 * Phase 3: 添加参考图处理
 * Phase 4: 添加进度反馈
 * Phase 5: 添加文档和链接解析
 */

// API配置
const API_URL = 'https://ig8u65l6vm.sealosbja.site/generate';
const MODIFY_API_URL = 'https://ig8u65l6vm.sealosbja.site/modify';
const PROGRESS_API_URL = 'https://ig8u65l6vm.sealosbja.site/progress';
const UPLOAD_API_URL = 'https://ig8u65l6vm.sealosbja.site/upload';
const PARSE_DOC_API_URL = 'https://ig8u65l6vm.sealosbja.site/parse-document';
const PARSE_URL_API_URL = 'https://ig8u65l6vm.sealosbja.site/parse-url';
const SPEECH_SCRIPT_API_URL = 'https://ig8u65l6vm.sealosbja.site/generate-speech-scrip';

// 细分风格配置（与后端 generate-v6.ts 保持一致）
const SUB_STYLE_CONFIG = {
  A: {
    name: '信息图风',
    subStyles: {
      'party_red': { name: '党政红金', keywords: ['党建', '党课', '主题党日', '表彰大会'] },
      'gov_blue': { name: '政务蓝', keywords: ['政务', '政策', '政府', '机关'] },
      'culture': { name: '文化古典', keywords: ['历史', '国学', '传统文化', '古典'] },
      'tech_warm': { name: '米白暖色', keywords: ['互联网', '科技', '创意', '教育培训'] },
      'general_blue': { name: '通用蓝白', keywords: [] }
    }
  },
  B: {
    name: '插画科普风',
    subStyles: {
      'blackboard': { name: '黑板粉笔', keywords: ['课堂', '教学', '数学', '物理'] },
      'flat_illustration': { name: '扁平插画', keywords: ['小学课件', '培训', '安全教育', '科普'] },
      'warm_yellow': { name: '暖黄亲切', keywords: ['生活技能', '健康', '育儿', '家庭'] }
    }
  },
  C: {
    name: '图文混排风',
    subStyles: {
      'nature': { name: '自然风光', keywords: ['旅游', '风景', '自然', '山水'] },
      'city': { name: '城市建筑', keywords: ['建筑', '城市', '商务', '地标'] },
      'food': { name: '美食摄影', keywords: ['美食', '餐饮', '菜品', '餐厅'] }
    }
  },
  D: {
    name: '卡通绘本风',
    subStyles: {
      'candy': { name: '糖果色', keywords: ['数字', '形状', '颜色', '认知', '幼儿'] },
      'watercolor': { name: '绘本水彩', keywords: ['故事', '童话', '动物', '绘本'] }
    }
  },
  E: {
    name: '手绘笔记风',
    subStyles: {
      'hand_drawn': { name: '手绘信息图', keywords: ['知识分享', '生活常识', '科普', '笔记'] }
    }
  }
};

// 参考图模式配置
const REF_IMAGE_MODES = {
  embed: { name: '配图嵌入', desc: '人物照、风景照、活动照', allowDecor: true },
  strict: { name: '严格原样', desc: 'Logo、产品图、证件照', allowDecor: false },
  content_ref: { name: '内容参考', desc: '图表、架构图（重绘）', allowDecor: false },
  style_ref: { name: '风格参考', desc: '设计稿（参考风格）', allowDecor: false }
};

// 状态管理
let state = {
  currentStep: 1,
  createMode: 'create',
  templateId: null,  // 当前选中的模板ID
  platform: 'ppt',
  contentSource: 'topic',
  contentDensity: 'medium',
  audience: 'adult',
  scene: 'report',
  style: 'B',
  subStyle: null,
  pageCount: 10,
  // 页面结构选项
  hasCover: true,
  hasCatalog: false,
  hasContent: true,
  hasEnding: true,
  smartTitle: true,
  // 参考素材
  refImages: [],
  refImageFiles: [],
  refImageMode: 'embed',
  refImageDescriptions: [],
  refDocument: null,
  refUrl: null,
  userContent: '',
  apiKey: '',
  usePlatformApi: true,
  contentMode: 'custom',
  outline: null,
  generatedImages: [],
  addToGallery: false,
  pptContent: null  // 保存PPT内容用于演讲稿生成
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadSponsorsList();
  initSubStyleSelector();
  initRefImageUploader();
  initDocumentUploader();
  initUrlParser();
  
  // ============ 从首页传递的数据 ============
  const savedTopic = localStorage.getItem('pptTopic');
  const savedTemplateId = localStorage.getItem('pptTemplateId');
  const savedPlatform = localStorage.getItem('pptPlatform');

  if (savedTopic) {
    const topicInput = document.getElementById('topic');
    if (topicInput) {
      topicInput.value = savedTopic;
      state.userContent = savedTopic;
    }
    localStorage.removeItem('pptTopic');
  }

  if (savedTemplateId) {
    state.createMode = 'template';
    state.templateId = savedTemplateId;
    // 切换到模板复刻模式
    selectMode('template');
    // 显示选中的模板信息
    setTimeout(() => {
      showSelectedTemplate(savedTemplateId);
    }, 100);
    localStorage.removeItem('pptTemplateId');
  }

  if (savedPlatform) {
    selectPlatform(savedPlatform);
    localStorage.removeItem('pptPlatform');
  }
  
  // 显示用户流程提示
  showUserFlowTip();
});

// ============ 用户流程提示 ============
function showUserFlowTip() {
  const tipContainer = document.getElementById('flowTip');
  if (!tipContainer) return;
  
  const hasTopic = document.getElementById('topic')?.value;
  const isTemplateMode = state.createMode === 'template' && state.templateId;
  
  if (hasTopic || isTemplateMode) {
    let tipText = '';
    if (hasTopic && isTemplateMode) {
      tipText = '✅ 已从首页带入主题和模板';
    } else if (hasTopic) {
      tipText = '✅ 已从首页带入主题';
    } else if (isTemplateMode) {
      tipText = '✅ 已从首页带入模板';
    }
    
    tipContainer.innerHTML = `
      <div class="p-3 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
        <div class="flex items-center text-green-400 text-sm">
          <i class="fas fa-check-circle mr-2"></i>
          <span>${tipText}</span>
        </div>
      </div>
    `;
    tipContainer.classList.remove('hidden');
  } else {
    tipContainer.innerHTML = `
      <div class="p-3 bg-accent/10 border border-accent/20 rounded-xl mb-4">
        <div class="flex items-center text-gray-400 text-sm">
          <i class="fas fa-info-circle mr-2 text-accent"></i>
          <span>请填写基本信息，或从首页选择模板</span>
        </div>
      </div>
    `;
    tipContainer.classList.remove('hidden');
  }
}

// ============ 模板信息配置 ============
const TEMPLATE_INFO = {
  'tpl_guobao_001': {
    name: '国宝文化展示',
    thumb: 'templates-assets/images/tpl_guobao_001/thumbs/image1.jpg',
    cover: 'templates-assets/images/tpl_guobao_001/image1.png',
    pages: 10,
    style: '党政红金',
    category: 'party'
  }
};

// ============ 显示选中的模板 ============
function showSelectedTemplate(templateId) {
  const template = TEMPLATE_INFO[templateId];
  if (!template) return;
  
  // 更新状态
  state.templateId = templateId;
  
  // 在模板复刻模式下显示选中的模板
  const templateInfo = document.getElementById('selectedTemplateInfo');
  if (templateInfo) {
    templateInfo.innerHTML = `
      <div class="p-4 bg-accent/10 border border-accent/30 rounded-xl">
        <div class="flex items-center gap-4">
          <img src="${template.thumb}" class="w-20 h-14 object-cover rounded-lg border border-border" alt="${template.name}"
               onerror="this.src='${template.cover}'">
          <div>
            <div class="font-medium text-sm">${template.name}</div>
            <div class="text-xs text-gray-400 mt-1">${template.style} · ${template.pages}页</div>
          </div>
          <button onclick="changeTemplate()" class="ml-auto text-accent text-sm hover:text-accent/80 flex items-center">
            <i class="fas fa-exchange-alt mr-1"></i>更换模板
          </button>
        </div>
      </div>
    `;
    templateInfo.classList.remove('hidden');
  }
  
  // 更新模板卡片选中状态
  updateTemplateCardSelection(templateId);
}

// ============ 更换模板 ============
function changeTemplate() {
  // 显示模板选择弹窗
  showTemplateSelector();
}

// ============ 模板选择弹窗 ============
function showTemplateSelector() {
  const modal = document.getElementById('templateSelectorModal');
  if (!modal) {
    // 动态创建弹窗
    createTemplateSelectorModal();
  } else {
    modal.classList.remove('hidden');
  }
  updateTemplateSelectorCards();
}

function createTemplateSelectorModal() {
  const modal = document.createElement('div');
  modal.id = 'templateSelectorModal';
  modal.className = 'hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-border">
      <div class="p-4 border-b border-border flex items-center justify-between">
        <h3 class="font-bold">选择模板</h3>
        <button onclick="closeTemplateSelector()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <div id="templateSelectorContent" class="p-4 overflow-y-auto max-h-[60vh]">
        <!-- 模板卡片列表 -->
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  updateTemplateSelectorCards();
}

function updateTemplateSelectorCards() {
  const container = document.getElementById('templateSelectorContent');
  if (!container) return;
  
  let html = '<div class="grid grid-cols-2 gap-4">';
  
  for (const [id, template] of Object.entries(TEMPLATE_INFO)) {
    const isSelected = state.templateId === id;
    html += `
      <div onclick="selectTemplateFromList('${id}')" 
           class="cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-accent/50'}">
        <div class="aspect-video relative bg-gradient-to-br from-gray-800 to-gray-900">
          <img src="${template.cover}" alt="${template.name}" class="w-full h-full object-cover"
               onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full\\'><i class=\\'fas fa-image text-3xl text-gray-600\\'></i></div>'">
          ${isSelected ? '<div class="absolute top-2 right-2"><span class="bg-accent text-black text-xs px-2 py-1 rounded-full font-medium">已选择</span></div>' : ''}
        </div>
        <div class="p-3">
          <div class="font-medium text-sm">${template.name}</div>
          <div class="text-xs text-gray-500 mt-1">${template.style} · ${template.pages}页</div>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function selectTemplateFromList(templateId) {
  state.templateId = templateId;
  state.createMode = 'template';
  selectMode('template');
  showSelectedTemplate(templateId);
  closeTemplateSelector();
}

function closeTemplateSelector() {
  const modal = document.getElementById('templateSelectorModal');
  if (modal) modal.classList.add('hidden');
}

function updateTemplateCardSelection(templateId) {
  // 更新create.html中模板选择卡片的选中状态
  const cards = document.querySelectorAll('[data-template-id]');
  cards.forEach(card => {
    if (card.dataset.templateId === templateId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

// ============ 选择模板卡片（从模板选择器） ============
function selectTemplateCard(templateId) {
  state.templateId = templateId;
  state.createMode = 'template';
  // 更新卡片选中状态
  updateTemplateCardSelection(templateId);
  // 显示选中的模板信息
  showSelectedTemplate(templateId);
  // 滚动到选中的模板信息区域
  const templateInfo = document.getElementById('selectedTemplateInfo');
  if (templateInfo) {
    templateInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ============ 文档解析 ============
function initDocumentUploader() {
  const docInput = document.getElementById('refDocument');
  if (!docInput) return;
  
  docInput.addEventListener('change', handleDocumentUpload);
}

async function handleDocumentUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showToast('正在解析文档...', 'info');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(PARSE_DOC_API_URL, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      state.refDocument = result.content;
      showToast('文档解析成功', 'success');
      
      // 显示解析结果
      const docPreview = document.getElementById('docPreview');
      if (docPreview) {
        docPreview.innerHTML = `
          <div class="p-3 bg-surface rounded-lg border border-border mt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium"><i class="fas fa-file-alt mr-2 text-accent"></i>${result.fileName}</span>
              <button onclick="clearDocument()" class="text-xs text-red-400 hover:text-red-300">清除</button>
            </div>
            <p class="text-xs text-gray-400 line-clamp-3">${result.content.substring(0, 200)}...</p>
          </div>
        `;
        docPreview.classList.remove('hidden');
      }
    } else {
      showToast(result.error || '文档解析失败', 'error');
    }
  } catch (error) {
    showToast('文档解析失败: ' + error.message, 'error');
  }
}

function clearDocument() {
  state.refDocument = null;
  const docInput = document.getElementById('refDocument');
  if (docInput) docInput.value = '';
  const docPreview = document.getElementById('docPreview');
  if (docPreview) docPreview.classList.add('hidden');
}

// ============ 链接解析 ============
function initUrlParser() {
  const urlInput = document.getElementById('refUrl');
  if (!urlInput) return;
  
  // 失去焦点时解析
  urlInput.addEventListener('blur', handleUrlInput);
}

async function handleUrlInput(event) {
  const url = event.target.value.trim();
  if (!url || !url.startsWith('http')) return;
  
  // 如果已经解析过这个URL，跳过
  if (state.refUrl && state.refUrl.url === url) return;
  
  showToast('正在解析链接...', 'info');
  
  try {
    const response = await fetch(PARSE_URL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const result = await response.json();
    
    if (result.success) {
      state.refUrl = { url, content: result.content, title: result.title };
      showToast('链接解析成功', 'success');
      
      // 显示解析结果
      const urlPreview = document.getElementById('urlPreview');
      if (urlPreview) {
        urlPreview.innerHTML = `
          <div class="p-3 bg-surface rounded-lg border border-border mt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium"><i class="fas fa-link mr-2 text-accent"></i>${result.title || url}</span>
              <button onclick="clearUrl()" class="text-xs text-red-400 hover:text-red-300">清除</button>
            </div>
            <p class="text-xs text-gray-400 line-clamp-3">${result.content.substring(0, 200)}...</p>
          </div>
        `;
        urlPreview.classList.remove('hidden');
      }
    } else {
      showToast(result.error || '链接解析失败', 'error');
    }
  } catch (error) {
    showToast('链接解析失败: ' + error.message, 'error');
  }
}

function clearUrl() {
  state.refUrl = null;
  const urlInput = document.getElementById('refUrl');
  if (urlInput) urlInput.value = '';
  const urlPreview = document.getElementById('urlPreview');
  if (urlPreview) urlPreview.classList.add('hidden');
}

// 加载赞助者列表
async function loadSponsorsList() {
  const sponsorsListEl = document.getElementById('sponsorsList');
  if (!sponsorsListEl) return;
  
  try {
    const response = await fetch('data/sponsors.json');
    const data = await response.json();
    
    sponsorsListEl.innerHTML = data.sponsors.map(s => 
      `<span class="px-2 py-1 bg-accent/20 text-accent rounded">${s.name} ¥${s.amount}</span>`
    ).join('');
  } catch (error) {
    console.log('加载赞助者列表失败');
  }
}

// ============ 细分风格选择器 ============

function initSubStyleSelector() {
  const styleContainer = document.getElementById('styleSelector');
  if (!styleContainer) {
    console.log('风格选择器容器未找到');
    return;
  }
  
  // 初始化时显示当前默认风格的细分选择器
  if (state.style) {
    updateSubStyleSelector(state.style);
  }
}

// 更新细分风格选择器
function updateSubStyleSelector(mainStyle) {
  const subStyleContainer = document.getElementById('subStyleSelector');
  if (!subStyleContainer) return;
  
  const config = SUB_STYLE_CONFIG[mainStyle];
  if (!config) {
    subStyleContainer.innerHTML = '';
    return;
  }
  
  // 根据场景关键词自动推荐细分风格
  const recommendedKey = recommendSubStyle(mainStyle, state.scene, state.topic || '');
  
  let html = `
    <label class="block text-sm font-medium mb-3 mt-6">
      细分风格
      <span class="text-gray-500 text-xs ml-2">根据场景自动推荐</span>
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
  `;
  
  for (const [key, subStyle] of Object.entries(config.subStyles)) {
    const isRecommended = key === recommendedKey;
    html += `
      <button onclick="selectSubStyle('${key}')" 
              class="option-card ${isRecommended || (!state.subStyle && isRecommended) ? 'selected' : ''} rounded-xl p-3 cursor-pointer text-left"
              data-substyle="${key}">
        <div class="flex items-center justify-between">
          <span class="font-medium text-sm">${subStyle.name}</span>
          ${isRecommended ? '<span class="text-xs text-accent">推荐</span>' : ''}
        </div>
      </button>
    `;
  }
  
  html += '</div>';
  subStyleContainer.innerHTML = html;
  
  // 自动选择推荐风格
  if (recommendedKey && !state.subStyle) {
    state.subStyle = recommendedKey;
  }
}

// 推荐细分风格
function recommendSubStyle(mainStyle, scene, topic) {
  const config = SUB_STYLE_CONFIG[mainStyle];
  if (!config || !config.subStyles) return null;
  
  const combinedText = `${scene} ${topic}`.toLowerCase();
  
  for (const [key, subStyle] of Object.entries(config.subStyles)) {
    if (subStyle.keywords && subStyle.keywords.length > 0) {
      const hasKeyword = subStyle.keywords.some(kw => combinedText.includes(kw.toLowerCase()));
      if (hasKeyword) return key;
    }
  }
  
  // 返回最后一个作为默认
  const keys = Object.keys(config.subStyles);
  return keys[keys.length - 1];
}

// 选择细分风格
function selectSubStyle(subStyle) {
  state.subStyle = subStyle;
  
  // 更新UI
  const buttons = document.querySelectorAll('[data-substyle]');
  buttons.forEach(btn => {
    if (btn.dataset.substyle === subStyle) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// ============ 参考图上传 ============

function initRefImageUploader() {
  const refImagesInput = document.getElementById('refImages');
  if (!refImagesInput) return;
  
  refImagesInput.addEventListener('change', handleRefImageUpload);
}

// 把图片文件转成 Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ 进度轮询 ============
let progressInterval = null;

// 开始轮询进度
function startProgressPolling(taskId, card) {
  // 清除之前的轮询
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  // 每2秒查询一次进度
  progressInterval = setInterval(async () => {
    try {
      const response = await fetch(PROGRESS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', taskId })
      });
      
      const result = await response.json();
      
      if (result.success && result.progress) {
        const progress = result.progress;
        
        // 更新进度显示
        updateProgressDisplay(progress, card);
        
        // 如果完成或失败，停止轮询
        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(progressInterval);
          progressInterval = null;
        }
      }
    } catch (error) {
      console.warn('进度查询失败:', error);
    }
  }, 2000);
}

// 更新进度显示
function updateProgressDisplay(progress, card) {
  const percent = progress.progress || 0;
  const message = progress.message || '处理中...';
  const currentPage = progress.currentPage || 0;
  const totalPages = progress.totalPages || 0;
  
  card.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">${message}</p>
      <div class="mt-4 w-64 mx-auto">
        <div class="bg-surface rounded-full h-2 overflow-hidden">
          <div class="bg-accent h-full transition-all duration-300" style="width: ${percent}%"></div>
        </div>
        <p class="text-xs text-gray-500 mt-2">${percent}% ${totalPages > 0 ? `· 第${currentPage}/${totalPages}页` : ''}</p>
      </div>
    </div>
  `;
}

// 停止轮询
function stopProgressPolling() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// 处理参考图上传
async function handleRefImageUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  state.refImageFiles = Array.from(files);
  state.refImageDescriptions = new Array(files.length).fill('');
  state.refImages = []; // 清空之前的
  
  // 显示预览并存储 Base64
  const previewContainer = document.getElementById('refImagePreview');
  if (!previewContainer) return;
  
  previewContainer.innerHTML = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base64 = await fileToBase64(file);
    
    // 存储 Base64
    state.refImages.push(base64);
    
    // 显示预览
    const div = document.createElement('div');
    div.className = 'mr-3 mb-3';
    div.innerHTML = `
      <div class="relative">
        <img src="${base64}" class="w-24 h-24 object-cover rounded-lg border border-border">
        <button onclick="removeRefImage(${i})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <input type="text" 
             placeholder="图片描述（如：公司Logo）" 
             class="mt-1 w-24 text-xs bg-surface border border-border rounded px-2 py-1"
             onchange="updateRefImageDescription(${i}, this.value)">
    `;
    previewContainer.appendChild(div);
  }
  
  // 显示参考图模式选择
  showRefImageModeSelector();
}

// 更新参考图描述
function updateRefImageDescription(index, description) {
  state.refImageDescriptions[index] = description;
}

// 显示参考图模式选择器
function showRefImageModeSelector() {
  const modeContainer = document.getElementById('refImageModeSelector');
  if (!modeContainer) return;
  
  let html = `
    <label class="block text-sm font-medium mb-3 mt-4">
      参考图使用方式
    </label>
    <div class="grid grid-cols-2 gap-3">
  `;
  
  for (const [key, mode] of Object.entries(REF_IMAGE_MODES)) {
    const isSelected = key === state.refImageMode;
    html += `
      <button onclick="selectRefImageMode('${key}')" 
              class="option-card ${isSelected ? 'selected' : ''} rounded-xl p-3 cursor-pointer text-left"
              data-refmode="${key}">
        <div class="font-medium text-sm">${mode.name}</div>
        <div class="text-xs text-gray-500">${mode.desc}</div>
      </button>
    `;
  }
  
  html += '</div>';
  modeContainer.innerHTML = html;
}

// 选择参考图模式
function selectRefImageMode(mode) {
  state.refImageMode = mode;
  
  const buttons = document.querySelectorAll('[data-refmode]');
  buttons.forEach(btn => {
    if (btn.dataset.refmode === mode) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// 移除参考图
function removeRefImage(index) {
  state.refImageFiles.splice(index, 1);
  
  // 重新触发预览更新
  const previewContainer = document.getElementById('refImagePreview');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    state.refImageFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const div = document.createElement('div');
        div.className = 'relative inline-block mr-2 mb-2';
        div.innerHTML = `
          <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border border-border">
          <button onclick="removeRefImage(${i})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
            <i class="fas fa-times"></i>
          </button>
        `;
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }
  
  // 如果没有参考图了，隐藏模式选择器
  if (state.refImageFiles.length === 0) {
    const modeContainer = document.getElementById('refImageModeSelector');
    if (modeContainer) modeContainer.innerHTML = '';
  }
}

// ============ 步骤1：基本信息 ============

function selectMode(mode) {
  state.createMode = mode;
  updateOptionCards('mode', mode);
  
  // 如果是修改模式，显示文件上传
  const modifyUpload = document.getElementById('modifyUpload');
  if (modifyUpload) {
    if (mode === 'modify') {
      modifyUpload.classList.remove('hidden');
    } else {
      modifyUpload.classList.add('hidden');
    }
  }
  
  // 如果是模板复刻模式，显示模板上传
  const templateUpload = document.getElementById('templateUpload');
  if (templateUpload) {
    if (mode === 'template') {
      templateUpload.classList.remove('hidden');
      // 如果还没有选择模板，自动选中第一个
      if (!state.templateId) {
        const firstTemplate = Object.keys(TEMPLATE_INFO)[0];
        if (firstTemplate) {
          setTimeout(() => {
            selectTemplateCard(firstTemplate);
          }, 50);
        }
      } else {
        // 显示已选模板
        showSelectedTemplate(state.templateId);
      }
    } else {
      templateUpload.classList.add('hidden');
    }
  }
}

function selectPlatform(platform) {
  state.platform = platform;
  updateOptionCards('platform', platform);
  
  const titleTip = document.getElementById('titleTip');
  if (titleTip) {
    if (platform === 'xiaohongshu') {
      titleTip.classList.remove('hidden');
    } else {
      titleTip.classList.add('hidden');
    }
  }
}

function selectContentSource(source) {
  state.contentSource = source;
  updateOptionCards('source', source);
  
  const materialUpload = document.getElementById('materialUpload');
  if (materialUpload) {
    if (source === 'material') {
      materialUpload.classList.remove('hidden');
    } else {
      materialUpload.classList.add('hidden');
    }
  }
}

function selectDensity(density) {
  state.contentDensity = density;
  updateOptionCards('density', density);
}

function selectContentMode(mode) {
  state.contentMode = mode;
  updateOptionCards('contentMode', mode);
  
  const outlinePreview = document.getElementById('outlinePreview');
  if (outlinePreview) {
    if (mode === 'ai') {
      outlinePreview.classList.remove('hidden');
    } else {
      outlinePreview.classList.add('hidden');
      state.outline = null;
    }
  }
}

function selectAudience(audience) {
  state.audience = audience;
  updateOptionCards('audience', audience);
  
  // 自动推荐风格
  const styleMap = { child: 'D', student: 'B', adult: 'A', professional: 'A' };
  const recommendedStyle = styleMap[audience];
  
  if (recommendedStyle && recommendedStyle !== state.style) {
    selectStyle(recommendedStyle);
    showToast(`已自动推荐「${SUB_STYLE_CONFIG[recommendedStyle].name}」风格`, 'info');
  }
}

function selectScene(scene) {
  state.scene = scene;
  updateOptionCards('scene', scene);
  
  // 更新细分风格推荐
  if (state.style) {
    updateSubStyleSelector(state.style);
  }
}

// ============ 步骤2：内容风格 ============

function selectStyle(style) {
  state.style = style;
  updateOptionCards('style', style);
  updateSubStyleSelector(style);
}

// ============ 通用函数 ============

function updateOptionCards(type, selected) {
  const attrMap = {
    mode: 'data-mode',
    platform: 'data-platform',
    source: 'data-source',
    density: 'data-density',
    audience: 'data-audience',
    scene: 'data-scene',
    style: 'data-style',
    contentMode: 'data-contentmode'
  };
  
  const attr = attrMap[type];
  if (!attr) return;
  
  const cards = document.querySelectorAll(`[${attr}]`);
  cards.forEach(card => {
    if (card.getAttribute(attr) === selected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function changePages(delta) {
  const input = document.getElementById('pages');
  if (!input) return;
  
  let value = parseInt(input.value) + delta;
  value = Math.max(5, Math.min(20, value));
  input.value = value;
  state.pageCount = value;
  updateCostEstimate();
}

function updateCostEstimate() {
  // 更新费用预估（如果有的话）
}

// ============ 步骤导航 ============

// 生成大纲
async function generateOutline() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) {
    showToast('请输入PPT主题', 'error');
    return;
  }
  
  state.topic = topic;
  
  const outlineList = document.getElementById('outlineList');
  if (!outlineList) return;
  
  // 显示loading
  outlineList.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent mb-3"></div>
      <p class="text-sm text-gray-400">AI正在生成大纲...</p>
    </div>
  `;
  
  try {
    const response = await fetch('https://ig8u65l6vm.sealosbja.site/generate-outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic,
        pageCount: state.pageCount,
        refDocument: state.refDocument, // 参考文档内容
        refUrl: state.refUrl ? state.refUrl.content : null, // 参考链接内容
        scene: state.scene // 使用场景
      })
    });
    
    const result = await response.json();
    
    if (result.ok && result.outline) {
      state.outline = result.outline;
      displayOutline(result.outline, outlineList);
      
      // 显示副标题输入框
      const subtitleInput = document.getElementById('subtitleInput');
      if (subtitleInput) subtitleInput.classList.remove('hidden');
      
      showToast('大纲生成成功', 'success');
    } else {
      throw new Error(result.message || '大纲生成失败');
    }
  } catch (error) {
    console.error('大纲生成失败:', error);
    outlineList.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-2xl text-red-400 mb-2"></i>
        <p class="text-sm text-red-400">${error.message}</p>
        <button onclick="generateOutline()" class="mt-3 text-sm text-accent">重试</button>
      </div>
    `;
  }
}

// 显示大纲
function displayOutline(outline, container) {
  let html = `
    <div class="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
      <div class="flex items-center">
        <i class="fas fa-lightbulb text-accent mr-2"></i>
        <span class="font-medium text-sm">${outline.title}</span>
      </div>
    </div>
    <div class="space-y-2">
  `;
  
  outline.outline.forEach((section, idx) => {
    html += `
      <div class="p-3 bg-surface rounded-lg border border-border">
        <div class="flex items-center mb-2">
          <span class="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium mr-2">${idx + 1}</span>
          <span class="font-medium text-sm">${section.section}</span>
        </div>
        <ul class="text-xs text-gray-400 space-y-1 ml-7">
          ${section.points.map(p => `<li>• ${p}</li>`).join('')}
        </ul>
      </div>
    `;
  });
  
  if (outline.ending) {
    html += `
      <div class="p-3 bg-surface rounded-lg border border-border">
        <div class="flex items-center">
          <span class="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs mr-2"><i class="fas fa-flag text-xs"></i></span>
          <span class="text-xs text-gray-400">${outline.ending}</span>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// 确认大纲并进入下一步
function confirmOutline() {
  if (!state.outline) {
    showToast('请先生成大纲', 'warning');
    return;
  }
  
  // 保存副标题到大纲
  const subtitleInput = document.getElementById('subtitle');
  if (subtitleInput && subtitleInput.value.trim()) {
    state.outline.subtitle = subtitleInput.value.trim();
  }
  
  state.currentStep = 2;
  updateStepIndicator();
  
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  
  // 初始化细分风格选择器
  updateSubStyleSelector(state.style);
}

async function goToStep2() {
  // 自定义内容模式：不需要大纲，直接进入下一步
  if (state.contentMode === 'custom') {
    state.currentStep = 2;
    updateStepIndicator();
    
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    // 初始化细分风格选择器
    updateSubStyleSelector(state.style);
    return;
  }
  
  // AI自由发挥模式：需要先生成大纲
  if (!state.outline) {
    showToast('请先点击「生成大纲」按钮', 'warning');
    return;
  }
  
  state.currentStep = 2;
  updateStepIndicator();
  
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  
  // 初始化细分风格选择器
  updateSubStyleSelector(state.style);
}

function goToStep1() {
  state.currentStep = 1;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

function updateStepIndicator() {
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`step${i}-dot`);
    const text = document.getElementById(`step${i}-text`);
    
    if (i < state.currentStep) {
      dot.className = 'step-dot completed';
      text.className = 'ml-3 text-sm font-medium text-green-400';
    } else if (i === state.currentStep) {
      dot.className = 'step-dot active';
      text.className = 'ml-3 text-sm font-medium text-white';
    } else {
      dot.className = 'step-dot inactive';
      text.className = 'ml-3 text-sm font-medium text-gray-500';
    }
  }
}

// ============ PPT生成 ============

async function generatePPT() {
  showSponsorModal();
}

function showSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.add('hidden');
  
  startGeneration();
}

// 实际生成PPT
async function startGeneration() {
  const resultModal = document.getElementById('resultModal');
  const card = resultModal?.querySelector('.card');
  
  if (!card) {
    showToast('页面元素错误', 'error');
    return;
  }
  
  // 获取主题输入（关键修复！）
  const topicInput = document.getElementById('topic');
  const topic = topicInput ? topicInput.value.trim() : '';
  
  if (!topic) {
    showToast('请输入PPT主题', 'error');
    resultModal.classList.add('hidden');
    return;
  }
  
  state.topic = topic;
  console.log('获取到的主题:', state.topic);
  
  // 收集页面结构选项
  const hasCoverEl = document.getElementById('hasCover');
  const hasCatalogEl = document.getElementById('hasCatalog');
  const hasContentEl = document.getElementById('hasContent');
  const hasEndingEl = document.getElementById('hasEnding');
  const addToGalleryEl = document.getElementById('addToGallery');
  
  state.hasCover = hasCoverEl ? hasCoverEl.checked : true;
  state.hasCatalog = hasCatalogEl ? hasCatalogEl.checked : false;
  state.hasContent = hasContentEl ? hasContentEl.checked : true;
  state.hasEnding = hasEndingEl ? hasEndingEl.checked : true;
  state.addToGallery = addToGalleryEl ? addToGalleryEl.checked : false;
  
  // 生成任务ID
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 显示loading
  card.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">正在初始化...</p>
      <div class="mt-4 w-64 mx-auto">
        <div class="bg-surface rounded-full h-2 overflow-hidden">
          <div class="bg-accent h-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <p class="text-xs text-gray-500 mt-2">0%</p>
      </div>
    </div>
  `;
  
  resultModal.classList.remove('hidden');
  
  try {
    // 如果没有大纲，自动生成
    if (!state.outline || !state.outline.outline || state.outline.outline.length === 0) {
      // 更新loading提示
      card.innerHTML = `
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p class="text-gray-400">正在生成内容大纲...</p>
        </div>
      `;
      
      try {
        const outlineResponse = await fetch('https://ig8u65l6vm.sealosbja.site/generate-outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: state.topic,
            pageCount: state.pageCount,
            refDocument: state.refDocument,
            refUrl: state.refUrl ? state.refUrl.content : null,
            scene: state.scene
          })
        });
        
        const outlineResult = await outlineResponse.json();
        
        if (outlineResult.ok && outlineResult.outline) {
          state.outline = outlineResult.outline;
          console.log('自动生成大纲成功:', outlineResult.outline.title);
          console.log('大纲内容:', JSON.stringify(outlineResult.outline, null, 2));
        }
      } catch (outlineError) {
        console.warn('大纲生成失败，使用默认结构:', outlineError);
        // 继续执行，使用默认结构
      }
      
      // 恢复loading状态
      card.innerHTML = `
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p class="text-gray-400">正在生成PPT...</p>
          <div class="mt-4 w-64 mx-auto">
            <div class="bg-surface rounded-full h-2 overflow-hidden">
              <div class="bg-accent h-full transition-all duration-300" style="width: 0%"></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">0%</p>
          </div>
        </div>
      `;
    }
    
    // 构建请求数据（V9.1完善所有参数传递）
    const requestData = {
      taskId: taskId,
      
      // 创建模式（V9.1新增）
      createMode: state.createMode,
      templateId: state.templateId,
      
      // 风格参数（V9.1新增subStyle传递）
      style: state.style,
      subStyle: state.subStyle,
      
      // 基本参数
      topic: state.topic,
      platform: state.platform,
      scene: state.scene,
      pageCount: state.pageCount,
      contentDensity: state.contentDensity,
      audience: state.audience,  // V9.1新增
      
      // 页面结构选项
      hasCover: state.hasCover,
      hasCatalog: state.hasCatalog,
      hasContent: state.hasContent,
      hasEnding: state.hasEnding,
      
      // 大纲
      outline: state.outline,
      subtitle: state.outline?.subtitle || '',
      
      // 参考素材（V9.1完善）
      refDocument: state.refDocument,
      refUrlContent: state.refUrl ? state.refUrl.content : null,
      refImageMode: state.refImageMode,  // V9.1新增
      refImageDescriptions: state.refImageDescriptions
    };
    
    // 直接使用 Base64 图片（不需要上传到云存储）
    if (state.refImages && state.refImages.length > 0) {
      requestData.refImages = state.refImages;
      console.log('参考图(Base64):', state.refImages.length, '张, 模式:', state.refImageMode);
    } else {
      requestData.refImages = [];
    }
    
    // 调试：确认大纲是否传递
    console.log('=== 发送到后端的数据 ===');
    console.log('创建模式:', state.createMode, '| 模板ID:', state.templateId);
    console.log('细分风格:', state.subStyle, '| 受众:', state.audience);
    console.log('主题:', state.topic);
    console.log('大纲存在:', !!state.outline);
    console.log('参考素材:', {
      document: !!state.refDocument,
      url: !!state.refUrl,
      images: state.refImages?.length || 0,
      mode: state.refImageMode
    });
    
    // 启动进度轮询
    startProgressPolling(taskId, card);
    
    // 发送生成请求（异步，不等待完成）
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    // 停止进度轮询
    stopProgressPolling();
    
    if (result.code === 0 || result.success) {
      displayResult(result.data || result, card);
    } else {
      throw new Error(result.message || result.error || '生成失败');
    }
  } catch (error) {
    stopProgressPolling();
    card.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
        <p class="text-red-400">${error.message}</p>
        <button onclick="closeResultModal()" class="mt-4 btn-secondary px-6 py-2 rounded-lg">关闭</button>
      </div>
    `;
  }
}

function displayResult(result, card) {
  // 调试：打印完整返回结果
  console.log('=== displayResult 收到的数据 ===');
  console.log('result keys:', Object.keys(result));
  console.log('pptx:', result.pptx ? 'exists' : 'null');
  if (result.pptx) {
    console.log('pptx.filename:', result.pptx.filename);
    console.log('pptx.data length:', result.pptx.data ? result.pptx.data.length : 0);
  }
  
  state.generatedImages = result.images || [];
  
  // 保存PPT内容用于演讲稿生成（V9新增）
  if (result.pptContent) {
    state.pptContent = result.pptContent;
    console.log('[演讲稿] 已保存PPT内容:', state.pptContent);
  }
  
  const styleName = SUB_STYLE_CONFIG[result.style]?.name || result.style;
  const subStyleName = result.subStyle && SUB_STYLE_CONFIG[result.style]?.subStyles[result.subStyle]?.name;
  const pageCount = result.images?.length || result.pages?.length || 0;
  
  // 检查是否有PPTX数据
  const hasPptx = result.pptx && result.pptx.data;
  console.log('hasPptx:', hasPptx);
  
  let html = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h3 class="text-xl font-bold mb-2">${result.topic || 'PPT生成完成'}</h3>
      <p class="text-gray-400">${styleName}${subStyleName ? ' · ' + subStyleName : ''} · ${pageCount}页</p>
    </div>
    
    <div class="mb-6 p-4 bg-surface rounded-xl max-h-60 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm text-gray-400"><i class="fas fa-eye mr-2"></i>背景图预览：</p>
        <p class="text-xs text-accent">文字内容请下载PPT查看</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
  `;
  
  // 显示生成的图片预览
  if (result.images && result.images.length > 0) {
    result.images.forEach(img => {
      if (img.url) {
        html += `
          <div class="aspect-video bg-surface rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition" onclick="window.open('${img.url}', '_blank')">
            <img src="${img.url}" alt="第${img.page}页" class="w-full h-full object-cover">
          </div>
        `;
      }
    });
  }
  
  html += `
      </div>
    </div>
    
    <div class="space-y-3">
  `;
  
  // PPTX下载按钮（突出显示）
  if (hasPptx) {
    html += `
      <div class="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-3">
        <p class="text-sm text-center mb-3 text-accent">✨ PPT已生成完成，包含完整文字内容</p>
        <button onclick="downloadPptx('${result.pptx.filename}', '${result.pptx.data}')" class="w-full btn-primary text-white py-3 rounded-xl font-medium flex items-center justify-center">
          <i class="fas fa-download mr-2"></i>
          下载PPT文件 (${result.pptx.filename})
        </button>
      </div>
    `;
  } else {
    // 没有pptx时显示提示
    html += `
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-3">
        <p class="text-sm text-center text-yellow-400">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          PPT文件生成失败，请查看控制台或重试
        </p>
      </div>
    `;
  }
  
  // 图片预览按钮
  html += `
    <button onclick="previewImages()" class="w-full btn-secondary py-3 rounded-xl font-medium flex items-center justify-center mb-3">
      <i class="fas fa-images mr-2"></i>
      预览所有图片
    </button>
    
    <button onclick="generateSpeechScript()" class="w-full btn-secondary py-3 rounded-xl font-medium flex items-center justify-center">
      <i class="fas fa-microphone mr-2"></i>
      生成口播稿
    </button>
  `;
  
  html += `
      <button onclick="closeResultModal()" class="w-full text-gray-400 py-3 rounded-xl font-medium hover:text-white transition">
        继续生成
      </button>
    </div>
  `;
  
  card.innerHTML = html;
}

// 下载PPTX文件
function downloadPptx(filename, base64Data) {
  try {
    // 将base64转换为Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('PPT文件下载成功！', 'success');
  } catch (error) {
    console.error('下载失败:', error);
    showToast('下载失败: ' + error.message, 'error');
  }
}

// 预览所有图片
function previewImages() {
  if (!state.generatedImages || state.generatedImages.length === 0) {
    showToast('没有可预览的图片', 'error');
    return;
  }
  
  // 在新窗口打开第一张图片
  const firstImg = state.generatedImages.find(img => img.url);
  if (firstImg) {
    window.open(firstImg.url, '_blank');
  }
}

// 生成口播稿
async function generateSpeechScript() {
  if (!state.currentOutline || !state.currentOutline.pages) {
    showToast('请先生成PPT', 'error');
    return;
  }
  
  showToast('正在生成口播稿...', 'info');
  
  try {
    const response = await fetch(SPEECH_SCRIPT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: state.topic || '演示文稿',
        outline: state.currentOutline,
        scene: state.scene || 'other',
        audience: state.audience || 'adult'
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.script) {
      // 显示口播稿
      showSpeechScriptModal(result.script, result.title);
    } else {
      throw new Error(result.message || '生成失败');
    }
  } catch (error) {
    console.error('口播稿生成失败:', error);
    showToast('口播稿生成失败: ' + error.message, 'error');
  }
}

// 显示口播稿弹窗
function showSpeechScriptModal(script, title) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-card rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold">${title} - 口播稿</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <div class="prose prose-invert max-w-none">
        <pre class="whitespace-pre-wrap text-gray-300 leading-relaxed bg-surface p-4 rounded-xl">${script}</pre>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="copySpeechScript()" class="flex-1 btn-primary py-3 rounded-xl font-medium">
          <i class="fas fa-copy mr-2"></i>复制全文
        </button>
        <button onclick="downloadSpeechScript('${title}')" class="flex-1 btn-secondary py-3 rounded-xl font-medium">
          <i class="fas fa-download mr-2"></i>下载文档
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // 保存到window以便复制
  window.currentSpeechScript = script;
}

// 复制口播稿
function copySpeechScript() {
  if (window.currentSpeechScript) {
    navigator.clipboard.writeText(window.currentSpeechScript);
    showToast('已复制到剪贴板', 'success');
  }
}

// 下载口播稿
function downloadSpeechScript(title) {
  if (!window.currentSpeechScript) return;
  
  const blob = new Blob([window.currentSpeechScript], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_口播稿.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('口播稿下载成功', 'success');
}

function closeResultModal() {
  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.add('hidden');
}

// Toast提示
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
  } text-white text-sm`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle mr-2"></i>${message}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 生成演讲稿（差异化功能）
 */
async function generateSpeechScript() {
  // 检查是否有PPT内容
  if (!state.pptContent) {
    showToast('PPT内容未保存，请重新生成PPT', 'error');
    return;
  }
  
  // 显示进度
  const progressEl = document.getElementById('scriptProgress');
  const resultEl = document.getElementById('scriptResult');
  const btnEl = document.getElementById('generateScriptBtn');
  
  if (progressEl) progressEl.classList.remove('hidden');
  if (btnEl) btnEl.disabled = true;
  if (btnEl) btnEl.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...';
  
  try {
    console.log('[演讲稿] 开始生成...');
    
    const response = await fetch(SPEECH_SCRIPT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pptContent: state.pptContent,
        style: 'storytelling'
      })
    });
    
    const result = await response.json();
    console.log('[演讲稿] 生成结果:', result);
    
    if (result.success) {
      // 隐藏进度，显示结果
      if (progressEl) progressEl.classList.add('hidden');
      if (resultEl) resultEl.classList.remove('hidden');
      if (btnEl) btnEl.innerHTML = '<i class="fas fa-check mr-2"></i>已生成';
      
      // 设置下载链接
      const downloadBtn = document.getElementById('downloadScript');
      if (downloadBtn && result.wordHtml) {
        // 创建Blob并设置下载链接
        const blob = new Blob([result.wordHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = `${result.title}.doc`;
        
        showToast(`演讲稿生成成功，共${result.wordCount}字`, 'success');
      }
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    console.error('[演讲稿] 生成错误:', error);
    if (progressEl) progressEl.classList.add('hidden');
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = '<i class="fas fa-file-word mr-2"></i>生成演讲稿';
    }
    showToast('演讲稿生成失败: ' + error.message, 'error');
  }
}
