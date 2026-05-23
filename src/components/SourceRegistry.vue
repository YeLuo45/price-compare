<template>
  <div class="source-registry">
    <div class="registry-header">
      <span class="registry-title">价格源管理</span>
      <button class="reset-btn" @click="handleReset">重置</button>
    </div>
    <table class="registry-table">
      <thead>
        <tr>
          <th>平台</th>
          <th>优先级</th>
          <th>价格权重</th>
          <th>评分权重</th>
          <th>发货权重</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="source in sources" :key="source.id">
          <td>
            <span class="platform-cell">
              <span class="platform-icon">{{ source.icon }}</span>
              <span class="platform-name">{{ source.name }}</span>
            </span>
          </td>
          <td>
            <select 
              :value="source.priority"
              @change="updatePriority(source.id, $event.target.value)"
            >
              <option v-for="n in 4" :key="n" :value="n">{{ n }}</option>
            </select>
          </td>
          <td>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              :value="source.weight.price"
              @change="updateWeight(source.id, 'price', $event.target.value)"
            />
            <span class="weight-value">{{ source.weight.price.toFixed(1) }}</span>
          </td>
          <td>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              :value="source.weight.rating"
              @change="updateWeight(source.id, 'rating', $event.target.value)"
            />
            <span class="weight-value">{{ source.weight.rating.toFixed(1) }}</span>
          </td>
          <td>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              :value="source.weight.shipping"
              @change="updateWeight(source.id, 'shipping', $event.target.value)"
            />
            <span class="weight-value">{{ source.weight.shipping.toFixed(1) }}</span>
          </td>
          <td>
            <label class="switch">
              <input 
                type="checkbox"
                :checked="source.enabled"
                @change="toggleEnabled(source.id, $event.target.checked)"
              />
              <span class="slider"></span>
            </label>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { priceSourceRegistry } from '@/utils/priceSourceRegistry.js'

const sources = computed(() => priceSourceRegistry.list())

function updatePriority(sourceId, priority) {
  priceSourceRegistry.updateSource(sourceId, { priority: parseInt(priority) })
}

function updateWeight(sourceId, weightType, value) {
  const source = priceSourceRegistry.get(sourceId)
  if (source) {
    const newWeight = { ...source.weight, [weightType]: parseFloat(value) }
    priceSourceRegistry.updateSource(sourceId, { weight: newWeight })
  }
}

function toggleEnabled(sourceId, enabled) {
  priceSourceRegistry.setEnabled(sourceId, enabled)
}

function handleReset() {
  priceSourceRegistry.reset()
}
</script>

<style scoped>
.source-registry {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
}

.registry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.registry-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.reset-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #f5f5f5;
}

.registry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.registry-table th,
.registry-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.registry-table th {
  color: #666;
  font-weight: normal;
}

.platform-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.platform-icon {
  font-size: 16px;
}

.platform-name {
  color: #333;
}

select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

input[type="range"] {
  width: 60px;
  vertical-align: middle;
}

.weight-value {
  display: inline-block;
  width: 24px;
  text-align: right;
  color: #666;
  font-size: 11px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4cd964;
}

input:checked + .slider:before {
  transform: translateX(16px);
}
</style>