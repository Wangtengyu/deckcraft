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
