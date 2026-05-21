import { defineStore } from 'pinia'

// 平台列表
export const PLATFORMS = [
  { id: 'taobao', name: '淘宝', color: '#ff5000' },
  { id: 'tmall', name: '天猫', color: '#ff0036' },
  { id: 'jd', name: '京东', color: '#c91623' },
  { id: 'pdd', name: '拼多多', color: '#e85525' }
]

// 模拟商品数据
function mockSearch(keyword) {
  const results = []
  PLATFORMS.forEach(platform => {
    const count = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < count; i++) {
      results.push({
        id: `${platform.id}_${Date.now()}_${i}`,
        platform: platform.id,
        platformName: platform.name,
        title: `${keyword} ${platform.name}商品${i + 1}`,
        price: (Math.random() * 500 + 10).toFixed(2),
        originalPrice: (Math.random() * 800 + 50).toFixed(2),
        sales: Math.floor(Math.random() * 10000),
        rating: (Math.random() * 2 + 3).toFixed(1),
        shopName: `${platform.name}旗舰店`,
        shopLevel: ['钻石', '皇冠', '金牌'][Math.floor(Math.random() * 3)],
        shippingAddress: ['浙江杭州', '广东广州', '上海', '江苏南京'][Math.floor(Math.random() * 4)],
        isOfficial: Math.random() > 0.5,
        url: `https://${platform.id}.com/item/${Date.now()}`
      })
    }
  })
  return results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
}

// 模拟历史价格
function mockPriceHistory(productId, days = 30) {
  const history = []
  const basePrice = Math.random() * 300 + 50
  let currentPrice = basePrice
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    currentPrice = currentPrice + (Math.random() * 20 - 10)
    history.push({
      date: date.toISOString().split('T')[0],
      price: currentPrice.toFixed(2)
    })
  }
  return history
}

export const useProductStore = defineStore('product', {
  state: () => ({
    searchResults: [],
    isSearching: false,
    lastKeyword: '',
    monitorList: [],
    priceHistory: {},
    sortBy: 'price_asc',
  }),
  
  getters: {
    sortedResults: (state) => {
      const results = [...state.searchResults]
      switch (state.sortBy) {
        case 'price_asc':
          return results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        case 'price_desc':
          return results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        case 'sales_desc':
          return results.sort((a, b) => b.sales - a.sales)
        case 'rating_desc':
          return results.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        default:
          return results
      }
    },
  },
  
  actions: {
    async search(keyword) {
      if (!keyword) return
      this.isSearching = true
      this.lastKeyword = keyword
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        this.searchResults = mockSearch(keyword)
      } finally {
        this.isSearching = false
      }
    },
    
    setSortBy(sort) {
      this.sortBy = sort
    },
    
    addToMonitor(product) {
      const exists = this.monitorList.find(p => p.id === product.id)
      if (!exists) {
        this.monitorList.push({
          ...product,
          addTime: new Date().toISOString(),
          lastPrice: product.price
        })
        this.saveMonitorList()
      }
    },
    
    removeFromMonitor(productId) {
      this.monitorList = this.monitorList.filter(p => p.id !== productId)
      this.saveMonitorList()
    },
    
    isMonitored(productId) {
      return this.monitorList.some(p => p.id === productId)
    },
    
    saveMonitorList() {
      localStorage.setItem('monitorList', JSON.stringify(this.monitorList))
    },
    
    loadMonitorList() {
      try {
        const data = localStorage.getItem('monitorList')
        if (data) {
          this.monitorList = JSON.parse(data)
        }
      } catch (e) {
        console.error('加载监控列表失败', e)
      }
    },
    
    async getPriceHistory(productId) {
      if (!this.priceHistory[productId]) {
        await new Promise(resolve => setTimeout(resolve, 500))
        this.priceHistory[productId] = mockPriceHistory(productId)
      }
      return this.priceHistory[productId]
    },
    
    async refreshMonitorPrices() {
      for (const product of this.monitorList) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const change = (Math.random() * 10 - 5).toFixed(2)
        product.lastPrice = (parseFloat(product.lastPrice) + parseFloat(change)).toFixed(2)
      }
      this.saveMonitorList()
    }
  }
})
