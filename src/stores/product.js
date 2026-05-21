import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TaobaoScraper, TmallScraper } from '@/api/scrapers/taobao.js'
import { JdScraper } from '@/api/scrapers/jd.js'
import { PddScraper } from '@/api/scrapers/pdd.js'
import { storage } from '@/utils/storage.js'
import { calcPriceTrend, getLowestPrice, getHighestPrice, getAveragePrice } from '@/utils/priceCalc.js'

export const PLATFORMS = [
  { id: 'taobao', name: '淘宝', icon: '🛒', color: '#FF5000' },
  { id: 'tmall', name: '天猫', icon: '🏬', color: '#FF6A00' },
  { id: 'jd', name: '京东', icon: '📦', color: '#E1251B' },
  { id: 'pdd', name: '拼多多', icon: '📱', color: '#E13026' }
]

// 随机延迟 200-500ms
function randomDelay() {
  return new Promise(resolve => {
    const delay = 200 + Math.random() * 300
    setTimeout(resolve, delay)
  })
}

// 随机价格波动 ±5%
function randomPriceFluctuation(price) {
  const fluctuation = 0.95 + Math.random() * 0.1 // 0.95 ~ 1.05
  return Math.round(price * fluctuation * 100) / 100
}

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref([])
  const loading = ref(false)
  const searchHistory = ref([])
  const monitorTasks = ref([])
  const priceHistory = ref([]) // 价格历史记录数组

  // Scraper instances
  const scrapers = {
    taobao: new TaobaoScraper('taobao'),
    tmall: new TmallScraper('tmall'),
    jd: new JdScraper(),
    pdd: new PddScraper()
  }

  // Computed
  const hasProducts = computed(() => products.value.length > 0)

  // Actions
  async function searchProducts(keyword, platforms = ['taobao', 'tmall', 'jd', 'pdd']) {
    loading.value = true
    products.value = []

    try {
      // 模拟真实API延迟
      await randomDelay()

      const results = await Promise.allSettled(
        platforms.map(async (platform) => {
          const scraper = scrapers[platform]
          if (!scraper) return []

          // 模拟网络延迟（每个平台独立延迟）
          await randomDelay()

          const items = await scraper.search(keyword)

          // 应用随机价格波动（模拟真实价格变化）
          const fluctuatedItems = items.map(item => ({
            ...item,
            price: randomPriceFluctuation(item.price),
            originalPrice: randomPriceFluctuation(item.originalPrice)
          }))

          // 保存价格记录到IndexedDB/LocalStorage
          for (const item of fluctuatedItems) {
            await storage.savePriceHistory(item.id, item.price)
          }

          return fluctuatedItems
        })
      )

      products.value = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)

      // Save search history
      if (!searchHistory.value.includes(keyword)) {
        searchHistory.value.unshift(keyword)
        if (searchHistory.value.length > 10) searchHistory.value.pop()
        localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
      }

      return products.value
    } finally {
      loading.value = false
    }
  }

  async function getPriceHistory(productId) {
    const history = await storage.getPriceHistory(productId)
    priceHistory.value = history
    return history
  }

  function getProductTrend(productId) {
    return storage.getPriceHistory(productId).then(history => calcPriceTrend(history))
  }

  function getProductStats(productId) {
    return storage.getPriceHistory(productId).then(history => {
      return {
        lowest: getLowestPrice(history),
        highest: getHighestPrice(history),
        average: getAveragePrice(history),
        trend: calcPriceTrend(history)
      }
    })
  }

  // Monitor tasks
  async function loadMonitorTasks() {
    const tasks = await storage.getMonitorList()
    monitorTasks.value = tasks
    return tasks
  }

  async function addMonitorTask(task) {
    const newTask = await storage.addMonitorTask(task)
    monitorTasks.value.push(newTask)
    await storage.saveMonitorList(monitorTasks.value)
    return newTask
  }

  async function deleteMonitorTask(taskId) {
    monitorTasks.value = monitorTasks.value.filter(t => t.id !== taskId)
    await storage.saveMonitorList(monitorTasks.value)
  }

  async function updateMonitorTask(taskId, updates) {
    const index = monitorTasks.value.findIndex(t => t.id === taskId)
    if (index >= 0) {
      monitorTasks.value[index] = { ...monitorTasks.value[index], ...updates }
      await storage.saveMonitorList(monitorTasks.value)
    }
  }

  // Initialize
  function init() {
    const saved = localStorage.getItem('search_history')
    if (saved) {
      try { searchHistory.value = JSON.parse(saved) } catch {}
    }
    loadMonitorTasks()
  }

  init()

  return {
    products, loading, searchHistory, monitorTasks, hasProducts, priceHistory,
    searchProducts, getPriceHistory, getProductTrend, getProductStats,
    loadMonitorTasks, addMonitorTask, deleteMonitorTask, updateMonitorTask, PLATFORMS
  }
})
