// 提醒管理Agent
import { BaseAgent } from './BaseAgent.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 提醒Store
export const useAlertStore = defineStore('alert', () => {
  const alerts = ref([])
  const rules = ref([])

  function addAlert(alert) {
    alerts.value.unshift(alert)
    if (alerts.value.length > 100) {
      alerts.value.pop()
    }
  }

  function addRule(rule) {
    rules.value.push(rule)
  }

  function removeRule(productId, platformId) {
    rules.value = rules.value.filter(
      r => !(r.productId === productId && r.platformId === platformId)
    )
  }

  function getRules(productId) {
    return rules.value.filter(r => r.productId === productId)
  }

  return { alerts, rules, addAlert, addRule, removeRule, getRules }
})

export class AlertManagerAgent extends BaseAgent {
  constructor() {
    super('alerter')
    this.alertStore = useAlertStore()
  }

  // 检查是否应该触发提醒
  shouldAlert(currentPrice, history, rule) {
    if (history.length < 2) return false

    const latest = history[history.length - 1].price
    const change = latest > 0 
      ? ((currentPrice - latest) / latest) * 100 
      : 0

    if (rule.direction === 'down' && change <= -rule.thresholdPercent) return true
    if (rule.direction === 'up' && change >= rule.thresholdPercent) return true
    if (rule.direction === 'both' && Math.abs(change) >= rule.thresholdPercent) return true

    return false
  }

  // 检查并触发提醒
  checkAndAlert(productId, currentPrice, history = []) {
    const rules = this.alertStore.getRules(productId)

    for (const rule of rules) {
      if (this.shouldAlert(currentPrice, history, rule)) {
        const latest = history[history.length - 1]
        const alert = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          platformId: rule.platformId,
          fromPrice: latest?.price || 0,
          toPrice: currentPrice,
          changePercent: ((currentPrice - (latest?.price || 0)) / (latest?.price || 1) * 100).toFixed(2),
          direction: rule.direction,
          timestamp: Date.now(),
          read: false
        }

        this.alertStore.addAlert(alert)
        this.sendTo('reporter', 'alert_triggered', alert)
        
        return alert
      }
    }

    return null
  }

  // 添加提醒规则
  addAlertRule(productId, platformId, thresholdPercent = 5, direction = 'down') {
    this.alertStore.addRule({
      productId,
      platformId,
      thresholdPercent,
      direction
    })
  }

  // 处理消息
  handleMessage(message) {
    const { type, payload } = message

    if (type === 'price_data') {
      const { productId, prices } = payload
      if (prices.length > 0) {
        const latest = prices[prices.length - 1]
        this.checkAndAlert(productId, latest.price, prices)
      }
    }

    if (type === 'add_rule') {
      const { productId, platformId, thresholdPercent, direction } = payload
      this.addAlertRule(productId, platformId, thresholdPercent, direction)
    }
  }
}

// 单例
export const alertManagerAgent = new AlertManagerAgent()
export default alertManagerAgent