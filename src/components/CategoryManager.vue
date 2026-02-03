<template>
  <div class="card">
    <h2 class="section-title">📁 分类管理</h2>
    <div class="add-category-form">
      <input
        type="text"
        v-model="newCategoryName"
        placeholder="输入新分类名称..."
        @keyup.enter="handleAdd"
      >
      <button @click="handleAdd" :disabled="!newCategoryName.trim()">
        添加分类
      </button>
    </div>
    <div class="category-list">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-item"
      >
        {{ category.name }}
        <span class="category-count">{{ getCategoryItemCount(category.id) }}</span>
        <button class="delete-category-btn" @click="handleDelete(category)">
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-category', 'delete-category'])

const newCategoryName = ref('')

function getCategoryItemCount(categoryId) {
  return props.items.filter(item => item.categoryId === categoryId).length
}

function handleAdd() {
  const name = newCategoryName.value.trim()
  if (name && !props.categories.find(c => c.name === name)) {
    emit('add-category', {
      id: Date.now(),
      name: name
    })
    newCategoryName.value = ''
  }
}

function handleDelete(category) {
  const itemCount = getCategoryItemCount(category.id)
  const message = itemCount > 0
    ? `确定要删除分类"${category.name}"吗？该分类下的 ${itemCount} 个物品也会被删除。`
    : `确定要删除分类"${category.name}"吗？`

  if (confirm(message)) {
    emit('delete-category', category.id)
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

.add-category-form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.add-category-form input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 17px;
  transition: all 0.2s;
  background: #FFFFFF;
  color: #1C1C1E;
  height: 44px;
}

.add-category-form input:focus {
  outline: none;
  border-color: #1a73e8;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.add-category-form button {
  width: auto;
  white-space: nowrap;
  background: #1a73e8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 17px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  height: 44px;
}

.add-category-form button:hover:not(:disabled) {
  background: #1557b0;
}

.add-category-form button:active:not(:disabled) {
  background: #174ea6;
}

.add-category-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #F2F2F7;
  border-radius: 20px;
  font-size: 15px;
  position: relative;
  color: #1C1C1E;
}

.delete-category-btn {
  background: transparent;
  border: none;
  color: #8E8E93;
  font-size: 20px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}

.delete-category-btn:hover {
  color: #FF3B30;
  transform: scale(1.1);
}

.delete-category-btn:active {
  transform: scale(0.95);
}

.category-count {
  background: #FFFFFF;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #8E8E93;
  font-weight: 500;
}

@media (max-width: 600px) {
  .add-category-form {
    flex-direction: column;
  }

  .add-category-form button {
    width: 100%;
  }
}
</style>
