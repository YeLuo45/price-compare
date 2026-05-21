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

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref([])
  const loading = ref(false)
  const searchHistory = ref([])
  const monitorTasks = ref([])

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
      const results = await Promise.allSettled(
        platforms.map(async (platform) => {
          const scraper = scrapers[platform]
          if (!scraper) return []
          const items = await scraper.search(keyword)
          // Save price records for each product
          items.forEach(item => {
            storage.savePriceRecord({
              productId: item.id,
              price: item.price
            })
          })
          return items
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

  function getPriceHistory(productId) {
    return storage.getPriceHistory(productId)
  }

  function getProductTrend(productId) {
    const history = storage.getPriceHistory(productId)
    return calcPriceTrend(history)
  }

  function getProductStats(productId) {
    const history = storage.getPriceHistory(productId)
    return {
      lowest: getLowestPrice(history),
      highest: getHighestPrice(history),
      average: getAveragePrice(history),
      trend: calcPriceTrend(history)
    }
  }

  // Monitor tasks
  function loadMonitorTasks() {
    monitorTasks.value = storage.getMonitorTasks()
    return monitorTasks.value
  }

  function addMonitorTask(task) {
    const newTask = storage.addMonitorTask(task)
    monitorTasks.value.push(newTask)
    return newTask
  }

  function deleteMonitorTask(taskId) {
    storage.deleteMonitorTask(taskId)
    monitorTasks.value = monitorTasks.value.filter(t => t.id !== taskId)
  }

  function updateMonitorTask(taskId, updates) {
    storage.updateMonitorTask(taskId, updates)
    const index = monitorTasks.value.findIndex(t => t.id === taskId)
    if (index >= 0) {
      monitorTasks.value[index] = { ...monitorTasks.value[index], ...updates }
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
    products, loading, searchHistory, monitorTasks, hasProducts,
    searchProducts, getPriceHistory, getProductTrend, getProductStats,
    loadMonitorTasks, addMonitorTask, deleteMonitorTask, updateMonitorTask, PLATFORMS
  }
})
