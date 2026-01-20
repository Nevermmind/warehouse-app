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
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 1.2em;
  margin-bottom: 15px;
  color: #333;
  font-weight: 600;
}

.add-category-form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.add-category-form input {
  flex: 1;
  padding: 16px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 18px;
  transition: all 0.3s ease;
  background: #fafafa;
}

.add-category-form input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.add-category-form button {
  width: auto;
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

.add-category-form button:hover {
  transform: translateY(-2px);
}

.add-category-form button:active {
  transform: translateY(0);
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
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  position: relative;
}

.delete-category-btn {
  background: transparent;
  border: none;
  color: #999;
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
  color: #f44336;
  transform: scale(1.1);
}

.category-count {
  background: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #666;
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
