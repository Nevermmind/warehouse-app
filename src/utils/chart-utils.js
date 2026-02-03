import { format, subDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 生成日期范围
 * @param {number} days - 天数
 * @returns {Array<Date>} 日期数组
 */
export function generateDateRange(days) {
  const dates = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    dates.push(startOfDay(subDays(today, i)))
  }

  return dates
}

/**
 * 按日期分组统计记录
 * @param {Array} records - 记录数组
 * @param {number} days - 天数
 * @returns {Object} 日期标签数组和数据数组
 */
export function groupRecordsByDate(records, days) {
  const dateRange = generateDateRange(days)
  const dateLabels = []
  const data = []

  // 格式化日期标签
  dateRange.forEach(date => {
    const today = new Date()
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      dateLabels.push('今天')
    } else if (diffDays === 1) {
      dateLabels.push('昨天')
    } else {
      dateLabels.push(format(date, 'M/d', { locale: zhCN }))
    }

    // 统计当天记录数
    const dayStart = date.toISOString()
    const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString()

    const count = records.filter(record => {
      return record.record_time >= dayStart && record.record_time < dayEnd
    }).length

    data.push(count)
  })

  return { labels: dateLabels, data }
}

/**
 * 按拟声词分组统计记录
 * @param {Array} records - 记录数组
 * @param {number} days - 天数
 * @returns {Object} 拟声词标签数组和数据数组
 */
export function groupRecordsBySoundWord(records, days) {
  const now = new Date()
  const startDate = subDays(startOfDay(now), days)
  const startDateStr = startDate.toISOString()

  // 过滤指定天数内的记录
  const filteredRecords = records.filter(record => {
    return record.record_time >= startDateStr
  })

  // 统计每个拟声词的出现次数
  const wordCounts = {}

  filteredRecords.forEach(record => {
    if (record.sound_word) {
      const word = record.sound_word.word
      const pinyin = record.sound_word.pinyin
      const tone = record.sound_word.tone

      const key = `${word}(${pinyin})`

      if (!wordCounts[key]) {
        wordCounts[key] = {
          label: `${word} (${getToneLabel(tone)})`,
          count: 0
        }
      }

      wordCounts[key].count++
    } else {
      // 没有拟声词的记录
      if (!wordCounts['无拟声词']) {
        wordCounts['无拟声词'] = {
          label: '无拟声词',
          count: 0
        }
      }
      wordCounts['无拟声词'].count++
    }
  })

  // 转换为数组并排序（取前8个）
  const sortedWords = Object.values(wordCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    labels: sortedWords.map(w => w.label),
    data: sortedWords.map(w => w.count)
  }
}

/**
 * 获取声调标签
 */
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
