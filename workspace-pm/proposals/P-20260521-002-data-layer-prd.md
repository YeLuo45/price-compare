# P-20260521-002 PRD: 数据层 - 爬虫/API架构 + 历史价格存储

## 1. 需求概述

为多平台比价App构建完整数据层，支持：
- 多平台商品数据爬取（淘宝/天猫/京东/拼多多）
- 平台官方API备用方案
- 历史价格持久化存储
- 价格监控与走势计算

## 2. 技术方案

### 2.1 数据层架构

```
src/
├── api/
│   ├── scrapers/           # 爬虫模块
│   │   ├── base.js         # 基础爬虫类
│   │   ├── taobao.js       # 淘宝/天猫爬虫
│   │   ├── jd.js           # 京东爬虫
│   │   └── pdd.js          # 拼多多爬虫
│   ├── clients/            # API客户端
│   │   ├── taobao.js       # 淘宝开放平台API
│   │   ├── jd.js           # 京东宙斯API
│   │   └── pdd.js          # 拼多多API
│   └── index.js            # 统一入口
├── stores/
│   ├── product.js           # 商品状态管理
│   └── priceHistory.js      # 价格历史管理
└── utils/
    ├── storage.js           # localStorage封装
    └── priceCalc.js         # 价格计算工具
```

### 2.2 爬虫策略

| 平台 | 爬取方式 | 难度 | 优先级 |
|------|----------|------|--------|
| 淘宝/天猫 | 搜索结果页DOM解析 | 中 | P0 |
| 京东 | 搜索结果页DOM解析 | 低 | P0 |
| 拼多多 | 搜索结果页DOM解析 | 高（SDK加密） | P1 |

### 2.3 数据模型

```javascript
// 商品基础信息
Product {
  id: string,
  platform: 'taobao' | 'tmall' | 'jd' | 'pdd',
  title: string,
  price: number,
  originalPrice: number,    // 划线价
  sales: number,            // 销量
  rating: number,           // 评分 0-5
  shop: { name, credibility },
  shipping: string,         // 发货地/快递
  url: string,
  image: string,
  updateTime: Date
}

// 价格历史记录
PriceRecord {
  productId: string,
  platform: string,
  price: number,
  timestamp: Date
}

// 监控任务
MonitorTask {
  id: string,
  keyword: string,
  platforms: string[],
  minPrice: number,
  maxPrice: number,
  interval: number,         // 监控间隔（分钟）
  enabled: boolean
}
```

### 2.4 存储策略

- **localStorage**: 监控任务、价格历史（最多500条）
- **历史数据格式**: 按 productId 分组，保留30天数据
- **过期清理**: 每次启动清理超过30天的记录

## 3. 实现计划

### Phase 1: 基础架构
- [ ] 创建数据层目录结构
- [ ] 实现 localStorage 封装
- [ ] 实现基础数据模型

### Phase 2: 爬虫模块
- [ ] 基础爬虫类（统一请求接口、错误处理）
- [ ] 淘宝/天猫爬虫（搜索 + 详情）
- [ ] 京东爬虫（搜索 + 详情）

### Phase 3: 价格历史
- [ ] 价格记录存储
- [ ] 历史价格查询
- [ ] 价格走势计算

## 4. 验收标准

1. 爬虫能在浏览器环境获取商品列表页数据
2. 价格历史正确存储到 localStorage
3. 历史查询返回正确的时间范围数据
4. 监控列表支持增删改查
