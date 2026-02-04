<template>
  <div class="route-manager-container">
    <!-- 上班路线 -->
    <div class="route-section">
      <div class="section-header">
        <h2>🏢 上班路线</h2>
        <button @click="showAddWorkModal = true" class="add-btn">
          + 新增路线
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="workRoutes.length === 0" class="empty-state">
        <p>暂无上班路线</p>
      </div>

      <div v-else class="route-list">
        <div
          v-for="route in workRoutes"
          :key="route.id"
          class="route-card"
        >
          <div class="route-header">
            <h3>{{ route.route_name }}</h3>
          </div>

          <div class="route-details">
            <div class="detail-item">
              <span class="detail-label">起点：</span>
              <span class="detail-value">{{ route.start_point }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">终点：</span>
              <span class="detail-value">{{ route.end_point }}</span>
            </div>
            <div v-if="route.notes" class="detail-item">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ route.notes }}</span>
            </div>
          </div>

          <div class="route-actions">
            <button @click="handleEditWork(route)" class="action-btn edit-btn">
              编辑
            </button>
            <button @click="handleDeleteWork(route.id)" class="action-btn delete-btn">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 下班路线 -->
    <div class="route-section">
      <div class="section-header">
        <h2>🏠 下班路线</h2>
        <button @click="showAddHomeModal = true" class="add-btn">
          + 新增路线
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="homeRoutes.length === 0" class="empty-state">
        <p>暂无下班路线</p>
      </div>

      <div v-else class="route-list">
        <div
          v-for="route in homeRoutes"
          :key="route.id"
          class="route-card"
        >
          <div class="route-header">
            <h3>{{ route.route_name }}</h3>
          </div>

          <div class="route-details">
            <div class="detail-item">
              <span class="detail-label">起点：</span>
              <span class="detail-value">{{ route.start_point }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">终点：</span>
              <span class="detail-value">{{ route.end_point }}</span>
            </div>
            <div v-if="route.notes" class="detail-item">
              <span class="detail-label">备注：</span>
              <span class="detail-value">{{ route.notes }}</span>
            </div>
          </div>

          <div class="route-actions">
            <button @click="handleEditHome(route)" class="action-btn edit-btn">
              编辑
            </button>
            <button @click="handleDeleteHome(route.id)" class="action-btn delete-btn">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑上班路线弹窗 -->
    <div v-if="showAddWorkModal || editingWorkRoute" class="modal-overlay" @click="closeWorkModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingWorkRoute ? '编辑' : '新增' }}上班路线</h2>

        <form @submit.prevent="handleSubmitWork">
          <div class="form-group">
            <label>路线名称 *</label>
            <input
              v-model="workFormData.routeName"
              type="text"
              placeholder="例如：地铁1号线"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>起点 *</label>
            <input
              v-model="workFormData.startPoint"
              type="text"
              placeholder="例如：家"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>终点 *</label>
            <input
              v-model="workFormData.endPoint"
              type="text"
              placeholder="例如：公司"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>备注（可选）</label>
            <textarea
              v-model="workFormData.notes"
              class="form-textarea"
              rows="3"
              maxlength="200"
              placeholder="例如：早高峰需要换乘"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              {{ editingWorkRoute ? '保存' : '添加' }}
            </button>
            <button type="button" @click="closeWorkModal" class="cancel-btn">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑下班路线弹窗 -->
    <div v-if="showAddHomeModal || editingHomeRoute" class="modal-overlay" @click="closeHomeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingHomeRoute ? '编辑' : '新增' }}下班路线</h2>

        <form @submit.prevent="handleSubmitHome">
          <div class="form-group">
            <label>路线名称 *</label>
            <input
              v-model="homeFormData.routeName"
              type="text"
              placeholder="例如：公交+步行"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>起点 *</label>
            <input
              v-model="homeFormData.startPoint"
              type="text"
              placeholder="例如：公司"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>终点 *</label>
            <input
              v-model="homeFormData.endPoint"
              type="text"
              placeholder="例如：家"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>备注（可选）</label>
            <textarea
              v-model="homeFormData.notes"
              class="form-textarea"
              rows="3"
              maxlength="200"
              placeholder="例如：晚高峰堵车"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn">
              {{ editingHomeRoute ? '保存' : '添加' }}
            </button>
            <button type="button" @click="closeHomeModal" class="cancel-btn">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  workRoutes: {
    type: Array,
    default: () => []
  },
  homeRoutes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'add-work',
  'add-home',
  'edit-work',
  'edit-home',
  'delete-work',
  'delete-home'
])

// 上班路线
const showAddWorkModal = ref(false)
const editingWorkRoute = ref(null)
const workFormData = ref({
  routeName: '',
  startPoint: '',
  endPoint: '',
  notes: ''
})

// 下班路线
const showAddHomeModal = ref(false)
const editingHomeRoute = ref(null)
const homeFormData = ref({
  routeName: '',
  startPoint: '',
  endPoint: '',
  notes: ''
})

// 上班路线操作
function handleEditWork(route) {
  editingWorkRoute.value = route
  workFormData.value = {
    routeName: route.route_name,
    startPoint: route.start_point,
    endPoint: route.end_point,
    notes: route.notes || ''
  }
}

function handleDeleteWork(id) {
  if (!confirm('确定要删除这条上班路线吗？')) return
  emit('delete-work', id)
}

function closeWorkModal() {
  showAddWorkModal.value = false
  editingWorkRoute.value = null
  workFormData.value = {
    routeName: '',
    startPoint: '',
    endPoint: '',
    notes: ''
  }
}

function handleSubmitWork() {
  const data = {
    routeName: workFormData.value.routeName,
    startPoint: workFormData.value.startPoint,
    endPoint: workFormData.value.endPoint,
    notes: workFormData.value.notes || null
  }

  if (editingWorkRoute.value) {
    emit('edit-work', { id: editingWorkRoute.value.id, ...data })
  } else {
    emit('add-work', data)
  }

  closeWorkModal()
}

// 下班路线操作
function handleEditHome(route) {
  editingHomeRoute.value = route
  homeFormData.value = {
    routeName: route.route_name,
    startPoint: route.start_point,
    endPoint: route.end_point,
    notes: route.notes || ''
  }
}

function handleDeleteHome(id) {
  if (!confirm('确定要删除这条下班路线吗？')) return
  emit('delete-home', id)
}

function closeHomeModal() {
  showAddHomeModal.value = false
  editingHomeRoute.value = null
  homeFormData.value = {
    routeName: '',
    startPoint: '',
    endPoint: '',
    notes: ''
  }
}

function handleSubmitHome() {
  const data = {
    routeName: homeFormData.value.routeName,
    startPoint: homeFormData.value.startPoint,
    endPoint: homeFormData.value.endPoint,
    notes: homeFormData.value.notes || null
  }

  if (editingHomeRoute.value) {
    emit('edit-home', { id: editingHomeRoute.value.id, ...data })
  } else {
    emit('add-home', data)
  }

  closeHomeModal()
}
</script>

<style scoped>
.route-manager-container {
  width: 100%;
}

.route-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
}

.add-btn {
  padding: 10px 20px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #1557b0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #8E8E93;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  color: #8E8E93;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.route-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.route-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

.route-card:hover {
  transform: translateY(-2px);
}

.route-header h3 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.route-details {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  font-size: 14px;
}

.detail-label {
  color: #8E8E93;
  min-width: 60px;
}

.detail-value {
  color: #1C1C1E;
  flex: 1;
}

.route-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.edit-btn:hover {
  background: #f1f3f4;
}

.delete-btn {
  background: #fce8e6;
  color: #d93025;
}

.delete-btn:hover {
  background: #fad2cf;
}

/* 弹窗样式 */
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
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
  margin: 0 0 24px;
  color: #1C1C1E;
  font-size: 20px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #1C1C1E;
  font-size: 14px;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1a73e8;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn,
.cancel-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #1a73e8;
  color: white;
}

.submit-btn:hover {
  background: #1557b0;
}

.cancel-btn {
  background: #f8f9fa;
  color: #5f6368;
}

.cancel-btn:hover {
  background: #f1f3f4;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .add-btn {
    width: 100%;
  }

  .route-list {
    grid-template-columns: 1fr;
  }

  .modal-content {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
