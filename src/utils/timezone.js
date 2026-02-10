/**
 * 时区转换工具函数
 * 将 UTC 时间转换为北京时间 (UTC+8)
 */

/**
 * UTC 时间转北京时间（返回时间戳）
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @returns {number} 北京时间的时间戳（毫秒）
 */
export function utcToBeijingTimestamp(utcTime) {
  const utcDate = typeof utcTime === 'string' ? new Date(utcTime) : utcTime

  // 使用 getUTC 方法获取 UTC 时间，避免本地时区影响
  const utcYear = utcDate.getUTCFullYear()
  const utcMonth = utcDate.getUTCMonth()
  const utcDay = utcDate.getUTCDate()
  const utcHours = utcDate.getUTCHours()
  const utcMinutes = utcDate.getUTCMinutes()
  const utcSeconds = utcDate.getUTCSeconds()
  const utcMilliseconds = utcDate.getUTCMilliseconds()

  // 创建 UTC 时间的 Date 对象
  const utcDateTime = Date.UTC(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds, utcMilliseconds)

  // 加上 8 小时（北京时间 = UTC + 8小时）
  return utcDateTime + 8 * 60 * 60 * 1000
}

/**
 * 格式化北京时间（用于显示）
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @param {string} format - 格式模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的字符串
 */
export function formatBeijingTime(utcTime, format = 'YYYY-MM-DD HH:mm:ss') {
  const beijingTimestamp = utcToBeijingTimestamp(utcTime)
  const beijingDate = new Date(beijingTimestamp)

  const year = beijingDate.getUTCFullYear()
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(beijingDate.getUTCDate()).padStart(2, '0')
  const hours = String(beijingDate.getUTCHours()).padStart(2, '0')
  const minutes = String(beijingDate.getUTCMinutes()).padStart(2, '0')
  const seconds = String(beijingDate.getUTCSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取北京时间的日期部分（用于分组）
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @returns {string} 日期字符串，格式 'YYYY-MM-DD'
 */
export function getBeijingDate(utcTime) {
  return formatBeijingTime(utcTime, 'YYYY-MM-DD')
}

/**
 * 格式化北京时间为更友好的格式
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @returns {string} 例如: '今天 14:30'、'昨天 08:15'、'周一 18:20'
 */
export function formatFriendlyTime(utcTime) {
  // 转换为北京时间戳（UTC + 8小时）
  const beijingTimestamp = utcToBeijingTimestamp(utcTime)
  const beijingDate = new Date(beijingTimestamp)

  // 当前 UTC 时间戳
  const nowUtcTimestamp = Date.now()

  // 当前北京时间戳（UTC + 8小时）
  const nowBeijingTimestamp = nowUtcTimestamp + 8 * 60 * 60 * 1000
  const nowBeijingDate = new Date(nowBeijingTimestamp)

  // 昨天北京时间戳
  const yesterdayBeijingTimestamp = nowBeijingTimestamp - 24 * 60 * 60 * 1000
  const yesterdayBeijingDate = new Date(yesterdayBeijingTimestamp)

  // 提取日期部分（年月日）用于比较
  const beijingYear = beijingDate.getUTCFullYear()
  const beijingMonth = beijingDate.getUTCMonth()
  const beijingDay = beijingDate.getUTCDate()

  const nowYear = nowBeijingDate.getUTCFullYear()
  const nowMonth = nowBeijingDate.getUTCMonth()
  const nowDay = nowBeijingDate.getUTCDate()

  const yesterdayYear = yesterdayBeijingDate.getUTCFullYear()
  const yesterdayMonth = yesterdayBeijingDate.getUTCMonth()
  const yesterdayDay = yesterdayBeijingDate.getUTCDate()

  // 格式化时间
  const hours = String(beijingDate.getUTCHours()).padStart(2, '0')
  const minutes = String(beijingDate.getUTCMinutes()).padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  // 判断是今天、昨天还是其他
  if (beijingYear === nowYear && beijingMonth === nowMonth && beijingDay === nowDay) {
    return `今天 ${timeStr}`
  } else if (beijingYear === yesterdayYear && beijingMonth === yesterdayMonth && beijingDay === yesterdayDay) {
    return `昨天 ${timeStr}`
  } else {
    // 计算相差天数
    const daysDiff = Math.floor((nowBeijingTimestamp - beijingTimestamp) / (24 * 60 * 60 * 1000))

    if (daysDiff < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const weekday = weekdays[beijingDate.getUTCDay()]
      return `${weekday} ${timeStr}`
    } else {
      const month = beijingDate.getUTCMonth() + 1
      const day = beijingDate.getUTCDate()
      return `${month}月${day}日 ${timeStr}`
    }
  }
}

/**
 * 格式化完整日期时间（北京时间）
 * @param {string|Date} utcTime - UTC 时间字符串或 Date 对象
 * @returns {string} 例如: '2025-01-15 18:30:45'
 */
export function formatFullDateTime(utcTime) {
  return formatBeijingTime(utcTime, 'YYYY-MM-DD HH:mm:ss')
}
