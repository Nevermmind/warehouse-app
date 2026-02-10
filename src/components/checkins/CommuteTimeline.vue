<template>
  <div class="timeline-wrapper" :class="`type-${lineType}`">
    <div class="timeline-date-label" :class="{ 'invisible': !showDateLabel }">
      {{ dateLabel }}
    </div>
    <div class="timeline-track">
      <div class="timeline-line"></div>

      <div
        v-for="(node, index) in processedNodes"
        :key="node.id"
        class="timeline-node"
        :class="{ 'is-active': activeNode && activeNode.id === node.id }"
        :style="{ left: node.position + '%' }"
      >
        <div
          class="node-dot"
          @mouseenter="!isMobile && showTooltip(node)"
          @mouseleave="!isMobile && hideTooltip()"
          @click.stop="toggleNode(node)"
        ></div>

        <div class="node-label bottom" :style="{ visibility: node.showTime ? 'visible' : 'hidden' }">{{ formatTimeDisplay(node.created_at) }}</div>

        <div v-if="!isMobile && activeNode && activeNode.id === node.id" class="node-tooltip">
          <div class="tooltip-content">
            <div class="tooltip-title">{{ activeNode.location_name }}</div>
            <div class="tooltip-time">{{ formatTimeDisplay(activeNode.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mobile-info-card" v-if="isMobile && activeNode">
      <div class="info-content fade-in">
        <span class="info-time">{{ formatTimeDisplay(activeNode.created_at) }}</span>
        <span class="info-location">📍 {{ activeNode.location_name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 状态管理
const activeNode = ref(null)
const isMobile = ref(false)

// 接收父组件传入的通勤记录数据
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  dateLabel: {
    type: String,
    default: ''
  },
  lineType: {
    type: String,
    default: 'default' // work, home, unknown
  },
  showDateLabel: {
    type: Boolean,
    default: true // 默认显示日期标签
  }
})

// 处理数据：排序并计算中间时长和位置
const processedNodes = computed(() => {
  if (props.records.length === 0) return []

  // 1. 按时间排序
  const sorted = [...props.records].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  )

  // 2. 过滤相邻且location相同的记录，只保留时间更晚的
  const filtered = []
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    // 如果下一条记录存在且location相同，跳过当前记录
    if (next && current.location_name === next.location_name) {
      continue
    }

    filtered.push(current)
  }

  // 3. 计算时间跨度（基于过滤后的数据）
  const firstTime = new Date(filtered[0].created_at).getTime()
  const lastTime = new Date(filtered[filtered.length - 1].created_at).getTime()
  const totalDuration = lastTime - firstTime

  // 4. 如果只有一个点或所有点时间相同，均匀分布
  if (totalDuration === 0 || filtered.length === 1) {
    return filtered.map((item, index) => {
      return {
        ...item,
        position: filtered.length > 1 ? (index / (filtered.length - 1)) * 100 : 50,
        durationToNext: null,
        showTime: true // 第一个点或时间相同时，都显示时间
      }
    })
  }

  // 5. 根据时间计算每个节点的位置百分比
  const result = []
  let previousShowTime = true // 第一个点总是显示时间

  filtered.map((item, index) => {
    const itemTime = new Date(item.created_at).getTime()
    const position = ((itemTime - firstTime) / totalDuration) * 100

    let showTime = true

    // 移动端：只显示第一个和最后一个时间
    if (isMobile.value) {
      if (index !== 0 && index !== filtered.length - 1) {
        showTime = false
      }
    } else {
      // 桌面端：如果和前一个节点间隔 < 5分钟 且 前一个节点显示了时间，则不显示
      if (index > 0 && previousShowTime) {
        const prevItemTime = new Date(filtered[index - 1].created_at).getTime()
        const timeDiff = itemTime - prevItemTime
        const fiveMinutes = 5 * 60 * 1000 // 5分钟的毫秒数
        if (timeDiff < fiveMinutes) {
          showTime = false
        }
      }
    }

    previousShowTime = showTime

    result.push({
      ...item,
      position: position,
      durationToNext: null,
      showTime: showTime
    })
  })

  return result
})

// 格式化北京时间 HH:mm
function formatTimeDisplay(isoString) {
  if (!isoString) return ''

  // 提取北京时间的时和分
  const utcDate = new Date(isoString)

  // 获取 UTC 时间
  const utcYear = utcDate.getUTCFullYear()
  const utcMonth = utcDate.getUTCMonth()
  const utcDay = utcDate.getUTCDate()
  const utcHours = utcDate.getUTCHours()
  const utcMinutes = utcDate.getUTCMinutes()
  const utcSeconds = utcDate.getUTCSeconds()
  const utcMilliseconds = utcDate.getUTCMilliseconds()

  // 创建 UTC 时间戳
  const utcTimestamp = Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds, utcMilliseconds)

  // 加上 8 小时
  const beijingTimestamp = utcTimestamp + 8 * 60 * 60 * 1000
  const beijingDate = new Date(beijingTimestamp)

  const hours = String(beijingDate.getUTCHours()).padStart(2, '0')
  const minutes = String(beijingDate.getUTCMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

// 显示 tooltip
function showTooltip(node) {
  activeNode.value = node
}

// 隐藏 tooltip
function hideTooltip() {
  activeNode.value = null
}

// 检查屏幕宽度
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 点击切换节点
function toggleNode(node) {
  if (activeNode.value && activeNode.value.id === node.id) {
    // 如果点击的是当前已选中的，取消选中（收起下方卡片）
    activeNode.value = null
  } else {
    activeNode.value = node
  }
}

// 获取到下一站的时长（辅助函数）
function getDuration(node) {
  const found = processedNodes.value.find(n => n.id === node.id)
  return found ? found.durationToNext : null
}

// 格式化完整时间（北京时间）
function formatFullTime(isoString) {
  const utcDate = new Date(isoString)

  const utcYear = utcDate.getUTCFullYear()
  const utcMonth = utcDate.getUTCMonth()
  const utcDay = utcDate.getUTCDate()
  const utcHours = utcDate.getUTCHours()
  const utcMinutes = utcDate.getUTCMinutes()
  const utcSeconds = utcDate.getUTCSeconds()

  const utcTimestamp = Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds)
  const beijingTimestamp = utcTimestamp + 8 * 60 * 60 * 1000
  const beijingDate = new Date(beijingTimestamp)

  const year = beijingDate.getUTCFullYear()
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingDate.getUTCDate()).padStart(2, '0')
  const hours = String(beijingDate.getUTCHours()).padStart(2, '0')
  const minutes = String(beijingDate.getUTCMinutes()).padStart(2, '0')
  const seconds = String(beijingDate.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化坐标
function formatCoords(lat, lng) {
  if (!lat || !lng) return ''
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

// 生命周期监听窗口变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.timeline-wrapper {
  width: 100%;
  padding: 0 0 10px;
  overflow: visible;
  background: transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 3px;
}

.timeline-date-label {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  min-width: 80px;
  white-space: nowrap;
}

/* 隐藏但占位 */
.timeline-date-label.invisible {
  visibility: hidden;
}

.timeline-track {
  position: relative;
  height: 40px;
  flex: 1;
  min-width: 0;
  padding-right: 10px;
  margin-left: -20px;
}

/* 贯穿蓝线 */
.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #1a73e8;
  transform: translateY(calc(-50% + 2px));
  z-index: 0;
  border-radius: 2px;
}

/* 不同类型的线条颜色 */
.type-work .timeline-line {
  background-color: #4285f4;
}

.type-home .timeline-line {
  background-color: #34a853;
}

.type-unknown .timeline-line {
  background-color: #fbbc04;
}

/* 不同类型的圆点颜色 */
.type-work .node-dot {
  background-color: #4285f4;
  border-color: #fff;
}

.type-home .node-dot {
  background-color: #34a853;
  border-color: #fff;
}

.type-unknown .node-dot {
  background-color: #fbbc04;
  border-color: #fff;
}

.timeline-node {
  position: absolute;
  top: calc(50% + 10px);
  transform: translate(calc(-50% - 5px), -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

/* 蓝色圆点 - 增大点击热区 */
.node-dot {
  position: relative;
  width: 16px;
  height: 16px;
  background-color: #1a73e8;
  border: 3px solid #fff;
  border-radius: 50%;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 5;
}

/* 使用伪元素扩大点击范围到 40x40px */
.node-dot::after {
  content: '';
  position: absolute;
  top: -12px;
  left: -12px;
  right: -12px;
  bottom: -12px;
  background: transparent;
  border-radius: 50%;
}

.node-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.2);
}

/* 选中状态：圆点变大 */
.timeline-node.is-active .node-dot {
  background-color: #fff;
  border-color: #1a73e8;
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.2);
}

/* 文字通用样式 */
.node-label {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.node-label.top {
  color: #1C1C1E;
  font-weight: 600;
  margin-bottom: 4px;
}

.node-label.bottom {
  color: #8E8E93;
  font-family: monospace;
  margin-top: 1px;
}

/* 时长胶囊样式 */
.duration-pill {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(50%);
  background: #e8f0fe;
  color: #1a73e8;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* 最后一个节点不需要显示右侧的时长 */
.timeline-node:last-child .duration-pill {
  display: none;
}

/* 详情提示框 */
.node-tooltip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-100% - 20px));
  z-index: 1000;
  pointer-events: none;
  white-space: nowrap;
}

.tooltip-content {
  background: rgba(28, 28, 30, 0.95);
  color: white;
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: tooltipFadeIn 0.2s ease;
  text-align: center;
}

@keyframes tooltipFadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
}

.tooltip-time {
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
  font-family: monospace;
}

/* --- 移动端详情卡片样式 --- */
.mobile-info-card {
  margin-top: 30px;
  padding: 10px 14px;
  background: #F2F2F7;
  border-radius: 12px;
  min-height: 27px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.info-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.info-time {
  font-size: 10px;
  font-weight: 700;
  color: #1a73e8;
  font-family: monospace;
  flex-shrink: 0;
}

.info-location {
  font-size: 10px;
  color: #1C1C1E;
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 简单的淡入动画 */
.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- 移动端适配 (完整修正版) --- */
@media (max-width: 480px) {
  /* 隐藏桌面端的 tooltip 和 duration pill */
  .node-tooltip, .duration-pill {
    display: none !important;
  }

  .timeline-wrapper {
    padding: 0;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;

    /* ⭐ 修改：增加右侧内边距到 24px，给最右侧的时间文字留足"安全区" */
    padding-right: 24px;
    box-sizing: border-box;
  }

  /* ⭐ 修改：日期标签样式 */
  .timeline-date-label {
    min-width: 22px;
    font-size: 11px;
    /* 增加右边距，防止向左延伸的线条盖住文字 */
    margin-right: 18px;
    margin-left: -2px;
    padding: 0 2px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .timeline-track {
    height: 35px;
    flex: 1;
    min-width: 0;
    margin-left: 0;
    padding-right: 0;
  }

  .mobile-info-card {
    width: 100%;
    margin-top: 5px;
    order: 3;
    margin-left: 35px;
    padding-left: 5px;
    min-height: 25px; /* 27px - 2px = 25px */
    padding-top: 8px; /* 10px - 2px = 8px */
    padding-bottom: 8px; /* 10px - 2px = 8px */
  }

  /* ⭐ 修改：线条样式 - 实现对称 */
  .timeline-line {
    top: 50%;
    transform: translateY(calc(-50% + 3px));

    /* 关键：向左延伸 10px，穿透最左边的点，实现视觉对称 */
    left: -10px;

    /* 右边保持对齐 */
    right: 0;
  }

  /* 节点位置微调 */
  .timeline-node {
    top: calc(50% + 7px);
    transform: translate(calc(-50% - 5px), -50%);
  }

  .node-label {
    font-size: 8px;
  }

  .node-label.bottom {
    margin-top: -2px;
  }

  /* ⭐ 修复：强制去除最左侧圆点的白边 */
  .timeline-wrapper .node-dot {
    width: 8px;
    height: 8px;
    border: none !important; /* 核心：去掉边框 */
    margin: 12px 0;
    box-shadow: none;
  }

  /* 选中状态也去掉边框 */
  .timeline-wrapper .timeline-node.is-active .node-dot {
    transform: scale(1.3);
    border: none !important;
  }
}
</style>
