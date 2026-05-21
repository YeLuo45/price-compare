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
    <div class="chart-container" v-if="chartData.length > 0">
      <div class="chart-title">历史价格走势</div>

      <!-- ECharts 折线图 -->
      <v-chart class="echarts-chart" :option="chartOption" autoresize />

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
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import { useProductStore } from '../stores/product'

// 注册ECharts组件
use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, DataZoomComponent, LegendComponent])

const route = useRoute()
const store = useProductStore()
const product = ref(null)
const historyData = ref([])
const isLoading = ref(false)

onMounted(async () => {
  if (route.query.product) {
    try {
      product.value = JSON.parse(route.query.product)
      await loadHistory()
    } catch (e) {
      console.error('解析商品信息失败', e)
    }
  }
})

const loadHistory = async () => {
  if (!product.value) return
  isLoading.value = true
  try {
    const history = await store.getPriceHistory(product.value.id)
    // 转换数据格式，添加日期
    historyData.value = history.map(h => ({
      ...h,
      date: dayjs(h.timestamp).format('YYYY-MM-DD HH:mm')
    }))
  } finally {
    isLoading.value = false
  }
}

// 计算属性
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

// ECharts 配置
const chartData = computed(() => historyData.value)

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      const param = params[0]
      return `${param.axisValue}<br/>价格: <strong>¥${param.value}</strong>`
    }
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '10%',
    bottom: '15%'
  },
  xAxis: {
    type: 'category',
    data: chartData.value.map(h => dayjs(h.timestamp).format('MM-DD HH:mm')),
    boundaryGap: false
  },
  yAxis: {
    type: 'value',
    name: '价格(元)',
    min: Math.min(...prices.value) * 0.95,
    max: Math.max(...prices.value) * 1.05
  },
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      type: 'slider',
      start: 0,
      end: 100
    }
  ],
  series: [
    {
      name: '价格',
      type: 'line',
      data: prices.value,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#1890ff',
        width: 2
      },
      itemStyle: {
        color: '#1890ff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ]
        }
      },
      markPoint: {
        data: [
          { type: 'min', name: '最低价' },
          { type: 'max', name: '最高价' }
        ]
      }
    }
  ]
}))
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

.echarts-chart {
  width: 100%;
  height: 300px;
  margin-bottom: 15px;
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

.platform-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  color: #fff;
}

.platform-taobao { background: #FF5000; }
.platform-tmall { background: #FF6A00; }
.platform-jd { background: #E1251B; }
.platform-pdd { background: #E13026; }
</style>
