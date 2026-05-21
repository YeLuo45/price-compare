<template>
  <div id="app">
    <router-view />
    
    <!-- 底部Tab -->
    <nav class="tab-bar">
      <router-link 
        v-for="tab in tabs" 
        :key="tab.path"
        :to="tab.path"
        :class="['tab-item', { active: $route.path === tab.path }]"
      >
        <div class="tab-icon">{{ tab.icon }}</div>
        <div class="tab-text">{{ tab.text }}</div>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProductStore } from './stores/product'

const store = useProductStore()

const tabs = [
  { path: '/search', icon: '🔍', text: '搜索' },
  { path: '/monitor', icon: '📌', text: '监控' },
  { path: '/history', icon: '📊', text: '历史' }
]

onMounted(() => {
  store.loadMonitorList()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  font-size: 14px;
}

#app {
  min-height: 100vh;
  padding-bottom: 60px;
}

/* 平台标签 */
.platform-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}
.platform-taobao { background-color: #ff5000; }
.platform-tmall { background-color: #ff0036; }
.platform-jd { background-color: #c91623; }
.platform-pdd { background-color: #e85525; }

/* 价格 */
.price {
  color: #ff4d4f;
  font-weight: bold;
}

/* 底部Tab */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  color: #666;
  text-decoration: none;
}

.tab-item.active {
  color: #ff4d4f;
}

.tab-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.tab-text {
  font-size: 12px;
}
</style>
