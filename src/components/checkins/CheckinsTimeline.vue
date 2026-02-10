<template>
  <div class="checkins-timeline">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>❌ 加载失败: {{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="groups.length === 0" class="empty-state">
      <div class="empty-icon">📍</div>
      <p>暂无打卡记录</p>
    </div>

    <!-- 时间线列表 -->
    <div v-else class="timeline-list">
      <CheckinsDateGroup
        v-for="group in groups"
        :key="group.date"
        :date="group.date"
        :items="group.items"
        :showWeekDivider="group.showWeekDivider"
      />
    </div>
  </div>
</template>

<script setup>
import CheckinsDateGroup from './CheckinsDateGroup.vue'

defineProps({
  groups: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  showCoords: {
    type: Boolean,
    default: false
  }
})

defineEmits(['retry'])
</script>

<style scoped>
.checkins-timeline {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E5EA;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-top: 16px;
  color: #8E8E93;
  font-size: 15px;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #FF3B30;
  font-size: 15px;
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #1557b0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  color: #8E8E93;
  font-size: 15px;
}

/* 时间线列表 */
.timeline-list {
  display: flex;
  flex-direction: column;
}
</style>
