<template>
  <div class="page">
    <!-- 商品信息 -->
    <div class="product-info" v-if="product">
      <div class="info-header">
        <span :class="['platform-tag', `platform-${product.platform}`]">
          {{ product.platformName }}
        </span>
        <span class="shop-name">{{ product.shopName }}</span>
      </div>
      <div class="info-title">{{ product.title }}</div>
      <div class="info-price">
        当前价格: <span class="price">¥{{ product.price }}</span>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container" v-if="historyData.length > 0">
      <div class="chart-title">历史价格走势</div>
      
      <!-- 简化图表 -->
      <div class="chart">
        <div class="chart-text">
          <span>最近30天价格: ¥{{ minPrice }} ~ ¥{{ maxPrice }}</span>
        </div>
        <div class="price-line">
          <div 
            v-for="(item, index) in displayData" 
            :key="index"
            :class="['price-dot', { lowest: item.price == minPrice, highest: item.price == maxPrice }]"
            :style="{ left: (index / displayData.length * 100) + '%' }"
            :title="`${item.date}: ¥${item.price}`"
          ></div>
        </div>
        <div class="chart-labels">
          <span>{{ historyData[0]?.date }}</span>
          <span>{{ historyData[historyData.length - 1]?.date }}</span>
        </div>
      </div>
      
      <!-- 统计数据 -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">最低价</span>
          <span class="stat-value lowest">¥{{ minPrice }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最高价</span>
          <span class="stat-value highest">¥{{ maxPrice }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">均价</span>
          <span class="stat-value">¥{{ avgPrice }}</span>
        </div>
      </div>
      
      <!-- 历史记录列表 -->
      <div class="history-list">
        <div class="history-title">价格记录</div>
        <div 
          class="history-item"
          v-for="(item, index) in historyData.slice().reverse().slice(0, 10)" 
          :key="index"
        >
          <span class="history-date">{{ item.date }}</span>
          <span class="history-price" :class="{ lowest: item.price == minPrice, highest: item.price == maxPrice }">
            ¥{{ item.price }}
          </span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading" v-if="isLoading">
      <span>加载中...</span>
    </div>
    
    <!-- 无数据 -->
    <div class="empty" v-if="!isLoading && historyData.length === 0 && !product">
      <span>请从搜索或监控页面查看商品历史价格</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/product'

const route = useRoute()
const store = useProductStore()
const product = ref(null)
const historyData = ref([])
const isLoading = ref(false)

onMounted(() => {
  if (route.query.product) {
    try {
      product.value = JSON.parse(route.query.product)
      loadHistory()
    } catch (e) {
      console.error('解析商品信息失败', e)
    }
  }
})

const loadHistory = async () => {
  if (!product.value) return
  isLoading.value = true
  try {
    historyData.value = await store.getPriceHistory(product.value.id)
  } finally {
    isLoading.value = false
  }
}

const displayData = computed(() => {
  if (historyData.value.length <= 10) return historyData.value
  const step = Math.floor(historyData.value.length / 10)
  return historyData.value.filter((_, i) => i % step === 0).slice(0, 10)
})

const prices = computed(() => historyData.value.map(h => parseFloat(h.price)))

const minPrice = computed(() => {
  if (prices.value.length === 0) return '0'
  return Math.min(...prices.value).toFixed(2)
})

const maxPrice = computed(() => {
  if (prices.value.length === 0) return '0'
  return Math.max(...prices.value).toFixed(2)
})

const avgPrice = computed(() => {
  if (prices.value.length === 0) return '0'
  return (prices.value.reduce((a, b) => a + b, 0) / prices.value.length).toFixed(2)
})
</script>

<style scoped>
.page {
  padding: 10px;
}

.product-info {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.shop-name {
  font-size: 12px;
  color: #666;
}

.info-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.info-price {
  font-size: 14px;
  color: #666;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
}

.chart {
  margin-bottom: 15px;
}

.chart-text {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.price-line {
  position: relative;
  height: 30px;
  border-bottom: 1px solid #eee;
  margin: 0 10px;
}

.price-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #1890ff;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.price-dot.lowest { background: #52c41a; }
.price-dot.highest { background: #ff4d4f; }

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 11px;
  color: #999;
}

.stats {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 11px;
  color: #999;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.stat-value.lowest { color: #52c41a; }
.stat-value.highest { color: #ff4d4f; }

.history-list {
  margin-top: 15px;
}

.history-title {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.history-date {
  font-size: 12px;
  color: #666;
}

.history-price {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.history-price.lowest { color: #52c41a; }
.history-price.highest { color: #ff4d4f; }

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #999;
}
</style>
