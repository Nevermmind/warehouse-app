<template>
  <div class="card" id="item-list">
    <h2 class="section-title">我的物品</h2>

    <!-- 紧急筛选提示 -->
    <div v-if="emergencyFilter" class="emergency-filter-banner">
      <span v-if="emergencyFilter === 'warning'">⚠️ 快过期物品</span>
      <span v-else>❌ 已过期物品</span>
      <button class="clear-filter-btn" @click="$emit('clear-emergency')">
        返回全部
      </button>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-bar">
      <button
          class="filter-btn"
          :class="{ active: selectedCategory === null }"
          @click="$emit('filter-category', null)"
      >
        全部 ({{ totalItems }})
      </button>
      <button
          v-for="category in categories"
          :key="category.id"
          class="filter-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="$emit('filter-category', category.id)"
      >
        {{ category.name }} ({{ getCategoryItemCount(category.id) }})
      </button>
    </div>

    <!-- 按分类分组的物品列表 -->
    <div class="item-list">
      <div v-if="filteredItemsByCategory.length === 0" class="empty-state">
        没有找到任何物品
      </div>
      <div
          v-for="group in filteredItemsByCategory"
          :key="group.category.id"
          class="category-group"
      >
        <div class="category-header">
          <span class="category-tag">{{ group.category.name }}</span>
          <small style="color: #666; margin-left: 10px;">
            {{ group.items.length }} 个物品
          </small>
        </div>
        <div v-if="group.items.length === 0" class="empty-state">
          该分类下暂无物品
        </div>
        <div
            v-for="item in group.items"
            :key="item.id"
            class="item"
        >
          <span class="item-status" :class="getStatusClass(item)">
            {{ getStatusLabel(item) }}
          </span>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-date">到期日: {{ formatDate(item.expiry_date) }}</div>
          </div>
          <button class="delete-btn" @click="$emit('delete-item', item.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  selectedCategory: {
    type: Number,
    default: null
  },
  emergencyFilter: {
    type: String,
    default: null // null | 'warning' | 'expired'
  }
})

const emit = defineEmits(['filter-category', 'clear-emergency', 'delete-item'])

function getStatus(expiryDate) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', label: '已过期', days: diffDays }
  } else if (diffDays <= 3) {
    return { status: 'warning', label: `快过期 (${diffDays}天)`, days: diffDays }
  } else {
    return { status: 'normal', label: `正常 (${diffDays}天)`, days: diffDays }
  }
}

function getStatusClass(item) {
  const status = getStatus(item.expiry_date)
  return `status-${status.status}`
}

function getStatusLabel(item) {
  return getStatus(item.expiry_date).label
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getCategoryItemCount(categoryId) {
  return props.items.filter(item => item.category_id === categoryId).length
}

const totalItems = computed(() => props.items.length)

const filteredItemsByCategory = computed(() => {
  // 先按紧急状态筛选
  let result = props.items
  if (props.emergencyFilter === 'warning') {
    result = result.filter(item => getStatus(item.expiry_date).status === 'warning')
  } else if (props.emergencyFilter === 'expired') {
    result = result.filter(item => getStatus(item.expiry_date).status === 'expired')
  }

  // 再按分类筛选
  if (props.selectedCategory !== null) {
    result = result.filter(item => item.category_id === props.selectedCategory)
  }

  // 按分类分组
  const groups = []
  props.categories.forEach(category => {
    const categoryItems = result
      .filter(item => item.category_id === category.id)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))

    if (categoryItems.length > 0) {
      groups.push({
        category: category,
        items: categoryItems
      })
    }
  })

  return groups
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 1.2em;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

/* 紧急筛选横幅 */
.emergency-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 15px;
  background: #fff3e0;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.clear-filter-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  width: auto;
}

.clear-filter-btn:hover {
  background: #5568d3;
}

/* 分类筛选器 */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  width: auto;
}

.filter-btn:hover {
  border-color: #667eea;
  background: #f5f5ff;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

/* 物品列表 */
.item-list {
  list-style: none;
}

.category-group {
  margin-bottom: 25px;
}

.category-header {
  font-size: 1.3em;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.item {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.item:last-child {
  border-bottom: none;
}

.item:hover {
  background-color: #f5f5f5;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.item-date {
  color: #666;
  font-size: 0.9em;
}

.item-status {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  margin-right: 10px;
}

.status-warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-expired {
  background-color: #ffebee;
  color: #c62828;
}

.status-normal {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  width: auto;
}

.delete-btn:hover {
  background: #d32f2f;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 分类标签 */
.category-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  margin-right: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

@media (max-width: 600px) {
  .card {
    padding: 15px;
  }

  .item {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-status {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .delete-btn {
    width: 100%;
    margin-top: 10px;
  }
}
</style>
