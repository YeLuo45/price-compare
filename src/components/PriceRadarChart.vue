<template>
  <div class="price-radar" v-if="prices.length > 0">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  prices: {
    type: Array,
    default: () => []
  },
  productTitle: {
    type: String,
    default: ''
  }
})

const chartRef = ref(null)
let chart = null

const SOURCE_NAMES = {
  jd: '京东',
  tmall: '天猫',
  pdd: '拼多多',
  taobao: '淘宝'
}

const SOURCE_COLORS = {
  jd: '#E1251B',
  tmall: '#FF6A00',
  pdd: '#E13026',
  taobao: '#FF5000'
}

function buildRadarData() {
  const sourcePrices = {}
  
  // 按来源分组
  props.prices.forEach(p => {
    if (!sourcePrices[p.sourceId]) {
      sourcePrices[p.sourceId] = []
    }
    sourcePrices[p.sourceId].push(p)
  })
  
  // 计算各来源的平均值
  const sources = Object.keys(sourcePrices)
  const indicators = [
    { name: '价格', max: Math.max(...props.prices.map(p => p.price)) * 1.2 },
    { name: '评分', max: 5 },
    { name: '发货', max: 5 }
  ]
  
  const radarSeries = sources.map(sourceId => {
    const sourceData = sourcePrices[sourceId]
    const avgPrice = sourceData.reduce((sum, p) => sum + p.price, 0) / sourceData.length
    const avgRating = sourceData.reduce((sum, p) => sum + (p.rating || 4), 0) / sourceData.length
    const avgShipping = sourceData.reduce((sum, p) => sum + (p.shippingSpeed || 3), 0) / sourceData.length
    
    // 归一化到0-1（价格取倒数，越低越好）
    const priceNorm = indicators[0].max > 0 ? (indicators[0].max - avgPrice) / indicators[0].max : 0
    const ratingNorm = avgRating / 5
    const shippingNorm = avgShipping / 5
    
    return {
      value: [
        Math.round(priceNorm * 100) / 100,
        Math.round(ratingNorm * 100) / 100,
        Math.round(shippingNorm * 100) / 100
      ],
      sourceId,
      sourceName: SOURCE_NAMES[sourceId] || sourceId,
      color: SOURCE_COLORS[sourceId] || '#999',
      raw: {
        price: avgPrice,
        rating: avgRating,
        shipping: avgShipping
      }
    }
  })
  
  return { indicators, radarSeries }
}

function initChart() {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chart) return
  
  const { indicators, radarSeries } = buildRadarData()
  
  const option = {
    title: {
      text: props.productTitle ? `多源比价 - ${props.productTitle}` : '多源比价雷达图',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (item) => {
        if (item.componentType === 'series') {
          const data = item.value
          const raw = radarSeries[item.dataIndex].raw
          return `
            <div style="font-size:12px">
              <div style="font-weight:bold;color:${item.color}">${item.name}</div>
              <div>价格: ¥${raw.price.toFixed(2)}</div>
              <div>评分: ${raw.rating.toFixed(1)}</div>
              <div>发货: ${raw.shipping.toFixed(1)}</div>
            </div>
          `
        }
        return ''
      }
    },
    legend: {
      data: radarSeries.map(s => s.sourceName),
      bottom: 0
    },
    radar: {
      indicator: indicators,
      radius: '60%'
    },
    series: [{
      type: 'radar',
      data: radarSeries.map((s, i) => ({
        value: s.value,
        name: s.sourceName,
        itemStyle: { color: s.color },
        lineStyle: { color: s.color },
        areaStyle: { color: s.color + '40' }
      }))
    }]
  }
  
  chart.setOption(option)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})

watch(() => props.prices, () => {
  updateChart()
}, { deep: true })
</script>

<style scoped>
.price-radar {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>