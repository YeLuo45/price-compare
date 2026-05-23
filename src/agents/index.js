// Agent导出和编排器
import { messageBus } from './MessageBus.js'
import { collectorAgent } from './CollectorAgent.js'
import { trendAnalystAgent } from './TrendAnalystAgent.js'
import { alertManagerAgent } from './AlertManagerAgent.js'
import { reporterAgent } from './ReporterAgent.js'

export {
  messageBus,
  collectorAgent,
  trendAnalystAgent,
  alertManagerAgent,
  reporterAgent
}

// Agent编排器
export class AgentOrchestrator {
  constructor() {
    this.agents = [
      collectorAgent,
      trendAnalystAgent,
      alertManagerAgent,
      reporterAgent
    ]
    this.running = false
  }

  // 启动所有Agent
  start() {
    if (this.running) return
    
    this.agents.forEach(agent => agent.start())
    this.running = true
    console.log('[Orchestrator] All agents started')
  }

  // 停止所有Agent
  stop() {
    if (!this.running) return
    
    this.agents.forEach(agent => agent.stop())
    this.running = false
    console.log('[Orchestrator] All agents stopped')
  }

  // 执行完整比价流程
  async runPriceComparison(keyword, productId) {
    // 1. Collector收集价格
    const prices = await collectorAgent.collect(productId, keyword)
    
    // 2. Analyst分析（会在收到price_data后自动触发，也可以手动调用）
    const analysis = trendAnalystAgent.runAnalysis(prices)
    
    // 3. AlertManager检查（同样自动触发）
    // 4. Reporter生成报告（同样自动触发）
    
    return {
      prices,
      analysis,
      timestamp: Date.now()
    }
  }

  // 获取Agent状态
  getStatus() {
    return this.agents.map(agent => ({
      agentId: agent.agentId,
      running: agent.unsubscribe !== null
    }))
  }
}

// 单例
export const orchestrator = new AgentOrchestrator()
export default orchestrator