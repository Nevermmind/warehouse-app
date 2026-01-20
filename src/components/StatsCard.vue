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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
  border: 2px solid transparent;
}

.stat-card.clickable:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.stat-card.active {
  border-color: #667eea;
  background: #f5f5ff;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.warning-count {
  color: #f44336;
}

.expired-count {
  color: #9e9e9e;
}
</style>
