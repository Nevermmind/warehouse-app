<template>
  <div v-if="show" class="modal-overlay" @click="closeOnOverlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>拟声词管理</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 添加新拟声词表单 -->
        <div class="form-section">
          <h3>添加新拟声词</h3>
          <form @submit.prevent="handleAddWord" class="add-word-form">
            <div class="form-group">
              <label class="form-label">汉字</label>
              <input
                v-model="newWord.word"
                type="text"
                maxlength="10"
                class="form-input"
                placeholder="例如：噗"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">拼音</label>
              <input
                v-model="newWord.pinyin"
                type="text"
                maxlength="20"
                class="form-input"
                placeholder="例如：pu"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">声调</label>
              <select v-model="newWord.tone" class="form-select" required>
                <option :value="1">第一声（ˉ）</option>
                <option :value="2">第二声（ˊ）</option>
                <option :value="3">第三声（ˇ）</option>
                <option :value="4">第四声（ˋ）</option>
                <option :value="5">第五声（轻声）</option>
              </select>
            </div>
            <button type="submit" class="btn-add">添加</button>
          </form>
        </div>

        <!-- 现有拟声词列表 -->
        <div class="form-section">
          <h3>现有拟声词 ({{ soundWords.length }})</h3>
          <div v-if="soundWords.length === 0" class="empty-state">
            暂无拟声词，请先添加
          </div>
          <div v-else class="word-list">
            <div
              v-for="word in soundWords"
              :key="word.id"
              class="word-item"
              :class="{ editing: editingWord?.id === word.id }"
            >
              <!-- 查看模式 -->
              <template v-if="editingWord?.id !== word.id">
                <div class="word-info">
                  <span class="word-char">{{ word.word }}</span>
                  <span class="word-pinyin">{{ word.pinyin }}</span>
                  <span class="word-tone">{{ getToneLabel(word.tone) }}</span>
                  <span v-if="word.user_id !== sharedUserId" class="word-badge">我的</span>
                </div>
                <div class="word-actions">
                  <button
                    @click="startEdit(word)"
                    class="btn-edit"
                    :disabled="deleting"
                  >
                    编辑
                  </button>
                  <button
                    v-if="word.user_id !== sharedUserId"
                    @click="handleDeleteWord(word.id)"
                    class="btn-delete"
                    :disabled="deleting"
                  >
                    删除
                  </button>
                </div>
              </template>

              <!-- 编辑模式 -->
              <template v-else>
                <form @submit.prevent="handleUpdateWord" class="edit-form">
                  <div class="edit-form-row">
                    <input
                      v-model="editingWord.word"
                      type="text"
                      maxlength="10"
                      class="form-input-sm"
                      placeholder="汉字"
                      required
                    />
                    <input
                      v-model="editingWord.pinyin"
                      type="text"
                      maxlength="20"
                      class="form-input-sm"
                      placeholder="拼音"
                      required
                    />
                    <select v-model="editingWord.tone" class="form-select-sm" required>
                      <option :value="1">一声</option>
                      <option :value="2">二声</option>
                      <option :value="3">三声</option>
                      <option :value="4">四声</option>
                      <option :value="5">轻声</option>
                    </select>
                  </div>
                  <div class="edit-form-actions">
                    <button type="button" @click="cancelEdit" class="btn-cancel-sm">取消</button>
                    <button type="submit" class="btn-save-sm">保存</button>
                  </div>
                </form>
              </template>
            </div>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <div class="action-buttons">
          <button @click="close" class="btn-close">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const SHARED_USER_ID = '00000000-0000-0000-0000-000000000001'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  soundWords: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add', 'update', 'delete'])

// 表单数据
const newWord = reactive({
  word: '',
  pinyin: '',
  tone: 1
})

const editingWord = ref(null)
const deleting = ref(false)
const sharedUserId = SHARED_USER_ID

// 获取声调标签
function getToneLabel(tone) {
  const toneMap = {
    1: '一声',
    2: '二声',
    3: '三声',
    4: '四声',
    5: '轻声'
  }
  return toneMap[tone] || ''
}

// 关闭弹窗
function closeOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) {
    close()
  }
}

function close() {
  // 重置表单
  newWord.word = ''
  newWord.pinyin = ''
  newWord.tone = 1
  editingWord.value = null
  emit('close')
}

// 处理添加拟声词
function handleAddWord() {
  if (!newWord.word || !newWord.pinyin) {
    alert('请填写完整的拟声词信息')
    return
  }

  emit('add', {
    word: newWord.word.trim(),
    pinyin: newWord.pinyin.trim(),
    tone: newWord.tone
  })

  // 重置表单
  newWord.word = ''
  newWord.pinyin = ''
  newWord.tone = 1
}

// 开始编辑
function startEdit(word) {
  editingWord.value = {
    id: word.id,
    word: word.word,
    pinyin: word.pinyin,
    tone: word.tone
  }
}

// 取消编辑
function cancelEdit() {
  editingWord.value = null
}

// 处理更新拟声词
function handleUpdateWord() {
  if (!editingWord.value.word || !editingWord.value.pinyin) {
    alert('请填写完整的拟声词信息')
    return
  }

  emit('update', editingWord.value.id, {
    word: editingWord.value.word.trim(),
    pinyin: editingWord.value.pinyin.trim(),
    tone: editingWord.value.tone
  })

  editingWord.value = null
}

// 处理删除拟声词
async function handleDeleteWord(id) {
  if (deleting.value) return

  if (!confirm('确定要删除这个拟声词吗？')) {
    return
  }

  deleting.value = true
  try {
    await emit('delete', id)
  } finally {
    deleting.value = false
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
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 14px;
  max-width: 600px;
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

.modal-body {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E5E5EA;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section h3 {
  margin: 0 0 16px;
  color: #1C1C1E;
  font-size: 17px;
  font-weight: 600;
}

/* 添加表单 */
.add-word-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.form-input,
.form-select {
  padding: 10px 14px;
  border: 1px solid #C6C6C8;
  border-radius: 10px;
  font-size: 16px;
  color: #1C1C1E;
  background: white;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.form-input::placeholder {
  color: #8E8E93;
}

.btn-add {
  padding: 12px 20px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-add:hover {
  background: #1557b0;
}

.btn-add:active {
  transform: scale(0.98);
}

/* 空状态 */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #8E8E93;
  font-size: 15px;
}

/* 拟声词列表 */
.word-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #F2F2F7;
  border-radius: 12px;
  transition: all 0.2s;
}

.word-item:hover {
  background: #E5E5EA;
}

.word-item.editing {
  background: #e8f0fe;
  border: 2px solid #1a73e8;
}

.word-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.word-char {
  font-size: 24px;
  font-weight: 700;
  color: #1a73e8;
  min-width: 40px;
  text-align: center;
}

.word-pinyin {
  font-size: 15px;
  color: #1C1C1E;
  font-family: 'Courier New', monospace;
  padding: 4px 10px;
  background: white;
  border-radius: 6px;
}

.word-tone {
  font-size: 13px;
  color: #8E8E93;
  padding: 4px 8px;
  background: rgba(142, 142, 147, 0.2);
  border-radius: 6px;
}

.word-badge {
  font-size: 11px;
  color: #FF9500;
  padding: 4px 8px;
  background: rgba(255, 149, 0, 0.15);
  border-radius: 6px;
  font-weight: 600;
}

.word-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #1a73e8;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: #1557b0;
}

.btn-delete {
  background: #FF3B30;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #D32B21;
}

.btn-edit:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 编辑表单 */
.edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-input-sm,
.form-select-sm {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: 1px solid #C6C6C8;
  border-radius: 8px;
  font-size: 14px;
  color: #1C1C1E;
  background: white;
}

.edit-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel-sm,
.btn-save-sm {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel-sm {
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-cancel-sm:hover {
  background: #f1f3f4;
}

.btn-save-sm {
  background: #1a73e8;
  color: white;
}

.btn-save-sm:hover {
  background: #1557b0;
}

/* 底部按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.action-buttons button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close {
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-close:hover {
  background: #f1f3f4;
}

@media (max-width: 480px) {
  .modal-content {
    max-height: 95vh;
  }

  .word-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .word-actions {
    width: 100%;
  }

  .btn-edit,
  .btn-delete {
    flex: 1;
  }

  .word-info {
    width: 100%;
    justify-content: space-between;
  }

  .edit-form-row {
    flex-direction: column;
  }
}
</style>
