// 报告生成Agent
import { BaseAgent } from './BaseAgent.js'
import { comparePrices } from '@/utils/priceRouter.js'

export class ReporterAgent extends BaseAgent {
  constructor() {
    super('reporter')
  }

  // 生成比价报告
  generate(comparison) {
    const { productId, prices, bestPrice, savings, savingsPercent } = comparison

    const report = {
      id: `report-${Date.now()}`,
      title: `比价报告 - ${productId}`,
      summary: {
        totalSources: prices.length,
        bestSource: bestPrice?.sourceId || 'N/A',
        bestPrice: bestPrice?.price || 0,
        savings: savings.toFixed(2),
        savingsPercent: savingsPercent.toFixed(1)
      },
      details: prices.map(p => ({
        sourceId: p.sourceId,
        price: p.price,
        rating: p.rating,
        shippingSpeed: p.shippingSpeed,
        comparedToBest: ((p.price - (bestPrice?.price || 0)) / (bestPrice?.price || 1) * 100).toFixed(1)
      })),
      generatedAt: new Date().toISOString()
    }

    // 广播报告
    this.broadcast('report_generated', report)

    return report
  }

  // 生成价格走势报告
  generateTrendReport(productId, trend, predictions) {
    const report = {
      id: `trend-report-${Date.now()}`,
      title: `价格走势报告 - ${productId}`,
      trend,
      predictions,
      generatedAt: new Date().toISOString()
    }

    this.broadcast('report_generated', report)

    return report
  }

  // 处理消息
  handleMessage(message) {
    const { type, payload } = message

    if (type === 'analysis_result') {
      // 生成比价报告
      if (payload.comparison) {
        this.generate(payload.comparison)
      }
    }

    if (type === 'generate_report') {
      const { type: reportType, data } = payload
      
      if (reportType === 'comparison') {
        this.generate(data)
      } else if (reportType === 'trend') {
        this.generateTrendReport(data.productId, data.trend, data.predictions)
      }
    }
  }
}

// 单例
export const reporterAgent = new ReporterAgent()
export default reporterAgent