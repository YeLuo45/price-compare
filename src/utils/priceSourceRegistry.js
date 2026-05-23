// Price Source Registry - 价格源注册中心
// 借鉴 nanobot Provider Registry + thunderbolt 离线优先架构

import { get, set, del } from 'idb-keyval'

// 价格源配置
export const PLATFORMS_CONFIG = [
  { id: 'jd', name: '京东', icon: '📦', color: '#E1251B', enabled: true, priority: 1, weight: { price: 0.4, rating: 0.3, shipping: 0.3 } },
  { id: 'tmall', name: '天猫', icon: '🏬', color: '#FF6A00', enabled: true, priority: 2, weight: { price: 0.3, rating: 0.4, shipping: 0.3 } },
  { id: 'pdd', name: '拼多多', icon: '📱', color: '#E13026', enabled: true, priority: 3, weight: { price: 0.5, rating: 0.2, shipping: 0.3 } },
  { id: 'taobao', name: '淘宝', icon: '🛒', color: '#FF5000', enabled: false, priority: 4, weight: { price: 0.4, rating: 0.2, shipping: 0.4 } }
]

const STORAGE_KEY = 'price_source_registry'

class PriceSourceRegistry {
  constructor() {
    this.sources = new Map()
    this.defaultSource = 'jd'
    this.initDefaultSources()
  }

  initDefaultSources() {
    PLATFORMS_CONFIG.forEach(config => {
      this.sources.set(config.id, { ...config })
    })
  }

  register(source) {
    this.sources.set(source.id, source)
    this.saveToStorage()
  }

  unregister(sourceId) {
    this.sources.delete(sourceId)
    this.saveToStorage()
  }

  get(sourceId) {
    return this.sources.get(sourceId)
  }

  list() {
    return Array.from(this.sources.values())
  }

  setEnabled(sourceId, enabled) {
    const source = this.sources.get(sourceId)
    if (source) {
      source.enabled = enabled
      this.saveToStorage()
    }
  }

  getActive() {
    return Array.from(this.sources.values())
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  getActiveIds() {
    return this.getActive().map(s => s.id)
  }

  setDefaultSource(sourceId) {
    if (this.sources.has(sourceId)) {
      this.defaultSource = sourceId
      this.saveToStorage()
    }
  }

  getDefaultSource() {
    return this.defaultSource
  }

  updateSource(sourceId, updates) {
    const source = this.sources.get(sourceId)
    if (source) {
      Object.assign(source, updates)
      this.saveToStorage()
    }
  }

  async loadFromStorage() {
    try {
      const saved = await get(STORAGE_KEY)
      if (saved && Array.isArray(saved)) {
        this.sources.clear()
        saved.forEach(s => this.sources.set(s.id, s))
      }
    } catch (e) {
      console.warn('Failed to load registry from IndexedDB:', e)
    }
  }

  async saveToStorage() {
    try {
      const data = Array.from(this.sources.values())
      await set(STORAGE_KEY, data)
    } catch (e) {
      console.warn('Failed to save registry to IndexedDB:', e)
    }
  }

  reset() {
    this.sources.clear()
    this.initDefaultSources()
    this.saveToStorage()
  }
}

export const priceSourceRegistry = new PriceSourceRegistry()
export default priceSourceRegistry