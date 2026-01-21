<template>
  <div class="card">
    <h2 class="section-title">添加新物品</h2>
    <form @submit.prevent="handleAdd">
      <div class="form-group">
        <label for="itemName">物品名称</label>
        <input
            type="text"
            id="itemName"
            v-model="newItem.name"
            placeholder="例如：牛奶、面包..."
            required
        >
      </div>
      <div class="form-group">
        <label for="itemCategory">分类</label>
        <select id="itemCategory" v-model="newItem.categoryId" required>
          <option value="">请选择分类</option>
          <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="expiryDate">保质期到期日</label>
        <input
            type="date"
            id="expiryDate"
            v-model="newItem.expiryDate"
            :min="today"
            required
        >
      </div>
      <div class="form-group">
        <label for="reminderDays">
          提前提醒天数
          <span class="label-hint">(默认提前3天提醒)</span>
        </label>
        <input
            type="number"
            id="reminderDays"
            v-model="newItem.reminderDays"
            min="1"
            max="30"
            placeholder="3"
        >
      </div>
      <button type="submit">添加物品</button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-item'])

const newItem = ref({
  name: '',
  categoryId: '',
  expiryDate: '',
  reminderDays: 3
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

function handleAdd() {
  if (newItem.value.name && newItem.value.categoryId && newItem.value.expiryDate) {
    emit('add-item', {
      id: Date.now(),
      name: newItem.value.name.trim(),
      categoryId: newItem.value.categoryId,
      expiryDate: newItem.value.expiryDate,
      reminderDays: newItem.value.reminderDays || 3,
      createdAt: new Date().toISOString()
    })

    newItem.value.name = ''
    newItem.value.categoryId = ''
    newItem.value.expiryDate = ''
    newItem.value.reminderDays = 3
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

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.label-hint {
  font-weight: 400;
  font-size: 0.9em;
  color: #666;
  margin-left: 4px;
}

input[type="text"],
input[type="date"],
input[type="number"],
select {
  width: 100%;
  padding: 16px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 18px;
  transition: all 0.3s ease;
  background: #fafafa;
  cursor: pointer;
  box-sizing: border-box;
  height: 58px;
  line-height: 1.5;
  vertical-align: middle;
}

/* 移除 number 输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* select 特别样式，确保高度一致 */
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 18px center;
  padding-right: 45px;
}

input[type="text"]:focus,
input[type="date"]:focus,
select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* 日历输入框特别样式 */
input[type="date"] {
  font-weight: 500;
  letter-spacing: 0.5px;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  filter: invert(0.5);
  transition: all 0.2s;
  padding: 8px;
  border-radius: 8px;
}

input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  background: rgba(102, 126, 234, 0.1);
}

input[type="date"]::-webkit-datetime-edit-text {
  color: #667eea;
  font-weight: 600;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
  transition: transform 0.2s;
}

button:hover {
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .card {
    padding: 15px;
  }

  /* 确保移动端输入框高度一致 */
  input[type="text"],
  input[type="date"],
  input[type="number"],
  select {
    height: 56px;
    padding: 14px 16px;
    font-size: 16px;
  }

  /* 强制移动端日期输入框样式一致 */
  input[type="date"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  /* 移除移动端日期选择器的默认样式 */
  input[type="date"]::-webkit-date-and-time-value {
    height: 100%;
    padding: 0;
    margin: 0;
  }

  input[type="date"]::-webkit-datetime-edit {
    display: block;
    padding: 0;
  }

  input[type="date"]::-webkit-datetime-edit-fields-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }
}
</style>
