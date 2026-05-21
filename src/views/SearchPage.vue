<template>
  <div class="page">
    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        class="search-input" 
        v-model="keyword" 
        placeholder="输入商品名称搜索..."
        @keyup.enter="handleSearch"
      />
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>

    <!-- 排序选项 -->
    <div class="sort-bar" v-if="store.searchResults.length > 0">
      <span class="sort-label">排序：</span>
      <div class="sort-options">
        <span 
          v-for="option in sortOptions" 
          :key="option.value"
          :class="['sort-item', { active: store.sortBy === option.value }]"
          @click="handleSort(option.value)"
        >{{ option.label }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading" v-if="store.isSearching">
      <span>搜索中...</span>
    </div>

    <!-- 无结果 -->
    <div class="empty" v-else-if="store.searchResults.length === 0 && hasSearched">
      <span>未找到相关商品</span>
    </div>

    <!-- 搜索结果列表 -->
    <div class="result-list" v-else>
      <div 
        class="result-item" 
        v-for="item in store.sortedResults" 
        :key="item.id"
      >
        <div class="item-header">
          <span :class="['platform-tag', `platform-${item.platform}`]">
            {{ item.platformName }}
          </span>
          <span class="shop-name">{{ item.shopName }}</span>
          <span v-if="item.isOfficial" class="official-tag">官方</span>
        </div>
        
        <div class="item-title">{{ item.title }}</div>
        
        <div class="item-info">
          <div class="price-row">
            <span class="price">¥{{ item.price }}</span>
            <span class="original-price" v-if="item.originalPrice !== item.price">
              ¥{{ item.originalPrice }}
            </span>
          </div>
          <div class="meta-row">
            <span class="sales">销量: {{ formatSales(item.sales) }}</span>
            <span class="rating">评分: {{ item.rating }}</span>
          </div>
          <div class="shipping-row">
            <span class="shipping">发货: {{ item.shippingAddress }}</span>
            <span class="shop-level">{{ item.shopLevel }}</span>
          </div>
        </div>
        
        <div class="item-actions">
          <button 
            :class="['action-btn', { 'active': store.isMonitored(item.id) }]"
            @click="toggleMonitor(item)"
          >
            {{ store.isMonitored(item.id) ? '已监控' : '加入监控' }}
          </button>
          <button class="action-btn secondary" @click="viewHistory(item)">历史价格</button>
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
const keyword = ref('')
const hasSearched = ref(false)

const sortOptions = [
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' },
  { label: '销量', value: 'sales_desc' },
  { label: '评分', value: 'rating_desc' }
]

const handleSearch = () => {
  if (!keyword.value.trim()) return
  hasSearched.value = true
  store.search(keyword.value)
}

const handleSort = (sort) => {
  store.setSortBy(sort)
}

const formatSales = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const toggleMonitor = (item) => {
  if (store.isMonitored(item.id)) {
    store.removeFromMonitor(item.id)
    alert('已取消监控')
  } else {
    store.addToMonitor(item)
    alert('已加入监控')
  }
}

const viewHistory = (item) => {
  router.push({ path: '/history', query: { product: JSON.stringify(item) } })
}
</script>

<style scoped>
.page {
  padding: 10px;
}

.search-box {
  display: flex;
  gap: 10px;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
}

.search-input {
  flex: 1;
  height: 40px;
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #ff4d4f;
}

.search-btn {
  width: 70px;
  height: 40px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.sort-bar {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  margin-top: 10px;
  border-radius: 8px;
}

.sort-label {
  font-size: 13px;
  color: #666;
}

.sort-options {
  display: flex;
  gap: 15px;
  margin-left: 10px;
}

.sort-item {
  font-size: 13px;
  color: #666;
  padding: 4px 8px;
  cursor: pointer;
}

.sort-item.active {
  color: #ff4d4f;
  font-weight: bold;
}

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #999;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.result-item {
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

.official-tag {
  font-size: 10px;
  color: #fff;
  background: #fa8c16;
  padding: 1px 4px;
  border-radius: 2px;
}

.item-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-info {
  margin-bottom: 10px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
}

.price {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: bold;
}

.original-price {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}

.meta-row, .shipping-row {
  display: flex;
  gap: 15px;
  margin-bottom: 3px;
}

.sales, .rating, .shipping, .shop-level {
  font-size: 12px;
  color: #666;
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
  background: #ff4d4f;
  color: #fff;
  border: none;
  cursor: pointer;
}

.action-btn.secondary {
  background: #fff;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.action-btn.active {
  background: #fa8c16;
}
</style>
