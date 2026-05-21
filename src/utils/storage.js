/**
 * 存储封装 - IndexedDB优先，LocalStorage降级
 * 使用 idb-keyval 实现 IndexedDB 存储
 */
import { get, set, del, keys, clear } from 'idb-keyval'

const MAX_RECORDS = 500
const EXPIRE_DAYS = 30

// IndexedDB存储前缀
const PRICE_HISTORY_PREFIX = 'price_history_'
const MONITOR_LIST_KEY = 'monitor_list'

// 尝试使用IndexedDB，失败则降级到localStorage
let useIndexedDB = true

async function initStorage() {
  try {
    // 测试IndexedDB是否可用
    await set('__test__', 'test')
    await del('__test__')
    useIndexedDB = true
  } catch (e) {
    console.warn('IndexedDB不可用，降级到LocalStorage:', e)
    useIndexedDB = false
  }
}

initStorage()

// 延迟执行，确保initStorage完成
const storage = {
  /**
   * 保存价格历史记录
   */
  async savePriceHistory(productId, price) {
    const key = PRICE_HISTORY_PREFIX + productId
    const record = {
      price,
      timestamp: Date.now()
    }

    if (useIndexedDB) {
      try {
        const history = await this.getPriceHistory(productId)
        history.push(record)
        // 限制条数
        if (history.length > MAX_RECORDS) {
          history.splice(0, history.length - MAX_RECORDS)
        }
        await set(key, history)
      } catch (e) {
        console.warn('IndexedDB保存失败，降级到LocalStorage:', e)
        this.savePriceHistoryFallback(productId, record)
      }
    } else {
      this.savePriceHistoryFallback(productId, record)
    }
  },

  savePriceHistoryFallback(productId, record) {
    const key = PRICE_HISTORY_PREFIX + productId
    const history = this.getPriceHistoryFallback(productId)
    history.push(record)
    if (history.length > MAX_RECORDS) {
      history.splice(0, history.length - MAX_RECORDS)
    }
    localStorage.setItem(key, JSON.stringify(history))
  },

  getPriceHistoryFallback(productId) {
    const key = PRICE_HISTORY_PREFIX + productId
    const data = localStorage.getItem(key)
    if (!data) return []
    try {
      const history = JSON.parse(data)
      const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
      return history.filter(r => r.timestamp > cutoff)
    } catch {
      return []
    }
  },

  /**
   * 获取商品价格历史
   */
  async getPriceHistory(productId) {
    const key = PRICE_HISTORY_PREFIX + productId

    if (useIndexedDB) {
      try {
        const history = await get(key)
        if (!history) return []
        // 清理过期数据
        const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000
        return history.filter(r => r.timestamp > cutoff)
      } catch (e) {
        console.warn('IndexedDB读取失败，降级到LocalStorage:', e)
        return this.getPriceHistoryFallback(productId)
      }
    } else {
      return this.getPriceHistoryFallback(productId)
    }
  },

  /**
   * 保存监控列表
   */
  async saveMonitorList(list) {
    if (useIndexedDB) {
      try {
        await set(MONITOR_LIST_KEY, list)
      } catch (e) {
        console.warn('IndexedDB保存监控列表失败，降级到LocalStorage:', e)
        localStorage.setItem(MONITOR_LIST_KEY, JSON.stringify(list))
      }
    } else {
      localStorage.setItem(MONITOR_LIST_KEY, JSON.stringify(list))
    }
  },

  /**
   * 获取监控列表
   */
  async getMonitorList() {
    if (useIndexedDB) {
      try {
        const list = await get(MONITOR_LIST_KEY)
        return list || []
      } catch (e) {
        console.warn('IndexedDB获取监控列表失败，降级到LocalStorage:', e)
        return this.getMonitorListFallback()
      }
    } else {
      return this.getMonitorListFallback()
    }
  },

  getMonitorListFallback() {
    const data = localStorage.getItem(MONITOR_LIST_KEY)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  },

  // 兼容旧API - 保存价格记录（单个）
  async savePriceRecord(record) {
    await this.savePriceHistory(record.productId, record.price)
  },

  // 兼容旧API - 获取监控任务
  getMonitorTasks() {
    // 同步接口返回空数组，实际数据通过getMonitorList异步获取
    return []
  },

  // 兼容旧API - 保存监控任务
  saveMonitorTasks(tasks) {
    this.saveMonitorList(tasks)
  },

  // 兼容旧API - 添加监控任务
  addMonitorTask(task) {
    task.id = `monitor_${Date.now()}`
    return task
  },

  // 兼容旧API - 删除监控任务
  deleteMonitorTask(taskId) {
    // 实际删除逻辑在store中处理
  },

  // 兼容旧API - 更新监控任务
  updateMonitorTask(taskId, updates) {
    // 实际更新逻辑在store中处理
  },

  /**
   * 清理所有过期数据
   */
  async cleanup() {
    const cutoff = Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000

    if (useIndexedDB) {
      try {
        const allKeys = await keys()
        for (const key of allKeys) {
          if (key.startsWith(PRICE_HISTORY_PREFIX)) {
            const history = await get(key)
            if (history) {
              const filtered = history.filter(r => r.timestamp > cutoff)
              if (filtered.length === 0) {
                await del(key)
              } else {
                await set(key, filtered)
              }
            }
          }
        }
      } catch (e) {
        console.warn('IndexedDB清理失败:', e)
      }
    } else {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(PRICE_HISTORY_PREFIX))
      for (const key of allKeys) {
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
}

// 启动时清理
if (typeof window !== 'undefined') {
  storage.cleanup()
}

export { storage }
