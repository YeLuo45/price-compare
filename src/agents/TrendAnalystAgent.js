// 价格走势分析Agent
import { BaseAgent } from './BaseAgent.js'
import { selectBestPrice, comparePrices } from '@/utils/priceRouter.js'

export class TrendAnalystAgent extends BaseAgent {
  constructor() {
    super('analyst')
  }

  // 分析价格走势
  analyze(prices) {
    if (!prices || prices.length === 0) return null

    // 按时间排序
    const sorted = [...prices].sort((a, b) => 
      new Date(a.updatedAt) - new Date(b.updatedAt)
    )

    const firstPrice = sorted[0]?.price || 0
    const lastPrice = sorted[sorted.length - 1]?.price || 0
    const change = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

    // 计算统计值
    const priceValues = sorted.map(p => p.price)
    const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length
    const minPrice = Math.min(...priceValues)
    const maxPrice = Math.max(...priceValues)

    const trend = {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      changePercent: change.toFixed(2),
      avgPrice,
      minPrice,
      maxPrice,
      dataPoints: sorted.length
    }

    return trend
  }

  // 预测未来价格（简单移动平均）
  predict(historicalPrices, days = 3) {
    if (!historicalPrices || historicalPrices.length < 3) {
      return []
    }

    const prices = historicalPrices.map(p => p.price)
    const windowSize = Math.min(7, Math.floor(prices.length / 2))
    const predictions = []

    for (let i = 0; i < days; i++) {
      const window = prices.slice(-windowSize - i, -i || undefined)
      const avg = window.reduce((a, b) => a + b, 0) / window.length
      predictions.push({
        day: i + 1,
        price: Math.round(avg * 100) / 100,
        confidence: Math.max(0.3, 1 - (i + 1) * 0.2)
      })
    }

    return predictions
  }

  // 执行完整分析流程
  runAnalysis(prices) {
    const trend = this.analyze(prices)
    const predictions = this.predict(prices)
    const bestPrice = selectBestPrice(prices, { preferLowestPrice: true })
    const comparison = comparePrices(new Map([['all', prices]]))

    const result = {
      trend,
      predictions,
      bestPrice,
      comparison: comparison[0],
      timestamp: Date.now()
    }

    // 广播分析结果
    this.broadcast('analysis_result', result)

    return result
  }

  // 处理消息
  handleMessage(message) {
    const { type, payload } = message

    if (type === 'price_data') {
      // 接收价格数据，自动分析
      this.runAnalysis(payload.prices)
    }

    if (type === 'analyze_request') {
      this.runAnalysis(payload.prices)
    }
  }
}

// 单例
export const trendAnalystAgent = new TrendAnalystAgent()
export default trendAnalystAgent