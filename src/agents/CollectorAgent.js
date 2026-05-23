// 价格收集Agent
import { BaseAgent } from './BaseAgent.js'
import { priceSourceRegistry } from '@/utils/priceSourceRegistry.js'
import { useProductStore } from '@/stores/product.js'

export class CollectorAgent extends BaseAgent {
  constructor() {
    super('collector')
    this.store = useProductStore()
  }

  // 收集指定商品的多源价格
  async collect(productId, keyword) {
    const activeSources = priceSourceRegistry.getActiveIds()
    const results = []

    for (const sourceId of activeSources) {
      try {
        const prices = await this.fetchFromSource(sourceId, keyword)
        results.push(...prices)
      } catch (e) {
        console.warn(`Failed to fetch from ${sourceId}:`, e)
      }
    }

    // 广播价格数据
    this.broadcast('price_data', {
      productId,
      keyword,
      prices: results,
      timestamp: Date.now()
    })

    return results
  }

  // 从指定价格源获取数据
  async fetchFromSource(sourceId, keyword) {
    // 复用现有的scraper
    const scraperMap = {
      jd: this.store.scrapers?.jd,
      tmall: this.store.scrapers?.tmall,
      pdd: this.store.scrapers?.pdd,
      taobao: this.store.scrapers?.taobao
    }

    const scraper = scraperMap[sourceId]
    if (!scraper) return []

    try {
      const items = await scraper.search(keyword)
      return items.map(item => ({
        sourceId,
        productId: item.id,
        price: item.price,
        originalPrice: item.originalPrice,
        rating: item.rating,
        shippingSpeed: item.shippingSpeed || 3,
        updatedAt: new Date().toISOString()
      }))
    } catch (e) {
      return []
    }
  }

  // 处理消息
  handleMessage(message) {
    const { type, payload } = message

    if (type === 'collect_request') {
      this.collect(payload.productId, payload.keyword)
    }
  }
}

// 单例
export const collectorAgent = new CollectorAgent()
export default collectorAgent