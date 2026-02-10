<template>
  <div class="map-marker">
    <div class="marker-icon">📍</div>
    <div class="marker-info">
      <div class="location-name">{{ checkin.location_name }}</div>
      <div class="checkin-time">{{ formattedTime }}</div>
      <div v-if="showCoords && checkin.latitude && checkin.longitude" class="coordinates">
        {{ checkin.latitude.toFixed(6) }}, {{ checkin.longitude.toFixed(6) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatFriendlyTime } from '../../utils/timezone'

const props = defineProps({
  checkin: {
    type: Object,
    required: true
  },
  showCoords: {
    type: Boolean,
    default: false
  }
})

const formattedTime = computed(() => {
  return formatFriendlyTime(props.checkin.created_at)
})
</script>

<style scoped>
.map-marker {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  transition: background 0.2s;
}

.marker-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.marker-info {
  flex: 1;
  min-width: 0;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.checkin-time {
  font-size: 14px;
  color: #8E8E93;
}

.coordinates {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 4px;
  font-family: monospace;
}
</style>
