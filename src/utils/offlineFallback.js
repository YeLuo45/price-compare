// Offline Fallback - 离线降级策略
// 优先级: IndexedDB > localStorage > Mock数据

import { get, set, del } from 'idb-keyval'

const CACHE_PREFIX = 'price_cache_'
const CACHE_EXPIRY = 30 * 60 * 1000  // 30分钟缓存有效期

export async function getCachedPrice(productId) {
  try {
    const key = CACHE_PREFIX + productId
    const cached = await get(key)
    
    if (!cached) {
      return getFromLocalStorage(productId)
    }
    
    const now = Date.now()
    if (now - cached.cachedAt > CACHE_EXPIRY) {
      await del(key)
      return null
    }
    
    return cached
  } catch (e) {
    return getFromLocalStorage(productId)
  }
}

function getFromLocalStorage(productId) {
  try {
    const key = CACHE_PREFIX + productId
    const saved = localStorage.getItem(key)
    if (!saved) return null
    
    const cached = JSON.parse(saved)
    const now = Date.now()
    
    if (now - cached.cachedAt > CACHE_EXPIRY) {
      localStorage.removeItem(key)
      return null
    }
    
    return cached
  } catch (e) {
    return null
  }
}

export async function setCachedPrice(cachedPrice) {
  const key = CACHE_PREFIX + cachedPrice.productId
  const data = { ...cachedPrice, cachedAt: Date.now() }
  
  try {
    await set(key, data)
  } catch (e) {
    // 降级到localStorage
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (localError) {
      console.warn('Failed to cache price:', localError)
    }
  }
}

export async function deleteCachedPrice(productId) {
  const key = CACHE_PREFIX + productId
  
  try {
    await del(key)
  } catch (e) {}
  
  localStorage.removeItem(key)
}

export async function getCachedPrices(productIds) {
  const result = new Map()
  
  await Promise.all(
    productIds.map(async (productId) => {
      const cached = await getCachedPrice(productId)
      if (cached) {
        result.set(productId, [cached])
      }
    })
  )
  
  return result
}

export function isOnline() {
  return navigator.onLine
}

export function onNetworkChange(callback) {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

export async function cleanExpiredCache() {
  let cleaned = 0
  const now = Date.now()
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const cached = JSON.parse(data)
            if (now - cached.cachedAt > CACHE_EXPIRY) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
        } catch {}
      }
    }
  } catch (e) {}
  
  return cleaned
}