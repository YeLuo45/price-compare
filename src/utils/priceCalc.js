/**
 * 价格计算工具
 */

/**
 * 计算价格走势
 * @param {Array} history - 价格历史 [{price, timestamp}]
 * @returns {Object} 走势数据
 */
export function calcPriceTrend(history) {
  if (!history || history.length < 2) {
    return { trend: 'stable', change: 0, changePercent: 0 }
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  const first = sorted[0].price
  const last = sorted[sorted.length - 1].price
  const change = last - first
  const changePercent = first > 0 ? ((change / first) * 100).toFixed(2) : 0

  let trend = 'stable'
  if (change > 0) trend = 'rising'
  else if (change < 0) trend = 'falling'

  return { trend, change, changePercent }
}

/**
 * 获取最低价
 */
export function getLowestPrice(history) {
  if (!history || history.length === 0) return null
  return Math.min(...history.map(h => h.price))
}

/**
 * 获取最高价
 */
export function getHighestPrice(history) {
  if (!history || history.length === 0) return null
  return Math.max(...history.map(h => h.price))
}

/**
 * 获取平均价
 */
export function getAveragePrice(history) {
  if (!history || history.length === 0) return null
  const sum = history.reduce((acc, h) => acc + h.price, 0)
  return (sum / history.length).toFixed(2)
}

/**
 * 格式化价格
 */
export function formatPrice(price) {
  if (price == null) return '--'
  return `¥${parseFloat(price).toFixed(2)}`
}

/**
 * 计算节省金额
 */
export function calcSavings(original, current) {
  if (!original || !current) return 0
  const diff = parseFloat(original) - parseFloat(current)
  return diff > 0 ? diff.toFixed(2) : 0
}

/**
 * 格式化销量
 */
export function formatSales(sales) {
  if (sales == null) return '--'
  if (sales >= 10000) return `${(sales / 10000).toFixed(1)}万`
  if (sales >= 1000) return `${(sales / 1000).toFixed(1)}k`
  return String(sales)
}

/**
 * 格式化时间戳
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN')
}
