/**
 * DeckCraft - 前端交互逻辑
 */

// API配置
const API_URL = 'https://your-laf-function-url/api/generate-v2';

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
  usePlatformApi: true  // 默认使用平台API（免费），自愿赞助
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
  const resultElement = document.getElementById('generateResult');
  resultElement.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">正在生成PPT，请稍候...</p>
    </div>
  `;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayResult(result);
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    resultElement.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
        <p class="text-red-400">${error.message}</p>
        <button onclick="goBack()" class="mt-4 btn-secondary px-6 py-2 rounded-lg">返回修改</button>
      </div>
    `;
  }
}

function displayResult(result) {
  const resultElement = document.getElementById('generateResult');
  
  let html = `
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h3 class="text-xl font-bold mb-2">${result.ppt_title}</h3>
      <p class="text-gray-400">${result.style} · ${result.platform} · ${result.pages.length}页</p>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
  } else {
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
  }
  
  html += `
    </div>
    
    <div class="flex flex-col gap-3">
  `;
  
  // 下载/加入案例库按钮
  if (result.images && result.images.length > 0) {
    html += `
      <button onclick="downloadPPT()" class="btn-primary text-white py-3 rounded-xl font-medium">
        <i class="fas fa-download mr-2"></i>
        下载PPTX文件
      </button>
      <button onclick="addToGallery()" class="btn-secondary py-3 rounded-xl font-medium">
        <i class="fas fa-plus mr-2"></i>
        加入案例库
      </button>
    `;
  } else {
    html += `
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
        <p class="text-yellow-400 text-sm">
          <i class="fas fa-info-circle mr-2"></i>
          预览模式：请提供API Key以生成实际图片
        </p>
      </div>
    `;
  }
  
  html += `
      <button onclick="location.href='create.html'" class="text-gray-400 py-2">创建新PPT</button>
    </div>
  `;
  
  resultElement.innerHTML = html;
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
    style: '[data-style]'
  };
  
  const selector = containers[group];
  if (!selector) return;
  
  document.querySelectorAll(selector).forEach(card => {
    const value = card.getAttribute(`data-${group === 'mode' ? 'mode' : group}`);
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
