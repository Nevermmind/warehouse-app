import { ref } from 'vue'
import { supabase } from '../utils/supabase'

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

  // 统计数据
  function getStats(days = 7) {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - days)

    const filtered = records.value.filter(r =>
      new Date(r.record_time) >= startDate
    )

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
    getStats
  }
}
