import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import { startOfDay, subDays } from 'date-fns'

export function useFartRecords() {
  const records = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 加载记录（带日期范围过滤）
  async function loadRecords(userId, startDate = null, endDate = null) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('fart_records')
        .select(`
          *,
          sound_word: fart_sound_words (*)
        `)
        .order('record_time', { ascending: false })

      if (startDate) {
        query = query.gte('record_time', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('record_time', endDate.toISOString())
      }

      const { data, error: err } = await query

      if (err) throw err
      records.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('加载记录失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 快速记录
  async function quickRecord(userId, soundLevel, isSmelly, soundWordId = null) {
    try {
      const { data, error: err } = await supabase
        .from('fart_records')
        .insert({
          user_id: userId,
          record_time: new Date().toISOString(),
          sound_level: soundLevel,
          is_smelly: isSmelly,
          sound_word_id: soundWordId
        })
        .select()
        .single()

      if (err) throw err

      records.value.unshift(data)
      return data
    } catch (err) {
      console.error('记录失败:', err)
      throw err
    }
  }

  // 补录
  async function backfill(userId, recordData) {
    try {
      const { data, error: err } = await supabase
        .from('fart_records')
        .insert({
          user_id: userId,
          ...recordData
        })
        .select()
        .single()

      if (err) throw err

      records.value.unshift(data)
      return data
    } catch (err) {
      console.error('补录失败:', err)
      throw err
    }
  }

  // 删除记录
  async function deleteRecord(id) {
    try {
      const { error: err } = await supabase
        .from('fart_records')
        .delete()
        .eq('id', id)

      if (err) throw err

      records.value = records.value.filter(r => r.id !== id)
    } catch (err) {
      console.error('删除失败:', err)
      throw err
    }
  }

  // 更新记录
  async function updateRecord(id, updateData) {
    try {
      const { data, error: err } = await supabase
        .from('fart_records')
        .update({
          sound_level: updateData.sound_level,
          is_smelly: updateData.is_smelly,
          notes: updateData.notes,
          sound_word_id: updateData.sound_word_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      // 更新本地数据
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1 && data) {
        records.value[index] = data
      }

      return data
    } catch (err) {
      console.error('更新记录失败:', err)
      throw err
    }
  }

  // 统计数据
  // days: 统计最近几天（例如 1 = 从昨天0点到现在，0 = 今天0点到现在）
  function getStats(days = 7) {
    const now = new Date()
    // 使用 startOfDay 获取当天的开始时间（自动处理时区）
    // days=0 表示今天，days=1 表示从昨天开始
    const startDate = startOfDay(subDays(now, days))

    const filtered = records.value.filter(r => {
      // 将记录时间转换为本地 Date 对象，然后比较时间戳
      const recordDate = new Date(r.record_time)
      return recordDate.getTime() >= startDate.getTime()
    })

    return {
      total: filtered.length,
      smelly: filtered.filter(r => r.is_smelly).length,
      avgSoundLevel: filtered.length > 0
        ? (filtered.reduce((sum, r) => sum + r.sound_level, 0) / filtered.length).toFixed(1)
        : 0
    }
  }

  return {
    records,
    loading,
    error,
    loadRecords,
    quickRecord,
    backfill,
    deleteRecord,
    updateRecord,
    getStats
  }
}
