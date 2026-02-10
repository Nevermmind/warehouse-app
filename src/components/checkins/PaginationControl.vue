<template>
  <div v-if="totalPages > 1" class="pagination-control">
    <button
      @click="$emit('prev')"
      :disabled="currentPage === 1"
      class="pagination-btn"
      :class="{ disabled: currentPage === 1 }"
    >
      上一页
    </button>

    <span class="pagination-info">
      第 {{ currentPage }} / {{ totalPages }} 页
    </span>

    <button
      @click="$emit('next')"
      :disabled="currentPage === totalPages"
      class="pagination-btn"
      :class="{ disabled: currentPage === totalPages }"
    >
      下一页
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

defineEmits(['prev', 'next'])
</script>

<style scoped>
.pagination-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 14px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pagination-btn {
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

.pagination-btn:hover:not(.disabled) {
  background: #1557b0;
}

.pagination-btn.disabled {
  background: #E5E5EA;
  color: #8E8E93;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #1C1C1E;
  font-weight: 500;
}

@media (max-width: 480px) {
  .pagination-control {
    padding: 16px 12px;
    gap: 12px;
  }

  .pagination-btn {
    padding: 8px 16px;
    font-size: 13px;
  }

  .pagination-info {
    font-size: 13px;
  }
}
</style>
