// 城市数据 - 包含中国各城市的生活成本数据
const CITY_DATA = {
    // 一线城市
    beijing: {
        name: "北京",
        level: 1,
        avgSalary: 13930,
        avgRent: 6000,
        costIndex: 1.3,
        salaryGrowth: 8
    },
    shanghai: {
        name: "上海",
        level: 1,
        avgSalary:13800,
        avgRent: 5800,
        costIndex: 1.28,
        salaryGrowth: 7.5
    },
    shenzhen: {
        name: "深圳",
        level: 1,
        avgSalary: 13500,
        avgRent: 5500,
        costIndex: 1.25,
        salaryGrowth: 9
    },
    guangzhou: {
        name: "广州",
        level: 1,
        avgSalary: 11200,
        avgRent: 4000,
        costIndex: 1.15,
        salaryGrowth: 7
    },
    
    // 新一线城市
    hangzhou: {
        name: "杭州",
        level: 2,
        avgSalary: 11000,
        avgRent: 3800,
        costIndex: 1.18,
        salaryGrowth: 9.5
    },
    nanjing: {
        name: "南京",
        level: 2,
        avgSalary: 10000,
        avgRent: 3200,
        costIndex: 1.12,
        salaryGrowth: 7.5
    },
    chengdu: {
        name: "成都",
        level: 2,
        avgSalary: 8500,
        avgRent: 2200,
        costIndex: 0.98,
        salaryGrowth: 8
    },
    wuhan: {
        name: "武汉",
        level: 2,
        avgSalary: 8200,
        avgRent: 2000,
        costIndex: 0.95,
        salaryGrowth: 8
    },
    xian: {
        name: "西安",
        level: 2,
        avgSalary: 7800,
        avgRent: 1800,
        costIndex: 0.92,
        salaryGrowth: 8
    },
    tianjin: {
        name: "天津",
        level: 2,
        avgSalary: 9500,
        avgRent: 2500,
        costIndex: 1.05,
        salaryGrowth: 7
    },
    chongqing: {
        name: "重庆",
        level: 2,
        avgSalary: 8000,
        avgRent: 1800,
        costIndex: 0.9,
        salaryGrowth: 8.5
    },
    suzhou: {
        name: "苏州",
        level: 2,
        avgSalary: 10200,
        avgRent: 3000,
        costIndex: 1.1,
        salaryGrowth: 8
    },
    zhengzhou: {
        name: "郑州",
        level: 2,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.88,
        salaryGrowth: 8
    },
    changsha: {
        name: "长沙",
        level: 2,
        avgSalary: 7800,
        avgRent: 1700,
        costIndex: 0.9,
        salaryGrowth: 8.5
    },
    
    // 二线城市
    zhuhai: {
        name: "珠海",
        level: 3,
        avgSalary: 8500,
        avgRent: 2500,
        costIndex: 1.05,
        salaryGrowth: 7.5
    },
    ningbo: {
        name: "宁波",
        level: 3,
        avgSalary: 9000,
        avgRent: 2800,
        costIndex: 1.08,
        salaryGrowth: 7.5
    },
    kunming: {
        name: "昆明",
        level: 3,
        avgSalary: 7200,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 7
    },
    qingdao: {
        name: "青岛",
        level: 3,
        avgSalary: 8500,
        avgRent: 2200,
        costIndex: 1.0,
        salaryGrowth: 7
    },
    dalian: {
        name: "大连",
        level: 3,
        avgSalary: 8000,
        avgRent: 2000,
        costIndex: 0.98,
        salaryGrowth: 6.5
    },
    shenyang: {
        name: "沈阳",
        level: 3,
        avgSalary: 7000,
        avgRent: 1400,
        costIndex: 0.85,
        salaryGrowth: 6.5
    },
    jinan: {
        name: "济南",
        level: 3,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.9,
        salaryGrowth: 7
    },
    fuzhou: {
        name: "福州",
        level: 3,
        avgSalary: 8000,
        avgRent: 2200,
        costIndex: 1.0,
        salaryGrowth: 7
    },
    xiamen: {
        name: "厦门",
        level: 3,
        avgSalary: 9000,
        avgRent: 3000,
        costIndex: 1.15,
        salaryGrowth: 7.5
    },
    harbin: {
        name: "哈尔滨",
        level: 3,
        avgSalary: 6500,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    changchun: {
        name: "长春",
        level: 3,
        avgSalary: 6200,
        avgRent: 1100,
        costIndex: 0.8,
        salaryGrowth: 6
    },
    nanchang: {
        name: "南昌",
        level: 3,
        avgSalary: 6800,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 7
    },
    hefei: {
        name: "合肥",
        level: 3,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.92,
        salaryGrowth: 8
    },
    shijiazhuang: {
        name: "石家庄",
        level: 3,
        avgSalary: 6500,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6.5
    },
    
    // 三线城市
    foshan: {
        name: "佛山",
        level: 4,
        avgSalary: 7000,
        avgRent: 1600,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    wuxi: {
        name: "无锡",
        level: 4,
        avgSalary: 8000,
        avgRent: 2000,
        costIndex: 0.98,
        salaryGrowth: 7
    },
    dongguan: {
        name: "东莞",
        level: 4,
        avgSalary: 6800,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    huizhou: {
        name: "惠州",
        level: 4,
        avgSalary: 6200,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 6
    },
    wenzhou: {
        name: "温州",
        level: 4,
        avgSalary: 7000,
        avgRent: 1800,
        costIndex: 0.92,
        salaryGrowth: 6.5
    },
    jiaxing: {
        name: "嘉兴",
        level: 4,
        avgSalary: 7200,
        avgRent: 1700,
        costIndex: 0.9,
        salaryGrowth: 7
    },
    taizhou_zj: {
        name: "台州",
        level: 4,
        avgSalary: 6800,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    yantai: {
        name: "烟台",
        level: 4,
        avgSalary: 6500,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 6
    },
    weifang: {
        name: "潍坊",
        level: 4,
        avgSalary: 5800,
        avgRent: 1100,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    tangshan: {
        name: "唐山",
        level: 4,
        avgSalary: 6000,
        avgRent: 1100,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    baoding: {
        name: "保定",
        level: 4,
        avgSalary: 5500,
        avgRent: 1000,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    langfang: {
        name: "廊坊",
        level: 4,
        avgSalary: 5800,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6.5
    },
    zhuzhou: {
        name: "株洲",
        level: 4,
        avgSalary: 5500,
        avgRent: 1000,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    yichang: {
        name: "宜昌",
        level: 4,
        avgSalary: 5200,
        avgRent: 900,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    baotou: {
        name: "包头",
        level: 4,
        avgSalary: 5500,
        avgRent: 900,
        costIndex: 0.78,
        salaryGrowth: 5.5
    },
    
    // 四线及以下城市
    luzhou: {
        name: "泸州",
        level: 5,
        avgSalary: 4500,
        avgRent: 700,
        costIndex: 0.72,
        salaryGrowth: 5.5
    },
    yibin: {
        name: "宜宾",
        level: 5,
        avgSalary: 4800,
        avgRent: 750,
        costIndex: 0.72,
        salaryGrowth: 5.5
    },
    nanyang: {
        name: "南阳",
        level: 5,
        avgSalary: 4200,
        avgRent: 600,
        costIndex: 0.7,
        salaryGrowth: 5
    },
    shangqiu: {
        name: "商丘",
        level: 5,
        avgSalary: 4000,
        avgRent: 550,
        costIndex: 0.68,
        salaryGrowth: 5
    },
    hezhou: {
        name: "贺州",
        level: 5,
        avgSalary: 3800,
        avgRent: 500,
        costIndex: 0.68,
        salaryGrowth: 5
    },
    qiandongnan: {
        name: "黔东南",
        level: 5,
        avgSalary: 4200,
        avgRent: 600,
        costIndex: 0.7,
        salaryGrowth: 5.5
    }
};

// 获取热门城市
const HOT_CITIES = ['beijing', 'shanghai', 'shenzhen', 'guangzhou', 'hangzhou', 'nanjing', 'chengdu', 'wuhan', 'xian', 'chongqing', 'tianjin', 'suzhou'];

// 获取所有城市列表（按等级分组）
function getCitiesByLevel() {
    const levels = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
    };
    
    Object.entries(CITY_DATA).forEach(([key, city]) => {
        levels[city.level].push({ key, ...city });
    });
    
    return levels;
}

// 根据关键词搜索城市
function searchCities(keyword) {
    if (!keyword) {
        return Object.entries(CITY_DATA).map(([key, city]) => ({ key, ...city }));
    }
    
    keyword = keyword.toLowerCase();
    return Object.entries(CITY_DATA)
        .filter(([key, city]) => 
            city.name.toLowerCase().includes(keyword) ||
            key.includes(keyword)
        )
        .map(([key, city]) => ({ key, ...city }));
}

// 计算城市生活成本系数
function getCostMultiplier(cityKey) {
    const city = CITY_DATA[cityKey];
    if (!city) return 1;
    return city.costIndex;
}

// 计算基于城市的合理月支出
function getReasonableExpense(cityKey, income) {
    const city = CITY_DATA[cityKey];
    if (!city) return income * 0.7;
    
    // 城市消费指数越高，可消费比例越低
    const consumptionRatio = Math.max(0.4, 0.8 - (city.costIndex - 1) * 0.5);
    return income * consumptionRatio;
}

// 获取城市生活成本报告
function getCityReport(cityKey) {
    const city = CITY_DATA[cityKey];
    if (!city) return null;
    
    const levelNames = {
        1: '一线城市',
        2: '新一线城市',
        3: '二线城市',
        4: '三线城市',
        5: '四线及以下'
    };
    
    return {
        name: city.name,
        level: levelNames[city.level],
        avgSalary: city.avgSalary,
        avgRent: city.avgRent,
        costIndex: city.costIndex,
        salaryGrowth: city.salaryGrowth
    };
}

// 躺平方案配置
const RETIREMENT_PLANS = {
    minimal: {
        name: '极简躺平',
        emoji: '🏕️',
        annualExpense: 60000,
        description: '控制欲望，精打细算'
    },
    comfortable: {
        name: '舒适躺平',
        emoji: '🏡',
        annualExpense: 120000,
        description: '适度消费，生活体面'
    },
    rich: {
        name: '富足躺平',
        emoji: '🏰',
        annualExpense: 240000,
        description: '品质生活，任性消费'
    }
};

// 复利方案配置
const RETURN_RATES = {
    conservative: {
        rate: 0.03,
        name: '保守',
        color: '#10b981',
        description: '国债、大额存单类'
    },
    moderate: {
        rate: 0.06,
        name: '稳健',
        color: '#6366f1',
        description: '混合基金、债券类'
    },
    aggressive: {
        rate: 0.09,
        name: '进取',
        color: '#f59e0b',
        description: '股票、指数基金类'
    }
};

// 阶段配置
const PHASES = {
    phase1: {
        name: '极端储蓄期',
        years: [0, 2],
        emoji: '⚡',
        color: '#ef4444',
        tips: [
            '控制非必要支出',
            '建立3-6个月应急基金',
            '关闭花呗/信用卡',
            '自己做饭，减少外卖'
        ]
    },
    phase2: {
        name: '复利加速期',
        years: [2, 5],
        emoji: '🚀',
        color: '#f59e0b',
        tips: [
            '开始指数基金定投',
            '提升年化收益至6%+',
            '提升职业技能加薪',
            '优化支出结构'
        ]
    },
    phase3: {
        name: '被动收入期',
        years: [5, 10],
        emoji: '💰',
        color: '#8b5cf6',
        tips: [
            '构建多元化收入',
            '被动收入覆盖50%支出',
            '考虑房产等实物投资',
            '降低投资风险'
        ]
    },
    phase4: {
        name: '躺平准备期',
        years: [10, 999],
        emoji: '🛋️',
        color: '#10b981',
        tips: [
            '资产配置优化',
            '建立风险对冲',
            '准备过渡方案',
            '心态调整'
        ]
    }
};

// 里程碑配置
const MILESTONES = {
    first10k: {
        name: '首个10万',
        emoji: '🎯',
        condition: (data) => data.currentSavings >= 100000
    },
    save50: {
        name: '储蓄率50%',
        emoji: '💰',
        condition: (data) => data.savingsRate >= 50
    },
    passive1k: {
        name: '被动收入过千',
        emoji: '📈',
        condition: (data) => data.monthlyPassiveIncome >= 1000
    },
    passive5k: {
        name: '被动收入过5千',
        emoji: '💵',
        condition: (data) => data.monthlyPassiveIncome >= 5000
    },
    halfway: {
        name: '达成50%',
        emoji: '🚀',
        condition: (data) => data.progress >= 50
    },
    fire: {
        name: '躺平达成',
        emoji: '🏆',
        condition: (data) => data.progress >= 100
    }
};


// 存款里程碑科普 - 每个阶段要忍住的消费
const SAVINGS_MILESTONES = [
    {
        amount: 10000,
        title: '1万',
        emoji: '🌱',
        warning: '忍住换新款手机',
        advice: '这个阶段最重要的目标是存下第一桶金',
        loss: '新手机一年贬值50%'
    },
    {
        amount: 30000,
        title: '3万',
        emoji: '🌿',
        warning: '忍住买奢侈品包包',
        advice: '建立应急基金，覆盖3-6个月支出',
        loss: '奢侈品二手价只有原价30%'
    },
    {
        amount: 50000,
        title: '5万',
        emoji: '🌲',
        warning: '忍住频繁旅游',
        advice: '开始学习投资理财知识',
        loss: '一次旅游花掉半年积蓄'
    },
    {
        amount: 100000,
        title: '10万',
        emoji: '🌳',
        warning: '忍住换新车',
        advice: '开始指数基金定投',
        loss: '新车落地贬值20%'
    },
    {
        amount: 200000,
        title: '20万',
        emoji: '🏔️',
        warning: '忍住买名牌手表',
        advice: '资产配置优化，提升年化收益',
        loss: '手表变现困难且折价大'
    },
    {
        amount: 300000,
        title: '30万',
        emoji: '⛰️',
        warning: '忍住换豪车',
        advice: '建立被动收入渠道',
        loss: '30万买车5年后只剩15万，储蓄却能变40万'
    },
    {
        amount: 500000,
        title: '50万',
        emoji: '🗻',
        warning: '忍住买投资性房产',
        advice: '被动收入覆盖30%支出',
        loss: '房产流动性差，且可能下跌'
    },
    {
        amount: 1000000,
        title: '100万',
        emoji: '🏆',
        warning: '忍住冲动消费',
        advice: '进入躺平倒计时',
        loss: '100万本金年化6%可产生6万被动收入'
    },
    {
        amount: 2000000,
        title: '200万',
        emoji: '👑',
        warning: '忍住加杠杆投资',
        advice: '稳健配置，守住胜利果实',
        loss: '杠杆可能让你一夜归零'
    },
    {
        amount: 5000000,
        title: '500万',
        emoji: '🌟',
        warning: '忍住奢侈生活',
        advice: '考虑躺平方式，享受生活',
        loss: '500万是很多城市的躺平及格线'
    }
];

// 消费对比警醒文案
const SAVING_COMPARISONS = [
    {
        icon: '🚗',
        title: '买车 vs 储蓄',
        bad: '30万买车，5年后价值15万',
        good: '30万储蓄，5年后价值40万（年化6%）',
        difference: '差距25万'
    },
    {
        icon: '🍜',
        title: '外卖 vs 带饭',
        bad: '每天50元外卖，5年花费9万',
        good: '带饭每天15元，5年花费2.7万',
        difference: '节省6.3万'
    },
    {
        icon: '🧋',
        title: '奶茶 vs 白水',
        bad: '每天25元奶茶，5年花费4.5万',
        good: '喝白水，0支出',
        difference: '节省4.5万'
    },
    {
        icon: '👗',
        title: '快时尚 vs 经典款',
        bad: '每月买快时尚，5年花费6万',
        good: '买经典款，5年花费1.5万',
        difference: '节省4.5万'
    },
    {
        icon: '🎮',
        title: '游戏氪金 vs 学习投资',
        bad: '每月游戏氪金500，5年花费3万',
        good: '投资学习提升技能，收入提升50%',
        difference: '一个花钱，一个赚钱'
    },
    {
        icon: '📱',
        title: '年年换手机 vs 3年一换',
        bad: '年年换旗舰机，5年花费4万',
        good: '3年换一次中端机，5年花费1万',
        difference: '节省3万'
    },
    {
        icon: '🚬',
        title: '抽烟 vs 戒烟',
        bad: '每天1包烟，5年花费3.6万',
        good: '戒烟，身体健康+存款增长',
        difference: '节省3.6万+健康无价'
    },
    {
        icon: '🎬',
        title: '电影会员 vs 图书馆',
        bad: '每月视频会员100，5年花费6000',
        good: '图书馆免费，还能提升认知',
        difference: '节省6000+认知提升'
    }
];

// 核心理念金句
const CORE_MESSAGES = [
    '不要为欲望买单，要为自由储蓄',
    '不要为懒惰买单，要为未来投资',
    '每一笔消费都是向躺平告别',
    '复利是世界第八大奇迹',
    '时间是复利最好的朋友',
    '延迟满足是最高级的自律',
    '存钱不是目的，自由才是',
    '财务自由从拒绝消费主义开始'
];
