<template>
  <div
    class="stat-card"
    :class="{ clickable: props.clickable, active: props.active }"
    @click="handleClick"
  >
    <div class="stat-number" :class="props.numberClass">{{ props.value }}</div>
    <div class="stat-label">{{ props.label }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  numberClass: {
    type: String,
    default: ''
  },
  clickable: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick() {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
  border: 2px solid transparent;
}

.stat-card.clickable:hover {
  border-color: #1a73e8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
}

.stat-card.active {
  border-color: #1a73e8;
  background: #F2F2F7;
}

.stat-number {
  font-size: 2em;
  font-weight: 600;
  margin-bottom: 5px;
  color: #1C1C1E;
}

.stat-label {
  color: #8E8E93;
  font-size: 0.9em;
}

.warning-count {
  color: #FF3B30;
}

.expired-count {
  color: #8E8E93;
}
</style>
