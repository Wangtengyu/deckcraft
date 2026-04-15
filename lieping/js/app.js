// ============================================
// 人生躺平计算器 - 核心应用逻辑
// ============================================

// 应用状态
let appState = {
    user: {
        name: '躺平追梦人',
        currentSavings: 0,
        registrationDate: null
    },
    profile: {
        city: null,
        income: {
            self: 0,
            bonus: 0,
            partner: 0,
            partnerBonus: 0,
            rent: 0,
            invest: 0,
            side: 0
        },
        expense: {
            mortgage: 0,
            car: 0,
            insurance: 0,
            utility: 0,
            food: 0,
            transport: 0,
            communication: 0,
            daily: 0,
            social: 0,
            shopping: 0,
            entertainment: 0,
            travel: 0,
            medical: 0
        },
        plan: null,
        monthlyRecords: []
    },
    ui: {
        currentPage: 'home',
        returnRate: 0.06,
        theme: 'dark'
    }
};

// 复利图表实例
let compoundChart = null;

// ============================================
// 页面导航
// ============================================
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航状态
    appState.ui.currentPage = pageId;
    updateBottomNav();
    
    // 页面特定初始化
    if (pageId === 'result') {
        calculateResults();
    } else if (pageId === 'profile') {
        updateProfile();
    } else if (pageId === 'share') {
        updateShareCard();
    }
}

function updateBottomNav() {
    const nav = document.getElementById('bottom-nav');
    const showNavPages = ['result', 'profile'];
    
    if (showNavPages.includes(appState.ui.currentPage)) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }
}

// ============================================
// Toast 通知
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-indigo-500',
        warning: 'bg-yellow-500'
    };
    
    toast.className = `toast ${colors[type]} text-white`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// 主题切换
// ============================================
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (appState.ui.theme === 'dark') {
        body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
        appState.ui.theme = 'light';
    } else {
        body.classList.remove('light-theme');
        themeIcon.textContent = '🌙';
        appState.ui.theme = 'dark';
    }
    
    saveState();
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// ============================================
// 城市选择
// ============================================
function initCitySelector() {
    const hotCitiesContainer = document.getElementById('hot-cities');
    const cityListContainer = document.getElementById('city-list');
    
    // 渲染热门城市
    hotCitiesContainer.innerHTML = HOT_CITIES.map(key => {
        const city = CITY_DATA[key];
        return `
            <button onclick="selectCity('${key}')" 
                class="glass-card p-3 text-center hover:border-indigo-500 transition" id="hot-${key}">
                <div class="font-bold">${city.name}</div>
                <div class="text-xs text-slate-400">${city.level === 1 ? '一线' : '新一线'}</div>
            </button>
        `;
    }).join('');
    
    // 按等级渲染所有城市
    const citiesByLevel = getCitiesByLevel();
    const levelNames = { 1: '一线城市', 2: '新一线', 3: '二线', 4: '三线', 5: '四线及以下' };
    
    cityListContainer.innerHTML = Object.entries(citiesByLevel)
        .filter(([level]) => level <= 4) // 只显示到三线城市
        .map(([level, cities]) => `
            <div class="mb-4">
                <div class="text-sm text-slate-400 mb-2">${levelNames[level]}</div>
                <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                    ${cities.map(city => `
                        <button onclick="selectCity('${city.key}')" 
                            class="city-item p-2 rounded-lg hover:bg-indigo-500/20 transition text-sm"
                            id="city-${city.key}">
                            ${city.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    
    // 如果已有选择，恢复状态
    if (appState.profile.city) {
        selectCity(appState.profile.city, false);
    }
}

function filterCities() {
    const keyword = document.getElementById('city-search').value;
    const cities = searchCities(keyword);
    const cityListContainer = document.getElementById('city-list');
    
    if (keyword.length === 0) {
        initCitySelector();
        return;
    }
    
    cityListContainer.innerHTML = `
        <div class="mb-4">
            <div class="text-sm text-slate-400 mb-2">搜索结果</div>
            <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                ${cities.map(city => `
                    <button onclick="selectCity('${city.key}')" 
                        class="city-item p-2 rounded-lg hover:bg-indigo-500/20 transition text-sm"
                        id="city-${city.key}">
                        ${city.name}
                        <span class="text-xs text-slate-500 block">${['一线', '新一线', '二线', '三线', '四线'][city.level - 1]}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function selectCity(cityKey, autoNext = true) {
    const city = CITY_DATA[cityKey];
    if (!city) return;
    
    appState.profile.city = cityKey;
    
    // 更新UI
    document.getElementById('current-city').classList.remove('hidden');
    document.getElementById('selected-city-name').textContent = city.name;
    document.getElementById('city-next-btn').disabled = false;
    
    // 高亮选中城市
    document.querySelectorAll('.city-item').forEach(el => el.classList.remove('bg-indigo-500/30', 'border', 'border-indigo-500'));
    document.querySelectorAll(`[id^="hot-"]`).forEach(el => el.classList.remove('bg-indigo-500/30', 'border', 'border-indigo-500'));
    
    const hotBtn = document.getElementById(`hot-${cityKey}`);
    const cityBtn = document.getElementById(`city-${cityKey}`);
    
    if (hotBtn) hotBtn.classList.add('bg-indigo-500/30', 'border', 'border-indigo-500');
    if (cityBtn) cityBtn.classList.add('bg-indigo-500/30', 'border', 'border-indigo-500');
    
    // 显示城市数据预览
    document.getElementById('city-data-preview').classList.remove('hidden');
    document.getElementById('preview-city-name').textContent = city.name;
    document.getElementById('preview-salary').textContent = city.avgSalary.toLocaleString();
    document.getElementById('preview-rent').textContent = city.avgRent.toLocaleString();
    document.getElementById('preview-cost').textContent = (city.costIndex * 100).toFixed(0) + '%';
    
    saveState();
}

function clearCity() {
    appState.profile.city = null;
    document.getElementById('current-city').classList.add('hidden');
    document.getElementById('city-next-btn').disabled = true;
    document.getElementById('city-data-preview').classList.add('hidden');
    
    document.querySelectorAll('.city-item').forEach(el => el.classList.remove('bg-indigo-500/30', 'border', 'border-indigo-500'));
    document.querySelectorAll(`[id^="hot-"]`).forEach(el => el.classList.remove('bg-indigo-500/30', 'border', 'border-indigo-500'));
    
    saveState();
}

function goNextFromCity() {
    if (!appState.profile.city) {
        showToast('请先选择城市', 'warning');
        return;
    }
    showPage('income');
}

// ============================================
// 收入计算
// ============================================
document.getElementById('has-partner')?.addEventListener('change', function() {
    const partnerSection = document.getElementById('partner-income');
    if (this.checked) {
        partnerSection.classList.remove('hidden');
    } else {
        partnerSection.classList.add('hidden');
        document.getElementById('income-partner').value = '';
        document.getElementById('income-partner-bonus').value = '';
    }
    calculateIncome();
});

function calculateIncome() {
    const income = {
        self: parseFloat(document.getElementById('income-self').value) || 0,
        bonus: parseFloat(document.getElementById('income-bonus').value) || 0,
        partner: parseFloat(document.getElementById('income-partner').value) || 0,
        partnerBonus: parseFloat(document.getElementById('income-partner-bonus').value) || 0,
        rent: parseFloat(document.getElementById('income-rent').value) || 0,
        invest: parseFloat(document.getElementById('income-invest').value) || 0,
        side: parseFloat(document.getElementById('income-side').value) || 0
    };
    
    // 月薪转年收入
    const yearlySalary = (income.self + income.partner) * 12;
    const yearlyBonus = income.bonus + income.partnerBonus;
    const yearlyPassive = (income.rent + income.invest + income.side) * 12;
    
    const totalYearly = yearlySalary + yearlyBonus + yearlyPassive;
    const totalMonthly = totalYearly / 12;
    
    // 更新UI
    document.getElementById('total-monthly-income').textContent = Math.round(totalMonthly).toLocaleString();
    document.getElementById('total-yearly-income').textContent = Math.round(totalYearly).toLocaleString();
    
    // 保存到状态
    appState.profile.income = income;
    saveState();
}

function goNextFromIncome() {
    const totalIncome = parseFloat(document.getElementById('total-monthly-income').textContent.replace(/,/g, '')) || 0;
    
    if (totalIncome === 0) {
        showToast('请至少填写一项收入', 'warning');
        return;
    }
    
    showPage('expense');
}

// ============================================
// 支出计算
// ============================================
function calculateExpense() {
    const expense = {
        mortgage: parseFloat(document.getElementById('expense-mortgage').value) || 0,
        car: parseFloat(document.getElementById('expense-car').value) || 0,
        insurance: parseFloat(document.getElementById('expense-insurance').value) || 0,
        utility: parseFloat(document.getElementById('expense-utility').value) || 0,
        food: parseFloat(document.getElementById('expense-food').value) || 0,
        transport: parseFloat(document.getElementById('expense-transport').value) || 0,
        communication: parseFloat(document.getElementById('expense-communication').value) || 0,
        daily: parseFloat(document.getElementById('expense-daily').value) || 0,
        social: parseFloat(document.getElementById('expense-social').value) || 0,
        shopping: parseFloat(document.getElementById('expense-shopping').value) || 0,
        entertainment: parseFloat(document.getElementById('expense-entertainment').value) || 0,
        travel: parseFloat(document.getElementById('expense-travel').value) || 0,
        medical: parseFloat(document.getElementById('expense-medical').value) || 0
    };
    
    const totalMonthly = Object.values(expense).reduce((a, b) => a + b, 0);
    
    // 获取月收入
    const totalIncome = parseFloat(document.getElementById('total-monthly-income')?.textContent?.replace(/,/g, '')) || 0;
    
    // 计算储蓄率
    const savings = totalIncome - totalMonthly;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100) : 0;
    
    // 更新UI
    document.getElementById('total-monthly-expense').textContent = Math.round(totalMonthly).toLocaleString();
    document.getElementById('savings-rate').textContent = Math.round(savingsRate);
    
    // 保存到状态
    appState.profile.expense = expense;
    saveState();
}

function goNextFromExpense() {
    const totalExpense = parseFloat(document.getElementById('total-monthly-expense').textContent.replace(/,/g, '')) || 0;
    
    if (totalExpense === 0) {
        showToast('请至少填写一项支出', 'warning');
        return;
    }
    
    showPage('result');
}

// ============================================
// 躺平计算核心逻辑
// ============================================
function calculateResults() {
    const { income, expense, city } = appState.profile;
    
    // 计算月收入
    const monthlyIncome = (
        (income.self || 0) + (income.partner || 0) +
        ((income.bonus || 0) + (income.partnerBonus || 0)) / 12 +
        (income.rent || 0) + (income.invest || 0) + (income.side || 0)
    );
    
    // 计算月支出
    const monthlyExpense = Object.values(expense).reduce((a, b) => a + b, 0);
    
    // 月储蓄
    const monthlySavings = monthlyIncome - monthlyExpense;
    
    // 年支出（考虑通胀）
    const inflationRate = 0.025; // 中国通胀率 2.5%
    const annualExpense = monthlyExpense * 12;
    
    // 城市生活成本调整
    const cityMultiplier = city ? CITY_DATA[city].costIndex : 1;
    
    // 三种方案计算
    const plans = {
        minimal: Math.round(60000 * 25 * cityMultiplier),      // 年支出6万
        comfortable: Math.round(120000 * 25 * cityMultiplier), // 年支出12万
        rich: Math.round(240000 * 25 * cityMultiplier)         // 年支出24万
    };
    
    // 当前实际年支出对应的躺平本金
    const targetAmount = Math.round(annualExpense * 25 * cityMultiplier);
    
    // 更新UI - 核心数据
    document.getElementById('result-target').textContent = targetAmount.toLocaleString();
    document.getElementById('result-minimal').textContent = plans.minimal.toLocaleString();
    document.getElementById('result-comfortable').textContent = plans.comfortable.toLocaleString();
    document.getElementById('result-rich').textContent = plans.rich.toLocaleString();
    
    // 财务分析
    document.getElementById('analysis-savings').textContent = '¥' + appState.user.currentSavings.toLocaleString();
    document.getElementById('analysis-monthly').textContent = '¥' + Math.round(monthlySavings).toLocaleString();
    
    const progress = appState.user.currentSavings > 0 ? 
        Math.min(100, Math.round(appState.user.currentSavings / targetAmount * 100)) : 0;
    document.getElementById('analysis-progress').textContent = progress + '%';
    
    // 击败同龄人（简化计算）
    const beatPercent = calculateBeatPercent(monthlySavings, monthlyIncome);
    document.getElementById('analysis-beat').textContent = beatPercent + '%';
    
    // 保存计划
    appState.profile.plan = {
        targetAmount,
        plans,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        annualExpense,
        progress,
        beatPercent,
        cityMultiplier
    };
    
    // 计算达成年限
    calculateYearsToGoal(targetAmount);
    
    // 绘制复利曲线
    drawCompoundChart();
    
    // 生成路线图
    generateRoadmap(targetAmount, monthlySavings);
    
    saveState();
}

function calculateBeatPercent(monthlySavings, monthlyIncome) {
    if (monthlyIncome <= 0) return 0;
    
    const savingsRate = monthlySavings / monthlyIncome;
    
    // 基于储蓄率估算击败比例
    // 10%储蓄率 ≈ 20%
    // 30%储蓄率 ≈ 50%
    // 50%储蓄率 ≈ 75%
    // 70%储蓄率 ≈ 90%
    
    if (savingsRate >= 0.7) return 90 + Math.round((savingsRate - 0.7) * 30);
    if (savingsRate >= 0.5) return 75 + Math.round((savingsRate - 0.5) * 75);
    if (savingsRate >= 0.3) return 50 + Math.round((savingsRate - 0.3) * 125);
    if (savingsRate >= 0.1) return 20 + Math.round((savingsRate - 0.1) * 150);
    return Math.round(savingsRate * 200);
}

function calculateYearsToGoal(targetAmount) {
    const { monthlySavings, progress } = appState.profile.plan || {};
    const currentSavings = appState.user.currentSavings;
    const returnRate = appState.ui.returnRate;
    
    if (monthlySavings <= 0) {
        document.getElementById('years-to-goal').textContent = '∞';
        return null;
    }
    
    // 考虑当前存款和复利
    let years = 0;
    let current = currentSavings;
    const monthlyRate = returnRate / 12;
    
    while (current < targetAmount && years < 100) {
        current = current * (1 + monthlyRate) + monthlySavings * 12;
        years++;
    }
    
    document.getElementById('years-to-goal').textContent = years >= 100 ? '50+' : years;
    
    return years;
}

// ============================================
// 复利曲线
// ============================================
function setReturnRate(rate) {
    appState.ui.returnRate = rate;
    
    // 更新按钮状态
    document.querySelectorAll('[id^="rate-btn-"]').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.getElementById(`rate-btn-${rate}`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
    
    // 重新绘制
    calculateYearsToGoal(appState.profile.plan?.targetAmount);
    drawCompoundChart();
    saveState();
}

function drawCompoundChart() {
    const ctx = document.getElementById('compoundChart');
    if (!ctx) return;
    
    const { targetAmount, monthlySavings } = appState.profile.plan || {};
    const currentSavings = appState.user.currentSavings;
    const returnRate = appState.ui.returnRate;
    
    if (!targetAmount || monthlySavings <= 0) {
        if (compoundChart) {
            compoundChart.destroy();
        }
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400">请填写收支数据</div>';
        return;
    }
    
    // 生成数据
    const labels = [];
    const dataNoInvest = [];  // 无投资增长
    const dataWithInvest = []; // 有复利增长
    const years = Math.min(50, Math.ceil((targetAmount - currentSavings) / monthlySavings / 12) + 10);
    
    let current = currentSavings;
    
    for (let i = 0; i <= years; i++) {
        labels.push(`第${i}年`);
        dataNoInvest.push(current + monthlySavings * 12 * i);
        
        // 计算复利
        let withCompound = currentSavings;
        for (let m = 0; m < i * 12; m++) {
            withCompound = withCompound * (1 + returnRate / 12) + monthlySavings;
        }
        dataWithInvest.push(Math.round(withCompound));
    }
    
    // 目标线
    const targetData = labels.map(() => targetAmount);
    
    if (compoundChart) {
        compoundChart.destroy();
    }
    
    compoundChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: '无投资增长',
                    data: dataNoInvest,
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                },
                {
                    label: `复利增长(${returnRate * 100}%)`,
                    data: dataWithInvest,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '目标',
                    data: targetData,
                    borderColor: '#10b981',
                    borderDash: [10, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ¥' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    ticks: {
                        color: '#64748b',
                        callback: value => '¥' + (value / 10000).toFixed(0) + '万'
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ============================================
// 路线图生成
// ============================================
function generateRoadmap(targetAmount, monthlySavings) {
    const container = document.getElementById('roadmap');
    if (!container) return;
    
    const years = calculateYearsToGoal(targetAmount) || 50;
    const currentSavings = appState.user.currentSavings;
    
    // 确定当前阶段
    const currentPhase = years <= 2 ? 'phase1' : 
                         years <= 5 ? 'phase2' : 
                         years <= 10 ? 'phase3' : 'phase4';
    
    const milestones = [
        {
            years: Math.min(2, years),
            phase: 'phase1',
            title: '建立基础',
            progress: Math.min(100, currentSavings / 100000 * 100)
        },
        {
            years: Math.min(5, years),
            phase: 'phase2',
            title: '复利加速',
            progress: Math.min(100, currentSavings / (targetAmount * 0.25) * 100)
        },
        {
            years: Math.min(10, years),
            phase: 'phase3',
            title: '被动收入构建',
            progress: Math.min(100, currentSavings / (targetAmount * 0.5) * 100)
        },
        {
            years: years,
            phase: 'phase4',
            title: '躺平达成',
            progress: Math.min(100, currentSavings / targetAmount * 100)
        }
    ];
    
    container.innerHTML = milestones.map((m, i) => {
        const phase = PHASES[m.phase];
        const isActive = m.phase === currentPhase;
        const isCompleted = i < milestones.findIndex(x => x.phase === currentPhase) || 
                           (i === milestones.findIndex(x => x.phase === currentPhase) && appState.profile.plan?.progress >= 50);
        
        return `
            <div class="relative pl-10 ${isCompleted ? 'opacity-60' : ''}">
                <div class="absolute left-2 w-5 h-5 rounded-full ${isActive ? 'bg-indigo-500 pulse-glow' : isCompleted ? 'bg-green-500' : 'bg-slate-600'}"></div>
                <div class="glass-card p-4 ${isActive ? 'border-indigo-500' : ''}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-xl mr-2">${phase.emoji}</span>
                            <span class="font-bold">${m.title}</span>
                        </div>
                        <span class="text-sm text-slate-400">${m.years}年内</span>
                    </div>
                    <div class="text-sm text-slate-400 mb-2">${phase.tips[0]}</div>
                    <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style="width: ${Math.min(100, m.progress)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// 个人中心
// ============================================
function updateProfile() {
    const plan = appState.profile.plan;
    
    // 更新进度
    if (plan) {
        document.getElementById('progress-percent').textContent = plan.progress + '%';
        document.getElementById('progress-saved').textContent = '¥' + appState.user.currentSavings.toLocaleString();
        document.getElementById('progress-target').textContent = '¥' + plan.targetAmount.toLocaleString();
        document.getElementById('progress-remain').textContent = '¥' + Math.max(0, plan.targetAmount - appState.user.currentSavings).toLocaleString();
        
        // 更新进度环
        const circle = document.getElementById('progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 70;
            const offset = circumference * (1 - plan.progress / 100);
            circle.style.strokeDashoffset = Math.max(0, offset);
        }
    }
    
    // 更新里程碑
    updateMilestones();
    
    // 更新月度记录
    updateMonthlyRecords();
}

function updateMilestones() {
    const plan = appState.profile.plan;
    const data = {
        currentSavings: appState.user.currentSavings,
        savingsRate: plan?.monthlySavings && plan?.monthlyIncome ? 
            plan.monthlySavings / plan.monthlyIncome * 100 : 0,
        monthlyPassiveIncome: (appState.profile.income.rent || 0) + 
                             (appState.profile.income.invest || 0) + 
                             (appState.profile.income.side || 0),
        progress: plan?.progress || 0
    };
    
    document.querySelectorAll('.milestone-item').forEach(item => {
        const milestoneKey = item.dataset.milestone;
        const milestone = MILESTONES[milestoneKey];
        
        if (milestone && milestone.condition(data)) {
            item.classList.remove('opacity-50');
            item.classList.add('pulse-glow');
            item.querySelector('.text-slate-400').textContent = '✓ 已达成';
        }
    });
}

function updateMonthlyRecords() {
    const container = document.getElementById('monthly-records');
    const records = appState.profile.monthlyRecords;
    
    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-400 py-8">
                暂无月度记录<br>
                <span class="text-sm">开始记录你的财务成长吧</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = records.slice().reverse().slice(0, 6).map(record => `
        <div class="glass-card p-4 flex justify-between items-center">
            <div>
                <div class="font-bold">${record.month}</div>
                <div class="text-sm text-slate-400">${record.note || ''}</div>
            </div>
            <div class="text-green-400 font-bold">+¥${record.savings.toLocaleString()}</div>
        </div>
    `).join('');
}

// ============================================
// 月度记录
// ============================================
function showAddMonthModal() {
    const modal = document.getElementById('add-month-modal');
    modal.classList.remove('hidden');
    
    // 设置默认月份为当前月份
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    document.getElementById('record-month').value = month;
}

function closeAddMonthModal() {
    document.getElementById('add-month-modal').classList.add('hidden');
}

function saveMonthRecord() {
    const month = document.getElementById('record-month').value;
    const savings = parseFloat(document.getElementById('record-savings').value) || 0;
    const note = document.getElementById('record-note').value;
    
    if (!month || savings <= 0) {
        showToast('请填写月份和存款金额', 'warning');
        return;
    }
    
    // 添加记录
    appState.profile.monthlyRecords.push({
        month,
        savings,
        note,
        date: new Date().toISOString()
    });
    
    // 更新总存款
    appState.user.currentSavings += savings;
    
    closeAddMonthModal();
    updateProfile();
    saveState();
    
    showToast('记录已保存 🎉', 'success');
    
    // 检查里程碑
    if (appState.user.currentSavings >= 100000) {
        showToast('🎉 达成里程碑：首个10万！', 'success');
    }
}

// ============================================
// 分享卡片
// ============================================
function generateShareCard() {
    const plan = appState.profile.plan;
    const city = appState.profile.city;
    
    if (!plan) {
        showToast('请先完成测算', 'warning');
        return;
    }
    
    // 更新分享卡片数据
    document.getElementById('share-city').textContent = city ? CITY_DATA[city].name : '未知城市';
    document.getElementById('share-target').textContent = plan.targetAmount.toLocaleString();
    document.getElementById('share-progress').textContent = plan.progress + '%';
    document.getElementById('share-years').textContent = document.getElementById('years-to-goal').textContent + '年';
    document.getElementById('share-monthly').textContent = '¥' + Math.round(plan.monthlySavings).toLocaleString();
    
    // 成就
    document.getElementById('share-achievement').textContent = 
        `储蓄率击败${plan.beatPercent}%的年轻人`;
    
    // 进度条
    document.getElementById('share-progress-bar').textContent = plan.progress + '%';
    document.getElementById('share-progress-fill').style.width = plan.progress + '%';
    
    showPage('share');
}

function updateShareCard() {
    generateShareCard();
}

function downloadShareCard() {
    const card = document.getElementById('share-card');
    
    html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = '躺平报告_' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('图片已下载 📥', 'success');
    }).catch(err => {
        showToast('下载失败，请重试', 'error');
    });
}

// ============================================
// 数据导入导出
// ============================================
function exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = '躺平计算器数据_' + new Date().toISOString().slice(0, 10) + '.json';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('数据已导出 📤', 'success');
}

function importData() {
    document.getElementById('import-file').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!imported.profile || !imported.user) {
                throw new Error('Invalid data format');
            }
            
            appState = imported;
            saveState();
            
            // 恢复UI状态
            restoreUIState();
            
            showToast('数据导入成功 🎉', 'success');
            showPage('profile');
            
        } catch (err) {
            showToast('导入失败：文件格式错误', 'error');
        }
    };
    reader.readAsText(file);
    
    // 清空input
    event.target.value = '';
}

function restoreUIState() {
    const { income, expense, city } = appState.profile;
    
    // 恢复收入
    if (income) {
        document.getElementById('income-self').value = income.self || '';
        document.getElementById('income-bonus').value = income.bonus || '';
        document.getElementById('income-partner').value = income.partner || '';
        document.getElementById('income-partner-bonus').value = income.partnerBonus || '';
        document.getElementById('income-rent').value = income.rent || '';
        document.getElementById('income-invest').value = income.invest || '';
        document.getElementById('income-side').value = income.side || '';
        
        if (income.partner > 0) {
            document.getElementById('has-partner').checked = true;
            document.getElementById('partner-income').classList.remove('hidden');
        }
        
        calculateIncome();
    }
    
    // 恢复支出
    if (expense) {
        Object.entries(expense).forEach(([key, value]) => {
            const el = document.getElementById(`expense-${key}`);
            if (el) el.value = value || '';
        });
        calculateExpense();
    }
    
    // 恢复城市
    if (city) {
        initCitySelector();
        selectCity(city, false);
    }
    
    // 恢复主题
    if (appState.ui.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function resetData() {
    if (!confirm('确定要重置所有数据吗？此操作不可恢复。')) {
        return;
    }
    
    localStorage.removeItem('liepingState');
    location.reload();
}

// ============================================
// 本地存储
// ============================================
function saveState() {
    try {
        localStorage.setItem('liepingState', JSON.stringify(appState));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('liepingState');
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // 合并状态，保留新版本的默认值
            appState = {
                ...appState,
                ...parsed,
                user: { ...appState.user, ...parsed.user },
                profile: {
                    ...appState.profile,
                    ...parsed.profile,
                    income: { ...appState.profile.income, ...parsed.profile?.income },
                    expense: { ...appState.profile.expense, ...parsed.profile?.expense }
                },
                ui: { ...appState.ui, ...parsed.ui }
            };
            
            return true;
        }
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
    return false;
}

// ============================================
// 初始化
// ============================================
function init() {
    // 加载保存的状态
    const hasData = loadState();
    
    // 初始化城市选择器
    initCitySelector();
    
    // 恢复UI状态
    if (hasData) {
        restoreUIState();
        
        // 如果有保存的计划，显示结果页
        if (appState.profile.plan) {
            // 不自动跳转，等待用户操作
        }
    }
    
    // 恢复主题
    if (appState.ui.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').textContent = '☀️';
    }
    
    // 更新用户信息
    if (appState.user.name) {
        document.getElementById('user-name').textContent = appState.user.name;
        document.getElementById('profile-name').textContent = appState.user.name;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 引导流程快捷入口
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航状态
    appState.ui.currentPage = pageId;
    updateBottomNav();
    
    // 页面特定初始化
    if (pageId === 'result') {
        calculateResults();
    } else if (pageId === 'profile') {
        updateProfile();
    } else if (pageId === 'share') {
        updateShareCard();
    } else if (pageId === 'onboarding') {
        // 引导流程
        if (!appState.profile.city) {
            showPage('city');
        } else if (Object.values(appState.profile.income).every(v => !v)) {
            showPage('income');
        } else {
            showPage('expense');
        }
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 新增引导页（复用城市页作为引导入口）
const onboardingHandler = {
    execute() {
        showPage('city');
    }
};

// ============================================
// 财富金字塔页面
// ============================================
function initPyramidPage() {
    const container = document.getElementById('wealth-pyramid');
    if (!container) return;
    
    container.innerHTML = WEALTH_PYRAMID.map((layer, index) => `
        <div class="pyramid-layer glass-card p-4 text-center bg-gradient-to-r ${layer.color} bg-opacity-20 rounded-xl"
             onclick="showPyramidDetail(${index})">
            <div class="text-3xl mb-2">${layer.emoji}</div>
            <div class="font-bold">${layer.name}</div>
            <div class="text-xs text-slate-400">${layer.description}</div>
        </div>
    `).join('');
    
    // 计算复利威力对比
    calculateCompoundComparison();
}

function showPyramidDetail(index) {
    const layer = WEALTH_PYRAMID[index];
    showToast(`${layer.emoji} ${layer.name}: ${layer.requirements.join(' | ')}`, 'info');
}

function calculateCompoundComparison() {
    const monthly = 3000;
    const annual = 0.06;
    const yearsA = 10;
    
    // 场景A：立即复利
    const resultA = calculateCompoundTotal(monthly, annual, yearsA);
    const gainA = resultA - monthly * 12 * yearsA;
    
    // 场景B：前3年只存不投
    const resultB = monthly * 12 * 3 + calculateCompoundTotal(monthly, annual, 7);
    const gainB = resultB - monthly * 12 * yearsA;
    
    // 更新UI
    document.getElementById('scene-a-result').textContent = '¥' + Math.round(resultA).toLocaleString();
    document.getElementById('scene-a-gain').textContent = '¥' + Math.round(gainA).toLocaleString();
    document.getElementById('scene-b-result').textContent = '¥' + Math.round(resultB).toLocaleString();
    document.getElementById('scene-b-gain').textContent = '¥' + Math.round(gainB).toLocaleString();
    document.getElementById('compound-loss').textContent = '¥' + Math.round(gainA - gainB).toLocaleString();
}

function calculateCompoundTotal(monthly, annualRate, years) {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    let total = 0;
    
    for (let i = 0; i < months; i++) {
        total = total * (1 + monthlyRate) + monthly;
    }
    
    return total;
}

// ============================================
// 省钱攻略页面
// ============================================
function initSavingsPage() {
    const { expense, income } = appState.profile;
    const monthlyIncome = calculateMonthlyIncome();
    
    // 生成节省建议
    const suggestions = [];
    const savingsMap = {
        food: expense.food || 0,
        transport: expense.transport || 0,
        shopping: expense.shopping || 0,
        entertainment: expense.entertainment || 0,
        social: expense.social || 0,
        travel: expense.travel || 0,
        daily: expense.daily || 0,
        communication: expense.communication || 0
    };
    
    let totalPotential = 0;
    
    Object.entries(savingsMap).forEach(([key, amount]) => {
        const suggestion = SAVINGS_SUGGESTIONS[key];
        if (!suggestion || amount <= 0) return;
        
        const potential = amount * (suggestion.potentialPercent / 100);
        const level = suggestion.potentialPercent >= 35 ? 'high' : (suggestion.potentialPercent >= 25 ? 'medium' : 'low');
        
        totalPotential += potential;
        
        suggestions.push({
            key,
            ...suggestion,
            current: amount,
            potential: Math.round(potential),
            level
        });
    });
    
    // 按节省潜力排序
    suggestions.sort((a, b) => b.potential - a.potential);
    
    // 渲染建议列表
    const container = document.getElementById('savings-suggestions');
    if (container) {
        container.innerHTML = suggestions.map(s => `
            <div class="saving-card ${s.level} glass-card p-4" onclick="showSavingDetail('${s.key}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="text-3xl">${s.emoji}</div>
                        <div>
                            <div class="font-bold">${s.name}</div>
                            <div class="text-sm text-slate-400">
                                当前 <span class="text-white">¥${s.current}</span> / 平均 ¥${s.avgCost}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400 font-bold">-¥${s.potential}/月</div>
                        <div class="text-xs text-slate-400">${s.potentialPercent}%优化空间</div>
                    </div>
                </div>
                <div class="text-xs text-slate-400">
                    💡 ${s.tips[0]}
                </div>
            </div>
        `).join('');
    }
    
    // 更新节省潜力总览
    document.getElementById('total-savings-potential').textContent = Math.round(totalPotential).toLocaleString();
    document.getElementById('yearly-savings-potential').textContent = '¥' + Math.round(totalPotential * 12).toLocaleString();
    document.getElementById('decade-savings-potential').textContent = '¥' + Math.round(totalPotential * 12 * 10 * 1.06).toLocaleString();
    
    // 生成有趣对比
    generateFunComparisons(totalPotential);
}

function showSavingDetail(key) {
    const suggestion = SAVINGS_SUGGESTIONS[key];
    const tips = suggestion.tips.map(t => `• ${t}`).join('\n');
    showToast(`${suggestion.emoji} ${suggestion.name}建议:\n${tips}`, 'info');
}

function generateFunComparisons(totalSavings) {
    const container = document.getElementById('fun-comparisons');
    if (!container) return;
    
    // 计算每月可节省的花费数量
    const comparisons = FUN_COMPARISONS.map(item => {
        const count = Math.floor(totalSavings / item.price);
        return { ...item, count };
    }).filter(c => c.count >= 1).slice(0, 4);
    
    if (comparisons.length === 0) {
        comparisons.push(...FUN_COMPARISONS.slice(0, 4).map(c => ({ ...c, count: 0 })));
    }
    
    container.innerHTML = comparisons.map(item => `
        <div class="glass-card p-4 rounded-xl">
            <div class="text-3xl mb-2">${item.emoji}</div>
            <div class="font-bold">${item.count}个${item.name}</div>
            <div class="text-xs text-slate-400">省下的钱可以买</div>
        </div>
    `).join('');
}

function calculateMonthlyIncome() {
    const { income } = appState.profile;
    return (
        (income.self || 0) + (income.partner || 0) +
        ((income.bonus || 0) + (income.partnerBonus || 0)) / 12 +
        (income.rent || 0) + (income.invest || 0) + (income.side || 0)
    );
}

// ============================================
// 目标规划页面
// ============================================
function initGoalsPage() {
    const { plan } = appState.profile;
    const monthlySavings = plan?.monthlySavings || 0;
    const targetAmount = plan?.targetAmount || 0;
    const currentSavings = appState.user.currentSavings;
    
    // 计算用户标签
    const userTags = calculateUserTags();
    const mainTag = userTags[0] || USER_TAGS.saver;
    
    // 更新主标签
    document.getElementById('user-tag').textContent = `${mainTag.emoji} ${mainTag.name}`;
    
    // 更新标签列表
    const tagsContainer = document.getElementById('user-tags-list');
    if (tagsContainer) {
        tagsContainer.innerHTML = userTags.map(tag => `
            <span class="user-tag text-white" style="--tag-color1: ${tag.color1}; --tag-color2: ${tag.color2}">
                ${tag.emoji} ${tag.name}
            </span>
        `).join('');
    }
    
    // 生成三阶段目标
    generateGoalTimeline(targetAmount, monthlySavings, currentSavings);
    
    // 生成成就系统
    generateAchievements(plan);
}

function calculateUserTags() {
    const { plan } = appState.profile;
    const { monthlySavings, monthlyExpense, targetAmount } = plan || {};
    const monthlyIncome = calculateMonthlyIncome();
    
    const data = {
        savingsRate: monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100) : 0,
        monthlyPassiveIncome: appState.profile.income?.invest || 0,
        totalExpense: monthlyExpense || 0,
        income: monthlyIncome || 0,
        progress: targetAmount > 0 ? (appState.user.currentSavings / targetAmount * 100) : 0,
        yearsToGoal: calculateYearsToGoal(targetAmount) || 999
    };
    
    return Object.values(USER_TAGS).filter(tag => tag.condition(data));
}

function generateGoalTimeline(targetAmount, monthlySavings, currentSavings) {
    const container = document.getElementById('goal-timeline');
    if (!container) return;
    
    // 计算各阶段目标金额
    const emergencyFund = monthlySavings * 6; // 6个月支出作为应急基金
    
    const phases = [
        {
            ...GOAL_PHASES.short,
            amount: emergencyFund,
            progress: Math.min(100, Math.round(currentSavings / emergencyFund * 100)),
            status: currentSavings >= emergencyFund ? 'completed' : 'active'
        },
        {
            ...GOAL_PHASES.medium,
            amount: 500000,
            progress: Math.min(100, Math.round(currentSavings / 500000 * 100)),
            status: currentSavings >= 500000 ? 'completed' : (currentSavings >= emergencyFund ? 'active' : 'locked')
        },
        {
            ...GOAL_PHASES.long,
            amount: targetAmount,
            progress: Math.min(100, Math.round(currentSavings / targetAmount * 100)),
            status: currentSavings >= targetAmount ? 'completed' : (currentSavings >= 500000 ? 'active' : 'locked')
        }
    ];
    
    container.innerHTML = phases.map((phase, index) => `
        <div class="goal-phase mb-6">
            <div class="glass-card p-4 ${phase.status === 'locked' ? 'opacity-50' : ''}">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <div class="text-2xl">${phase.emoji}</div>
                        <div>
                            <div class="font-bold">${phase.name}</div>
                            <div class="text-xs text-slate-400">${phase.duration}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold" style="color: ${phase.color}">¥${phase.amount.toLocaleString()}</div>
                        <div class="text-xs text-slate-400">${phase.progress}%完成</div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all" 
                             style="width: ${phase.progress}%; background: ${phase.color}"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    ${phase.milestones.map(m => `
                        <div class="text-xs text-slate-400 flex items-center gap-1">
                            <span>✓</span> ${m}
                        </div>
                    `).join('')}
                </div>
                
                ${phase.status === 'completed' ? '<div class="mt-2 text-center text-green-400 text-sm">🎉 已达成!</div>' : ''}
                ${phase.status === 'locked' ? '<div class="mt-2 text-center text-slate-500 text-sm">🔒 先完成上阶段</div>' : ''}
            </div>
        </div>
    `).join('');
}

function generateAchievements(plan) {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    
    const { progress } = plan || {};
    
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
        let unlocked = achievement.unlocked;
        
        // 根据进度解锁
        if (key === 'halfWay' && progress >= 50) unlocked = true;
        if (key === 'houseReady' && appState.user.currentSavings >= 300000) unlocked = true;
        
        return `
            <div class="glass-card p-4 text-center ${unlocked ? '' : 'opacity-50 grayscale'}">
                <div class="text-3xl mb-2">${achievement.emoji}</div>
                <div class="text-sm font-bold">${achievement.name}</div>
                <div class="text-xs text-slate-400">${achievement.description}</div>
                ${unlocked ? '<div class="text-xs text-green-400 mt-1">✓ 已解锁</div>' : '<div class="text-xs text-slate-500 mt-1">未解锁</div>'}
            </div>
        `;
    }).join('');
}

// ============================================
// 更新分享卡片
// ============================================
function updateShareCard() {
    const { plan, city } = appState.profile;
    if (!plan) return;
    
    const cityName = city ? CITY_DATA[city]?.name : '未知城市';
    
    document.getElementById('share-city').textContent = cityName;
    document.getElementById('share-target').textContent = plan.targetAmount.toLocaleString();
    document.getElementById('share-progress').textContent = plan.progress + '%';
    document.getElementById('share-years').textContent = document.getElementById('years-to-goal')?.textContent || '∞';
    document.getElementById('share-monthly').textContent = '¥' + Math.round(plan.monthlySavings).toLocaleString();
    document.getElementById('share-progress-bar').textContent = plan.progress + '%';
    document.getElementById('share-progress-fill').style.width = plan.progress + '%';
    
    // 更新成就文字
    const achievementText = plan.beatPercent >= 80 
        ? '储蓄率击败90%的年轻人' 
        : (plan.beatPercent >= 50 ? '储蓄率击败70%的年轻人' : '正在向躺平迈进');
    document.getElementById('share-achievement').textContent = achievementText;
    
    // 更新用户标签
    const userTags = calculateUserTags();
    if (userTags.length > 0) {
        const mainTag = userTags[0];
        document.getElementById('share-user-tag').textContent = `${mainTag.emoji} ${mainTag.name}`;
    }
    
    // 更新标题
    if (plan.progress >= 100) {
        document.getElementById('share-title').textContent = '🎉 我已达成躺平!';
    } else if (plan.progress >= 50) {
        document.getElementById('share-title').textContent = '🚀 半程达成!';
    } else {
        document.getElementById('share-title').textContent = '💪 我的财务体检报告';
    }
}

// ============================================
// 页面初始化钩子
// ============================================
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    
    // 页面特定初始化
    switch(pageId) {
        case 'pyramid':
            initPyramidPage();
            break;
        case 'savings':
            initSavingsPage();
            break;
        case 'goals':
            initGoalsPage();
            break;
        case 'share':
            updateShareCard();
            break;
    }
};
