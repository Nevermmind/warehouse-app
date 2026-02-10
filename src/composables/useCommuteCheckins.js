import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'
import { getBeijingDate } from '../utils/timezone'

export function useCommuteCheckins() {
  const allCheckins = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const daysPerPage = 14 // 每页显示14天（2周）

  // 确保 allCheckins 始终是数组
  const safeCheckins = computed(() => {
    return Array.isArray(allCheckins.value) ? allCheckins.value : []
  })

  // 加载所有打卡记录
  async function loadCheckins() {
    loading.value = true
    error.value = null

    try {
      const { data, err } = await supabase
        .from('commute_checkins')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err

      allCheckins.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('加载打卡记录失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取唯一日期列表
  const uniqueDates = computed(() => {
    const dates = new Set()
    allCheckins.value.forEach(checkin => {
      dates.add(getBeijingDate(checkin.created_at))
    })
    return Array.from(dates).sort((a, b) => b.localeCompare(a))
  })

  // 总页数
  const totalPages = computed(() => {
    return Math.ceil(uniqueDates.value.length / daysPerPage)
  })

  // 当前页的日期
  const currentPageDates = computed(() => {
    const start = (currentPage.value - 1) * daysPerPage
    const end = start + daysPerPage
    return uniqueDates.value.slice(start, end)
  })

  // 判断是否是新的一周（在周一的记录下方插入分隔线）
  function isWeekBoundary(currentDate, previousDate) {
    if (!currentDate) return false

    const curr = new Date(currentDate)
    const currDay = curr.getDay() // 0=周日, 1=周一, ..., 6=周六

    // 如果当前是周一，则在下方划线
    return currDay === 1
  }

  // 按日期分组打卡记录，只返回当前页的数据，并标记周的分界点
  const groupedCheckins = computed(() => {
    const groups = {}

    // 只处理当前页的打卡记录
    const pageCheckins = allCheckins.value.filter(checkin => {
      const date = getBeijingDate(checkin.created_at)
      return currentPageDates.value.includes(date)
    })

    pageCheckins.forEach(checkin => {
      const date = getBeijingDate(checkin.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(checkin)
    })

    // 转换为数组并按日期降序排序
    const sortedGroups = Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date))

    // 标记周的分界点
    let previousDate = null
    sortedGroups.forEach((group, index) => {
      group.showWeekDivider = isWeekBoundary(group.date, previousDate)
      previousDate = group.date
    })

    return sortedGroups
  })

  // 上一页
  function prevPage() {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  // 下一页
  function nextPage() {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  // 筛选上班打卡记录
  const workCheckins = computed(() => {
    return allCheckins.value.filter(c => c.trigger_type === '上班')
  })

  // 筛选下班打卡记录
  const homeCheckins = computed(() => {
    return allCheckins.value.filter(c => c.trigger_type === '下班')
  })

  // 按类型筛选打卡记录
  function getCheckinsByType(type) {
    if (type === 'work') {
      return allCheckins.value.filter(c => c.trigger_type === '上班')
    }
    if (type === 'home') {
      return allCheckins.value.filter(c => c.trigger_type === '下班')
    }
    return allCheckins.value
  }

  // 按日期分组指定类型的打卡记录
  function getGroupedCheckinsByType(type) {
    const filtered = getCheckinsByType(type)
    const groups = {}

    filtered.forEach(checkin => {
      const date = getBeijingDate(checkin.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(checkin)
    })

    // 按日期降序排序
    return Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // 计算单日通勤时长（分钟）
  function calculateDailyCommuteDuration(date, triggerType) {
    try {
      // 筛选指定日期和类型的记录
      const daysRecords = safeCheckins.value.filter(checkin => {
        const checkinDate = getBeijingDate(checkin.created_at)
        return checkinDate === date && checkin.trigger_type === triggerType
      })

      if (daysRecords.length === 0) return null

      if (triggerType === '上班') {
        // 上班：找最早一条"家"和最后一条"公司"
        const homeRecords = daysRecords.filter(r => r.location_name === '家')
        const companyRecords = daysRecords.filter(r => r.location_name === '公司')

        if (homeRecords.length === 0 || companyRecords.length === 0) return null

        // 最早的"家"
        const firstHome = homeRecords.reduce((earliest, current) =>
          new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
        )

        // 最晚的"公司"
        const lastCompany = companyRecords.reduce((latest, current) =>
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )

        // 计算时长（分钟）
        const duration = (new Date(lastCompany.created_at) - new Date(firstHome.created_at)) / 1000 / 60
        return duration
      } else if (triggerType === '下班') {
        // 下班：找最早一条"公司"和最后一条"家"
        const companyRecords = daysRecords.filter(r => r.location_name === '公司')
        const homeRecords = daysRecords.filter(r => r.location_name === '家')

        if (companyRecords.length === 0 || homeRecords.length === 0) return null

        // 最早的"公司"
        const firstCompany = companyRecords.reduce((earliest, current) =>
          new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
        )

        // 最晚的"家"
        const lastHome = homeRecords.reduce((latest, current) =>
          new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        )

        // 计算时长（分钟）
        const duration = (new Date(lastHome.created_at) - new Date(firstCompany.created_at)) / 1000 / 60
        return duration
      }

      return null
    } catch (error) {
      console.error('计算通勤时长失败:', error)
      return null
    }
  }

  // 获取最近 N 天的日期列表（包含今天）
  function getRecentDays(n) {
    const today = new Date()
    const days = []
    for (let i = 0; i < n; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push(getBeijingDate(date.toISOString()))
    }
    return days
  }

  // 计算最近 N 天的平均通勤时长（分钟）
  function calculateAverageCommuteDuration(days, triggerType) {
    try {
      const recentDays = getRecentDays(days)
      const durations = []

      recentDays.forEach(date => {
        const duration = calculateDailyCommuteDuration(date, triggerType)
        if (duration !== null && duration > 0) {
          durations.push(duration)
        }
      })

      if (durations.length === 0) return null

      // 计算平均值（分钟）
      const avgMinutes = durations.reduce((sum, d) => sum + d, 0) / durations.length
      return avgMinutes
    } catch (error) {
      console.error('计算平均通勤时长失败:', error)
      return null
    }
  }

  // 格式化时长为小时和分钟
  function formatDuration(minutes) {
    if (minutes === null || minutes === undefined) return '--'
    if (isNaN(minutes)) return '--'

    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)

    if (hours === 0) {
      return `${mins} 分钟` // 添加空格
    } else if (mins === 0) {
      return `${hours} 小时` // 添加空格
    } else {
      return `${hours} 小时 ${mins} 分钟` // 两处都添加空格
    }
  }

  // 计算统计数据
  const stats = computed(() => {
    try {
      return {
        work7Days: calculateAverageCommuteDuration(7, '上班'),
        home7Days: calculateAverageCommuteDuration(7, '下班'),
        work30Days: calculateAverageCommuteDuration(30, '上班'),
        home30Days: calculateAverageCommuteDuration(30, '下班')
      }
    } catch (error) {
      console.error('计算统计数据失败:', error)
      return {
        work7Days: null,
        home7Days: null,
        work30Days: null,
        home30Days: null
      }
    }
  })

  return {
    checkins: safeCheckins,
    loading,
    error,
    loadCheckins,
    groupedCheckins,
    workCheckins,
    homeCheckins,
    getCheckinsByType,
    getGroupedCheckinsByType,
    currentPage,
    totalPages,
    prevPage,
    nextPage,
    stats,
    formatDuration
  }
}
