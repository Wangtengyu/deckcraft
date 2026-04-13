/**
 * DeckCraft - 前端交互逻辑
 */

// API配置
const API_URL = 'https://ig8u65l6vm.sealosbja.site/generate';
const OUTLINE_API_URL = 'https://ig8u65l6vm.sealosbja.site/generate-outline';

// 状态管理
let state = {
  currentStep: 1,
  createMode: 'scratch',
  platform: 'ppt',
  contentSource: 'topic',
  contentDensity: 'medium',
  audience: 'adult',
  scene: 'report',
  style: null,
  pageCount: 10,
  pageStructure: '',
  smartTitle: true,
  refImages: [],
  userContent: '',
  apiKey: '',
  usePlatformApi: true,  // 默认使用平台API（免费），自愿赞助
  contentMode: 'custom',  // 内容模式：custom(自定义) / ai(AI自由发挥)
  outline: null  // AI生成的大纲
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadSponsorsList();
});

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
    console.log('加载赞助者列表失败，使用默认数据');
  }
}

// ============ 步骤1：基本信息 ============

// 创建模式
function selectMode(mode) {
  state.createMode = mode;
  updateOptionCards('mode', mode);
}

// 目标平台
function selectPlatform(platform) {
  state.platform = platform;
  updateOptionCards('platform', platform);
  
  // 小红书提示标题优化
  const titleTip = document.getElementById('titleTip');
  if (platform === 'xiaohongshu' && titleTip) {
    titleTip.classList.remove('hidden');
  } else if (titleTip) {
    titleTip.classList.add('hidden');
  }
}

// 内容来源
function selectContentSource(source) {
  state.contentSource = source;
  updateOptionCards('source', source);
  
  // 显示/隐藏素材上传区域
  const materialUpload = document.getElementById('materialUpload');
  if (materialUpload) {
    if (source === 'material') {
      materialUpload.classList.remove('hidden');
    } else {
      materialUpload.classList.add('hidden');
    }
  }
}

// 内容密度
function selectDensity(density) {
  state.contentDensity = density;
  updateOptionCards('density', density);
}

// ============ 内容模式选择（自定义/AI自由发挥） ============

function selectContentMode(mode) {
  state.contentMode = mode;
  updateOptionCards('contentMode', mode);
  
  // 显示/隐藏AI生成区域
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

// AI生成大纲
async function generateOutline() {
  const topic = state.topic;
  if (!topic || topic.trim().length < 2) {
    showToast('请先输入PPT主题', 'error');
    return;
  }
  
  const outlineContainer = document.getElementById('outlineList');
  if (!outlineContainer) return;
  
  // 显示loading
  outlineContainer.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mb-3"></div>
      <p class="text-gray-400 text-sm">AI正在生成大纲，请稍候...</p>
    </div>
  `;
  
  try {
    const response = await fetch(OUTLINE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic,
        scene: state.scene,
        audience: state.audience,
        pageCount: state.pageCount,
        apiKey: state.apiKey
      })
    });
    
    const result = await response.json();
    
    if (result.ok && result.outline) {
      state.outline = result.outline;
      displayOutline(result.outline);
      showToast('大纲生成成功！', 'success');
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    outlineContainer.innerHTML = `
      <div class="text-center py-6">
        <i class="fas fa-exclamation-circle text-3xl text-red-400 mb-3"></i>
        <p class="text-red-400 text-sm mb-3">${error.message}</p>
        <button onclick="generateOutline()" class="text-accent text-sm hover:underline">
          <i class="fas fa-redo mr-1"></i>重新生成
        </button>
      </div>
    `;
    showToast('大纲生成失败：' + error.message, 'error');
  }
}

// 显示大纲预览
function displayOutline(outlineData) {
  const outlineContainer = document.getElementById('outlineList');
  if (!outlineContainer) return;
  
  let html = '';
  let pageNum = 1;
  
  // 封面页
  html += `
    <div class="bg-[#1a1a24] rounded-lg p-4 mb-3 border border-[#2a2a3a] hover:border-accent/30 transition">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <span class="text-gray-500 text-sm mr-2">${pageNum}.</span>
          <span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">封面</span>
        </div>
      </div>
      <h4 class="font-medium mb-1">${outlineData.title || 'PPT标题'}</h4>
    </div>
  `;
  pageNum++;
  
  // 内容页
  if (outlineData.outline && Array.isArray(outlineData.outline)) {
    outlineData.outline.forEach((section) => {
      html += `
        <div class="bg-[#1a1a24] rounded-lg p-4 mb-3 border border-[#2a2a3a] hover:border-accent/30 transition">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <span class="text-gray-500 text-sm mr-2">${pageNum}.</span>
              <span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">内容</span>
            </div>
          </div>
          <h4 class="font-medium mb-2">${section.section || ''}</h4>
          ${section.points && section.points.length > 0 ? `
            <ul class="text-sm text-gray-400 space-y-1">
              ${section.points.map(p => `<li class="flex items-start"><span class="mr-2">•</span>${p}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
      pageNum++;
    });
  }
  
  // 结尾页
  if (outlineData.ending) {
    html += `
      <div class="bg-[#1a1a24] rounded-lg p-4 mb-3 border border-[#2a2a3a] hover:border-accent/30 transition">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center">
            <span class="text-gray-500 text-sm mr-2">${pageNum}.</span>
            <span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">结尾</span>
          </div>
        </div>
        <h4 class="font-medium mb-1">${outlineData.ending}</h4>
      </div>
    `;
  }
  
  // 添加操作按钮
  html += `
    <div class="flex items-center justify-center space-x-4 mt-4">
      <button onclick="regenerateOutline()" class="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:border-accent transition">
        <i class="fas fa-redo mr-2"></i>重新生成
      </button>
      <button onclick="confirmOutline()" class="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 transition">
        <i class="fas fa-check mr-2"></i>确认大纲
      </button>
    </div>
  `;
  
  outlineContainer.innerHTML = html;
}

// 编辑大纲项
function editOutlineItem(index) {
  if (!state.outline || !state.outline[index]) return;
  
  const page = state.outline[index];
  const newTitle = prompt('修改页面标题：', page.title);
  if (newTitle && newTitle.trim()) {
    state.outline[index].title = newTitle.trim();
    
    // 询问是否修改要点
    if (page.points && page.points.length > 0) {
      const pointsStr = prompt('修改页面要点（每行一条）：', page.points.join('\n'));
      if (pointsStr) {
        state.outline[index].points = pointsStr.split('\n').filter(p => p.trim());
      }
    }
    
    displayOutline(state.outline);
    showToast('大纲已更新', 'success');
  }
}

// 重新生成大纲
function regenerateOutline() {
  state.outline = null;
  generateOutline();
}

// 确认大纲
function confirmOutline() {
  if (!state.outline) {
    showToast('请先生成大纲', 'error');
    return;
  }
  
  // 将大纲转换为pageStructure格式
  state.pageStructure = JSON.stringify(state.outline);
  
  showToast('大纲已确认，可进入下一步', 'success');
  
  // 自动进入步骤2
  goToStep2();
}

// 受众选择
function selectAudience(audience) {
  state.audience = audience;
  updateOptionCards('audience', audience);
  
  // 自动推荐风格
  const styleMap = { child: 'D', student: 'B', adult: 'A', professional: 'A' };
  const recommendedStyle = styleMap[audience];
  const styleNames = { A: '信息图风', B: '插画科普风', C: '图文混排风', D: '卡通绘本风', E: '手绘笔记风' };
  
  const recommendedElement = document.getElementById('recommendedStyle');
  if (recommendedElement) {
    recommendedElement.textContent = `${styleNames[recommendedStyle]}（适合${audience === 'child' ? '幼儿' : audience === 'student' ? '小学生' : audience === 'adult' ? '成人' : '专业人士'}受众）`;
  }
}

// 场景选择
function selectScene(scene) {
  state.scene = scene;
  updateOptionCards('scene', scene);
}

// ============ 步骤2：内容风格 ============

// 风格选择
function selectStyle(style) {
  state.style = style;
  updateOptionCards('style', style);
}

// 页数更新
function updatePageCount(count) {
  state.pageCount = count;
  updateCostEstimate();
}

// 智能标题开关
function toggleSmartTitle(enabled) {
  state.smartTitle = enabled;
}

// ============ 步骤导航 ============

function goToStep2() {
  // 验证必填项
  const topic = document.getElementById('topic').value.trim();
  if (!topic) {
    showToast('请输入PPT主题', 'error');
    return;
  }
  
  state.topic = topic;
  
  // 切换到步骤2
  state.currentStep = 2;
  updateStepIndicator();
  
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
}

function goToStep3() {
  state.currentStep = 3;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  
  // 开始生成
  generatePPT();
}

function goBack() {
  if (state.currentStep === 2) {
    state.currentStep = 1;
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
  } else if (state.currentStep === 3) {
    state.currentStep = 2;
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
  }
  updateStepIndicator();
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
  // 显示赞助弹窗
  showSponsorModal();
}

// 显示赞助弹窗
function showSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// 关闭赞助弹窗并继续生成
function closeSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) {
    modal.classList.add('hidden');
  }
  
  // 开始实际生成
  startGeneration();
}

// 实际生成PPT
async function startGeneration() {
  // 显示resultModal并设置loading状态
  const resultModal = document.getElementById('resultModal');
  const card = resultModal.querySelector('.card');
  
  if (!card) {
    showToast('页面元素错误', 'error');
    return;
  }
  
  // 显示loading
  card.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">正在生成PPT，请稍候...</p>
    </div>
  `;
  
  resultModal.classList.remove('hidden');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayResult(result, card);
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
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
  // 保存生成的图片到state
  state.generatedImages = result.images || [];
  
  let html = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h3 class="text-xl font-bold mb-2">${result.ppt_title}</h3>
      <p class="text-gray-400">${result.style} · ${result.platform} · ${(result.images || result.pages || []).length}页</p>
    </div>
    
    <!-- 预览区域 -->
    <div class="mb-6 p-4 bg-surface rounded-xl">
      <p class="text-sm text-gray-400 mb-3"><i class="fas fa-eye mr-2"></i>预览生成的页面：</p>
      <div class="grid grid-cols-2 gap-2">
  `;
  
  // 显示生成的图片
  if (result.images && result.images.length > 0) {
    result.images.forEach((img, i) => {
      if (img.url) {
        html += `
          <div class="aspect-video bg-surface rounded-lg overflow-hidden">
            <img src="${img.url}" alt="第${img.page_id}页" class="w-full h-full object-cover">
          </div>
        `;
      }
    });
  } else if (result.pages) {
    // 预览模式，显示占位符
    result.pages.forEach((page, i) => {
      html += `
        <div class="aspect-video bg-surface rounded-lg flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-file-powerpoint text-2xl text-gray-500 mb-2"></i>
            <p class="text-xs text-gray-500">${page.page_type === 'cover' ? '封面' : page.page_type === 'ending' ? '结尾' : '第' + page.page_id + '页'}</p>
          </div>
        </div>
      `;
    });
  } else {
    // 无数据，显示提示
    html += `
      <div class="col-span-2 md:col-span-3 text-center py-8">
        <i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-2"></i>
        <p class="text-gray-400">生成成功，但图片加载失败</p>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
    
    <!-- 下载选项 -->
    <div class="space-y-3 mb-4">
      <p class="text-sm text-gray-400">选择下载格式：</p>
  `;
  
  // 下载按钮
  if (result.images && result.images.length > 0) {
    html += `
      <button onclick="downloadImages()" class="btn-primary text-white py-3 rounded-xl font-medium w-full">
        <i class="fas fa-images mr-2"></i>
        下载所有图片
      </button>
      <button onclick="showPptxDownload()" class="btn-secondary py-3 rounded-xl font-medium w-full">
        <i class="fas fa-file-powerpoint mr-2"></i>
        下载PPTX文件
      </button>
      <hr class="border-white/10 my-4">
      <button onclick="confirmAddToGallery('${result.ppt_title}')" class="text-gray-400 py-2 w-full hover:text-white transition">
        <i class="fas fa-plus mr-2"></i>
        加入案例库
      </button>
    `;
  } else {
    html += `
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
        <p class="text-yellow-400 text-sm">
          <i class="fas fa-info-circle mr-2"></i>
          图片生成中，请稍候...
        </p>
      </div>
    `;
  }
  
  html += `
      <button onclick="closeResultModal()" class="text-gray-400 py-2 w-full hover:text-white transition">
        创建新PPT
      </button>
    </div>
  `;
  
  card.innerHTML = html;
}

// ============ 工具函数 ============

function updateOptionCards(group, selectedValue) {
  const containers = {
    mode: '[data-mode]',
    platform: '[data-platform]',
    source: '[data-source]',
    density: '[data-density]',
    audience: '[data-audience]',
    scene: '[data-scene]',
    style: '[data-style]',
    contentMode: '[data-content-mode]'
  };
  
  const selector = containers[group];
  if (!selector) return;
  
  document.querySelectorAll(selector).forEach(card => {
    const value = card.getAttribute(`data-${group === 'mode' ? 'mode' : group === 'contentMode' ? 'content-mode' : group}`);
    if (value === selectedValue) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all ${
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function downloadPPT() {
  showToast('PPT下载功能开发中...', 'info');
}

function addToGallery() {
  showToast('已加入案例库', 'success');
}

// 下载所有图片
async function downloadImages(images) {
  // 如果传入了images参数，使用传入的；否则使用state中的
  const imgList = images || state.generatedImages || [];
  
  if (imgList.length === 0) {
    showToast('没有可下载的图片', 'error');
    return;
  }
  
  showToast('正在打开图片...', 'info');
  
  // 逐个打开图片
  for (let i = 0; i < imgList.length; i++) {
    const img = imgList[i];
    if (img.url) {
      window.open(img.url, '_blank');
    }
  }
  
  showToast(`已打开${imgList.length}张图片，请右键保存`, 'success');
}

// PPTX下载
async function showPptxDownload() {
  // 从state中获取当前生成的图片
  if (!state.generatedImages || state.generatedImages.length === 0) {
    showToast('没有可下载的图片', 'error');
    return;
  }
  
  showToast('正在生成PPTX文件...', 'info');
  
  try {
    const response = await fetch('https://ig8u65l6vm.sealosbja.site/generate-pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: state.generatedImages,
        title: state.topic,
        style: state.style
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      link.click();
      
      showToast('PPTX文件已开始下载', 'success');
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    showToast('PPTX生成失败：' + error.message, 'error');
  }
}

// 确认加入案例库
function confirmAddToGallery(title) {
  if (confirm(`确认将「${title}」加入案例库？\n\n加入后，其他用户可以参考您生成的PPT效果。`)) {
    showToast('已加入案例库，感谢您的贡献！', 'success');
  }
}

// ============ 案例库功能 ============

function openGallery(caseId) {
  const modal = document.getElementById('galleryModal');
  modal.classList.remove('hidden');
}

function closeGallery() {
  const modal = document.getElementById('galleryModal');
  modal.classList.add('hidden');
}

function goToPage(pageNum) {
  // 更新缩略图选中状态
  document.querySelectorAll('#galleryModal button[onclick^="goToPage"]').forEach((btn, i) => {
    if (i + 1 === pageNum) {
      btn.classList.add('bg-accent/20', 'border-2', 'border-accent');
      btn.classList.remove('bg-white/5', 'border', 'border-white/10');
    } else {
      btn.classList.remove('bg-accent/20', 'border-2', 'border-accent');
      btn.classList.add('bg-white/5', 'border', 'border-white/10');
    }
  });
}

// ============ 首页案例选择 ============

function selectCase(caseName) {
  localStorage.setItem('pptCase', caseName);
  location.href = 'create.html';
}

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', () => {
  // 检查是否有预选案例
  const preselectedCase = localStorage.getItem('pptCase');
  if (preselectedCase && document.getElementById('topic')) {
    document.getElementById('topic').value = preselectedCase;
    localStorage.removeItem('pptCase');
  }
  
  // 页数滑块
  const pageCountSlider = document.getElementById('pageCount');
  const pageCountDisplay = document.getElementById('pageCountDisplay');
  if (pageCountSlider && pageCountDisplay) {
    pageCountSlider.addEventListener('input', (e) => {
      pageCountDisplay.textContent = e.target.value + ' 页';
      updatePageCount(parseInt(e.target.value));
    });
  }
  
  // API Key输入
  const apiKeyInput = document.getElementById('apiKey');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', (e) => {
      setApiKey(e.target.value);
    });
  }
  
  // 平台API开关
  const usePlatformApiCheckbox = document.getElementById('usePlatformApi');
  if (usePlatformApiCheckbox) {
    usePlatformApiCheckbox.addEventListener('change', (e) => {
      setUsePlatformApi(e.target.checked);
    });
  }
});

// ============ 补充函数 ============

// 更新成本估算（已改为免费，此函数为兼容保留）
function updateCostEstimate() {
  // 完全免费，无需计算成本
}

// 页数增减
function changePages(delta) {
  const input = document.getElementById('pages');
  if (!input) return;
  
  let value = Math.max(5, Math.min(20, parseInt(input.value) + delta));
  input.value = value;
  state.pageCount = value;
}

// 返回步骤1
function goToStep1() {
  state.currentStep = 1;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

// 关闭结果弹窗
function closeResultModal() {
  document.getElementById('resultModal').classList.add('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
  state.currentStep = 1;
  updateStepIndicator();
}