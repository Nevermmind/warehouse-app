<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>添加新物品</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleAdd" class="add-form">
        <div class="form-group">
          <label for="addItemName">物品名称</label>
          <input
              type="text"
              id="addItemName"
              v-model="newItem.name"
              placeholder="例如：牛奶、面包..."
              required
          >
        </div>

        <div class="form-group">
          <label for="addItemCategory">分类</label>
          <select id="addItemCategory" v-model="newItem.categoryId" required>
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
          <label for="addExpiryDate">保质期到期日</label>
          <input
              type="date"
              id="addExpiryDate"
              v-model="newItem.expiryDate"
              :min="today"
              required
          >
        </div>

        <div class="form-group">
          <label for="addReminderDays">
            提前提醒天数
            <span class="label-hint">(默认提前5天提醒)</span>
          </label>
          <input
              type="number"
              id="addReminderDays"
              v-model="newItem.reminderDays"
              min="1"
              max="30"
              placeholder="5"
          >
        </div>

        <div class="form-actions">
          <button type="button" @click="close" class="cancel-btn">取消</button>
          <button type="submit" class="submit-btn">添加物品</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'add-item'])

const newItem = ref({
  name: '',
  categoryId: '',
  expiryDate: '',
  reminderDays: 5
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

function close() {
  emit('close')
  // 重置表单
  newItem.value = {
    name: '',
    categoryId: '',
    expiryDate: '',
    reminderDays: 5
  }
}

function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function handleAdd() {
  if (newItem.value.name && newItem.value.categoryId && newItem.value.expiryDate) {
    emit('add-item', {
      id: Date.now(),
      name: newItem.value.name.trim(),
      categoryId: newItem.value.categoryId,
      expiryDate: newItem.value.expiryDate,
      reminderDays: newItem.value.reminderDays || 5,
      createdAt: new Date().toISOString()
    })

    // 关闭弹窗并重置表单
    close()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 14px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
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
  border-bottom: 1px solid #E5E5EA;
}

.modal-header h2 {
  margin: 0;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #8E8E93;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #F2F2F7;
  color: #1C1C1E;
}

.add-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #1C1C1E;
  font-weight: 500;
  font-size: 14px;
}

.label-hint {
  font-weight: 400;
  font-size: 0.9em;
  color: #8E8E93;
  margin-left: 4px;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 17px;
  transition: all 0.2s;
  background: #FFFFFF;
  box-sizing: border-box;
  height: 44px;
  color: #1C1C1E;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1a73e8;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
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
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: 48px;
}

.cancel-btn {
  background: #F2F2F7;
  color: #1a73e8;
}

.cancel-btn:hover {
  background: #E5E5EA;
}

.cancel-btn:active {
  background: #D1D1D6;
}

.submit-btn {
  background: #1a73e8;
  color: white;
}

.submit-btn:hover {
  background: #1557b0;
}

.submit-btn:active {
  background: #174ea6;
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

  .add-form {
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
