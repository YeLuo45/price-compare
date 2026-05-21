/**
 * localStorage 封装
 * 支持过期清理、最大条数限制
 */
const MAX_RECORDS = 500
const EXPIRE_DAYS = 30

export const storage = {
  /**
   * 保存价格记录
   */
  savePriceRecord(record) {
    const key = `price_history_${record.productId}`
    const history = this.getPriceHistory(record.productId)

    history.push({
      price: record.price,
      timestamp: Date.now()
    })

    // 限制条数
    if (history.length > MAX_RECORDS) {
      history.splice(0, history.length - MAX_RECORDS)
    }

    localStorage.setItem(key, JSON.stringify(history))
  },

  /**
   * 获取商品价格历史
   */
  getPriceHistory(productId) {
    const key = `price_history_${productId}`
    const data = localStorage.getItem(key)
    if (!data) return []

    try {
      const history = JSON.parse(data)
      // 清理过期数据
      const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
      return history.filter(r => r.timestamp > cutoff)
    } catch {
      return []
    }
  },

  /**
   * 获取所有监控任务
   */
  getMonitorTasks() {
    const data = localStorage.getItem('monitor_tasks')
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  },

  /**
   * 保存监控任务
   */
  saveMonitorTasks(tasks) {
    localStorage.setItem('monitor_tasks', JSON.stringify(tasks))
  },

  /**
   * 添加监控任务
   */
  addMonitorTask(task) {
    const tasks = this.getMonitorTasks()
    task.id = `monitor_${Date.now()}`
    tasks.push(task)
    this.saveMonitorTasks(tasks)
    return task
  },

  /**
   * 删除监控任务
   */
  deleteMonitorTask(taskId) {
    const tasks = this.getMonitorTasks()
    const filtered = tasks.filter(t => t.id !== taskId)
    this.saveMonitorTasks(filtered)
  },

  /**
   * 更新监控任务
   */
  updateMonitorTask(taskId, updates) {
    const tasks = this.getMonitorTasks()
    const index = tasks.findIndex(t => t.id === taskId)
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...updates }
      this.saveMonitorTasks(tasks)
    }
  },

  /**
   * 清理所有过期数据
   */
  cleanup() {
    const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
    const keys = Object.keys(localStorage).filter(k => k.startsWith('price_history_'))

    for (const key of keys) {
      try {
        const history = JSON.parse(localStorage.getItem(key) || '[]')
        const filtered = history.filter(r => r.timestamp > cutoff)
        if (filtered.length === 0) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(filtered))
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
  }
}

// 启动时清理
if (typeof window !== 'undefined') {
  storage.cleanup()
}
