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
      <div v-if="paginatedItems.length === 0" class="empty-state">
        没有找到任何物品
      </div>

      <div
          v-for="item in paginatedItems"
          :key="item.id"
          class="item"
      >
        <span class="item-status" :class="getStatusClass(item)">
          {{ getStatusLabel(item) }}
        </span>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-meta">
            <span class="item-category">{{ item.categoryName }}</span>
            <span class="item-date">到期日: {{ formatDate(item.expiry_date) }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="edit-btn" @click="$emit('edit-item', item)">编辑</button>
          <button class="delete-btn" @click="$emit('delete-item', item.id)">删除</button>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          上一页
        </button>

        <div class="pagination-info">
          第 {{ currentPage }} / {{ totalPages }} 页，共 {{ totalFilteredItems }} 个物品
        </div>

        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const PAGE_SIZE = 10
const currentPage = ref(1)

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

const emit = defineEmits(['filter-category', 'clear-emergency', 'edit-item', 'delete-item'])

// 重置页码当筛选条件变化
function resetPage() {
  currentPage.value = 1
}

function getStatus(expiryDate) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', label: '已过期', days: diffDays }
  } else if (diffDays <= 5) {
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

// 计算所有筛选后的物品总数
const totalFilteredItems = computed(() => {
  return filteredItemsByCategory.value.reduce((sum, group) => sum + group.items.length, 0)
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalFilteredItems.value / PAGE_SIZE)
})

// 将所有物品平铺到一个数组中
const allFilteredItems = computed(() => {
  const items = []
  filteredItemsByCategory.value.forEach(group => {
    group.items.forEach(item => {
      items.push({
        ...item,
        categoryName: group.category.name
      })
    })
  })
  return items
})

// 当前页的物品
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return allFilteredItems.value.slice(start, end)
})

// 上一页
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 跳转到指定页
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.2em;
  margin-bottom: 15px;
  color: #1C1C1E;
  font-weight: 600;
}

/* 紧急筛选横幅 */
.emergency-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 15px;
  background: #FFF9F0;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  border: 1px solid #FF9500;
}

.clear-filter-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  width: auto;
  transition: all 0.2s;
}

.clear-filter-btn:hover {
  background: #1557b0;
}

.clear-filter-btn:active {
  background: #174ea6;
}

/* 分类筛选器 */
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #C6C6C8;
  border-radius: 20px;
  background: #F2F2F7;
  color: #1a73e8;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  width: auto;
}

.filter-btn:hover {
  background: #E5E5EA;
}

.filter-btn.active {
  background: #1a73e8;
  color: white;
  border-color: #1a73e8;
}

/* 物品列表 */
.item-list {
  list-style: none;
}

.item {
  padding: 15px;
  border-bottom: 1px solid #E5E5EA;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
  gap: 10px;
  position: relative;
}

.item:last-child {
  border-bottom: none;
}

.item:hover {
  background-color: #F2F2F7;
}

.item-status {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  margin-right: 10px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  margin-bottom: 5px;
  color: #1C1C1E;
  font-size: 16px;
}

.item-meta {
  display: flex;
  gap: 12px;
  color: #8E8E93;
  font-size: 14px;
  align-items: center;
}

.item-category {
  color: #1a73e8;
  font-weight: 500;
  white-space: nowrap;
}

.item-date {
  color: #8E8E93;
  white-space: nowrap;
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #E5E5EA;
  gap: 15px;
}

.pagination-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.pagination-btn:hover:not(:disabled) {
  background: #1557b0;
}

.pagination-btn:active:not(:disabled) {
  background: #174ea6;
}

.pagination-btn:disabled {
  background: #E5E5EA;
  color: #8E8E93;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #8E8E93;
  text-align: center;
  flex: 1;
}

.status-warning {
  background-color: #FFF9F0;
  color: #FF9500;
  border: 1px solid #FF9500;
}

.status-expired {
  background-color: #FFF0F0;
  color: #FF3B30;
  border: 1px solid #FF3B30;
}

.status-normal {
  background-color: #F0FFF4;
  color: #1a73e8;
  border: 1px solid #1a73e8;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #1557b0;
}

.edit-btn:active {
  background: #174ea6;
}

.delete-btn {
  background: #FF3B30;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #D70015;
}

.delete-btn:active {
  background: #C7001F;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8E8E93;
}

@media (max-width: 600px) {
  .card {
    padding: 15px;
  }

  .item {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 8px;
  }

  .item-status {
    position: absolute;
    top: 12px;
    right: 12px;
    margin: 0;
    align-self: flex-start;
  }

  .item-info {
    width: 100%;
    padding-top: 8px;
  }

  .item-name {
    display: flex;
    align-items: center;
    padding-right: 80px;
    margin-bottom: 8px;
    font-size: 16px;
  }

  .item-meta {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .item-actions {
    width: 100%;
    margin-top: 8px;
    justify-content: flex-end;
  }

  .edit-btn,
  .delete-btn {
    flex: 1;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
  }

  .pagination-info {
    order: -1;
    margin-bottom: 5px;
  }

  .pagination-btn {
    width: 100%;
  }
}
</style>
