import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 页面组件
import SearchPage from './views/SearchPage.vue'
import MonitorPage from './views/MonitorPage.vue'
import HistoryPage from './views/HistoryPage.vue'

// 路由配置
const routes = [
  { path: '/', redirect: '/search' },
  { path: '/search', component: SearchPage },
  { path: '/monitor', component: MonitorPage },
  { path: '/history', component: HistoryPage }
]

const router = createRouter({
  history: createWebHistory('/price-compare/'),
  routes
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')
