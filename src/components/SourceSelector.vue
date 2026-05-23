<template>
  <div class="source-selector">
    <div class="source-header">
      <span class="source-title">价格源</span>
      <span class="source-count">{{ activeCount }}/{{ totalCount }} 启用</span>
    </div>
    <div class="source-list">
      <label 
        v-for="source in sources" 
        :key="source.id"
        :class="['source-item', { disabled: !source.enabled }]"
      >
        <input 
          type="checkbox"
          :checked="source.enabled"
          @change="toggleSource(source.id, $event.target.checked)"
        />
        <span class="source-icon">{{ source.icon }}</span>
        <span class="source-name">{{ source.name }}</span>
        <span class="source-priority">P{{ source.priority }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { priceSourceRegistry } from '@/utils/priceSourceRegistry.js'

const sources = computed(() => priceSourceRegistry.list())
const activeCount = computed(() => priceSourceRegistry.getActive().length)
const totalCount = computed(() => sources.value.length)

const emit = defineEmits(['change'])

function toggleSource(sourceId, enabled) {
  priceSourceRegistry.setEnabled(sourceId, enabled)
  emit('change', priceSourceRegistry.getActiveIds())
}
</script>

<style scoped>
.source-selector {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.source-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.source-count {
  font-size: 12px;
  color: #999;
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.source-item:hover {
  background: #eee;
}

.source-item.disabled {
  opacity: 0.5;
}

.source-item input {
  width: 14px;
  height: 14px;
}

.source-icon {
  font-size: 14px;
}

.source-name {
  color: #333;
}

.source-priority {
  font-size: 10px;
  color: #999;
  background: #fff;
  padding: 1px 4px;
  border-radius: 8px;
}
</style>