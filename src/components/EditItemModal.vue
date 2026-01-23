<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>✏️ 编辑物品</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSave" class="edit-form">
        <div class="form-group">
          <label>物品名称</label>
          <input type="text" :value="item.name" disabled class="disabled-input">
        </div>

        <div class="form-group">
          <label for="editCategory">分类</label>
          <select id="editCategory" v-model="editedItem.categoryId" required>
            <option value="">请选择分类</option>
            <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
                :selected="category.id === item.category_id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="editExpiryDate">保质期到期日</label>
          <input
              type="date"
              id="editExpiryDate"
              v-model="editedItem.expiryDate"
              required
          >
        </div>

        <div class="form-group">
          <label for="editReminderDays">
            提前提醒天数
            <span class="label-hint">(当前: {{ editedItem.reminderDays }} 天)</span>
          </label>
          <input
              type="number"
              id="editReminderDays"
              v-model="editedItem.reminderDays"
              min="1"
              max="30"
              required
          >
        </div>

        <div class="form-actions">
          <button type="button" @click="close" class="cancel-btn">取消</button>
          <button type="submit" class="save-btn">保存修改</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// 编辑的数据
const editedItem = ref({
  categoryId: '',
  expiryDate: '',
  reminderDays: 5
})

// 监听 item 变化，初始化编辑数据
watch(() => props.item, (newItem) => {
  if (newItem) {
    editedItem.value = {
      categoryId: newItem.category_id,
      expiryDate: newItem.expiry_date,
      reminderDays: newItem.reminder_days || 5
    }
  }
}, { immediate: true })

function close() {
  emit('close')
}

function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function handleSave() {
  emit('save', {
    id: props.item.id,
    categoryId: editedItem.value.categoryId,
    expiryDate: editedItem.value.expiryDate,
    reminderDays: editedItem.value.reminderDays
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.edit-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.label-hint {
  font-weight: 400;
  font-size: 0.9em;
  color: #666;
  margin-left: 4px;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  background: #fafafa;
  box-sizing: border-box;
  height: 48px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.disabled-input {
  background: #f5f5f5 !important;
  color: #666;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.form-actions button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px 20px 16px;
  }

  .edit-form {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
