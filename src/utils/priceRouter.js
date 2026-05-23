// Price Router - 动态路由
// 根据配置权重自动选择最优价格源

export function selectBestPrice(prices, criteria = { preferLowestPrice: true }) {
  if (!prices || prices.length === 0) return null
  
  if (criteria.preferLowestPrice) {
    return prices.reduce((best, current) => 
      current.price < best.price ? current : best
    )
  }
  
  if (criteria.preferHighestRating) {
    return prices.reduce((best, current) => 
      (current.rating || 0) > (best.rating || 0) ? current : best
    )
  }
  
  if (criteria.preferFastestShipping) {
    return prices.reduce((best, current) => 
      (current.shippingSpeed || 0) > (best.shippingSpeed || 0) ? current : best
    )
  }
  
  return prices.reduce((best, current) => 
    current.price < best.price ? current : best
  )
}

export function selectByWeights(prices, weights) {
  if (!prices || prices.length === 0) return null
  
  const priceScore = p => p.price > 0 ? 1 / p.price : 0
  const ratingScore = p => (p.rating || 0) / 5
  const shippingScore = p => (p.shippingSpeed || 3) / 5
  
  return prices.reduce((best, current) => {
    const score = p => 
      weights.price * priceScore(p) +
      weights.rating * ratingScore(p) +
      weights.shipping * shippingScore(p)
    return score(current) > score(best) ? current : best
  })
}

export function comparePrices(productPrices) {
  const results = []
  
  productPrices.forEach((prices, productId) => {
    const bestPrice = selectBestPrice(prices, { preferLowestPrice: true })
    const highestPrice = prices.reduce((max, p) => p.price > max ? p.price : max, 0)
    
    results.push({
      productId,
      prices,
      bestPrice,
      savings: highestPrice - (bestPrice?.price || 0),
      savingsPercent: highestPrice > 0 
        ? ((highestPrice - (bestPrice?.price || 0)) / highestPrice) * 100 
        : 0
    })
  })
  
  return results
}

export function groupBySource(prices) {
  const groups = new Map()
  
  prices.forEach(price => {
    const existing = groups.get(price.sourceId) || []
    existing.push(price)
    groups.set(price.sourceId, existing)
  })
  
  return groups
}