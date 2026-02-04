import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export function useCommuteRecords() {
  const workRecords = ref([])
  const homeRecords = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 加载所有记录
  async function loadRecords(userId) {
    loading.value = true
    error.value = null

    try {
      const { data, err } = await supabase
        .from('commute_records')
        .select(`
          *,
          route:commute_routes (*)
        `)
        .order('record_date', { ascending: false })
        .order('departure_time', { ascending: false })

      if (err) throw err

      workRecords.value = data.filter(r => r.commute_type === 'work')
      homeRecords.value = data.filter(r => r.commute_type === 'home')
    } catch (err) {
      error.value = err.message
      console.error('加载通勤记录失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 添加记录
  async function addRecord(userId, recordData) {
    try {
      const { data, error: err } = await supabase
        .from('commute_records')
        .insert({
          user_id: userId,
          record_date: recordData.recordDate,
          commute_type: recordData.commuteType,
          departure_time: recordData.departureTime,
          arrival_time: recordData.arrivalTime,
          route_id: recordData.routeId || null,
          weather: recordData.weather || null,
          notes: recordData.notes || null,
          is_school_holiday: recordData.isSchoolHoliday || false
        })
        .select(`
          *,
          route:commute_routes (*)
        `)
        .single()

      if (err) throw err

      if (recordData.commuteType === 'work') {
        workRecords.value.unshift(data)
      } else {
        homeRecords.value.unshift(data)
      }

      return data
    } catch (err) {
      console.error('添加记录失败:', err)
      throw err
    }
  }

  // 更新记录
  async function updateRecord(id, recordData) {
    try {
      const { data, error: err } = await supabase
        .from('commute_records')
        .update({
          record_date: recordData.recordDate,
          departure_time: recordData.departureTime,
          arrival_time: recordData.arrivalTime,
          route_id: recordData.routeId || null,
          weather: recordData.weather || null,
          notes: recordData.notes || null,
          is_school_holiday: recordData.isSchoolHoliday || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          route:commute_routes (*)
        `)
        .single()

      if (err) throw err

      // 更新本地数据
      const updateList = (list) => {
        const index = list.findIndex(r => r.id === id)
        if (index !== -1) {
          list[index] = data
        }
      }

      updateList(workRecords.value)
      updateList(homeRecords.value)

      return data
    } catch (err) {
      console.error('更新记录失败:', err)
      throw err
    }
  }

  // 删除记录
  async function deleteRecord(id) {
    try {
      const { error: err } = await supabase
        .from('commute_records')
        .delete()
        .eq('id', id)

      if (err) throw err

      workRecords.value = workRecords.value.filter(r => r.id !== id)
      homeRecords.value = homeRecords.value.filter(r => r.id !== id)
    } catch (err) {
      console.error('删除记录失败:', err)
      throw err
    }
  }

  return {
    workRecords,
    homeRecords,
    loading,
    error,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord
  }
}
