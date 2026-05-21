<template>
  <div class="page">
    <!-- 刷新按钮 -->
    <div class="refresh-bar" v-if="store.monitorList.length > 0">
      <button class="refresh-btn" @click="handleRefresh" :disabled="isRefreshing">
        {{ isRefreshing ? '刷新中...' : '刷新价格' }}
      </button>
    </div>

    <!-- 空状态 -->
    <div class="empty" v-if="store.monitorList.length === 0">
      <span>监控列表为空</span>
      <span class="empty-hint">在搜索页面添加商品到监控</span>
    </div>

    <!-- 监控列表 -->
    <div class="monitor-list" v-else>
      <div 
        class="monitor-item" 
        v-for="item in store.monitorList" 
        :key="item.id"
      >
        <div class="item-header">
          <span :class="['platform-tag', `platform-${item.platform}`]">
            {{ item.platformName }}
          </span>
          <span class="shop-name">{{ item.shopName }}</span>
        </div>
        
        <div class="item-title">{{ item.title }}</div>
        
        <div class="price-info">
          <div class="current-price">
            <span class="label">当前价格</span>
            <span class="price">¥{{ item.lastPrice || item.price }}</span>
          </div>
          <div class="original-price" v-if="item.originalPrice !== item.price">
            <span class="label">原价</span>
            <span class="price-old">¥{{ item.originalPrice }}</span>
          </div>
          <div class="price-change" v-if="priceChanges[item.id]">
            <span :class="priceChanges[item.id] > 0 ? 'up' : 'down'">
              {{ priceChanges[item.id] > 0 ? '↑' : '↓' }}¥{{ Math.abs(priceChanges[item.id]).toFixed(2) }}
            </span>
          </div>
        </div>
        
        <div class="item-meta">
          <span>加入时间: {{ formatTime(item.addTime) }}</span>
        </div>
        
        <div class="item-actions">
          <button class="action-btn secondary" @click="viewHistory(item)">历史价格</button>
          <button class="action-btn danger" @click="removeItem(item.id)">移除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useProductStore } from '../stores/product'
import { useRouter } from 'vue-router'

const store = useProductStore()
const router = useRouter()
const isRefreshing = ref(false)
const priceChanges = ref({})

const handleRefresh = async () => {
  isRefreshing.value = true
  const oldPrices = {}
  store.monitorList.forEach(p => {
    oldPrices[p.id] = parseFloat(p.lastPrice || p.price)
  })
  
  await store.refreshMonitorPrices()
  
  store.monitorList.forEach(p => {
    const newPrice = parseFloat(p.lastPrice || p.price)
    const oldPrice = oldPrices[p.id]
    priceChanges.value[p.id] = newPrice - oldPrice
  })
  
  isRefreshing.value = false
  alert('刷新完成')
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const viewHistory = (item) => {
  router.push({ path: '/history', query: { product: JSON.stringify(item) } })
}

const removeItem = (id) => {
  if (confirm('确定从监控列表移除？')) {
    store.removeFromMonitor(id)
    alert('已移除')
  }
}
</script>

<style scoped>
.page {
  padding: 10px;
}

.refresh-bar {
  margin-bottom: 10px;
}

.refresh-btn {
  width: 100%;
  height: 40px;
  background: #fff;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.6;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px;
  color: #999;
}

.empty-hint {
  font-size: 12px;
  margin-top: 10px;
}

.monitor-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.monitor-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.shop-name {
  font-size: 12px;
  color: #666;
}

.item-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}

.current-price, .original-price {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 11px;
  color: #999;
}

.price {
  font-size: 18px;
  color: #ff4d4f;
  font-weight: bold;
}

.price-old {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.price-change {
  font-size: 14px;
  font-weight: bold;
}

.price-change .up { color: #ff4d4f; }
.price-change .down { color: #52c41a; }

.item-meta {
  font-size: 11px;
  color: #999;
  margin-bottom: 10px;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
}

.action-btn.secondary {
  background: #fff;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.action-btn.danger {
  background: #fff;
  color: #999;
  border: 1px solid #ddd;
}
</style>
