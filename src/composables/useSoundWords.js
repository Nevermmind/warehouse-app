import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export function useSoundWords() {
  const words = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 加载拟声词库（共享拟声词 + 用户自己的拟声词）
  async function loadWords(userId) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('fart_sound_words')
        .select('*')
        .or(`user_id.eq.00000000-0000-0000-0000-000000000001,user_id.eq.${userId}`)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (err) throw err
      words.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('加载拟声词失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 添加拟声词（添加到用户自己的 ID）
  async function addWord(userId, wordData) {
    try {
      const { data, error: err } = await supabase
        .from('fart_sound_words')
        .insert({
          user_id: userId,
          ...wordData
        })
        .select()
        .single()

      if (err) throw err

      words.value.push(data)
      return data
    } catch (err) {
      console.error('添加拟声词失败:', err)
      throw err
    }
  }

  // 更新拟声词
  async function updateWord(id, wordData) {
    try {
      console.log('更新拟声词:', id, wordData)

      const { data, error: err } = await supabase
        .from('fart_sound_words')
        .update(wordData)
        .eq('id', id)
        .select()

      console.log('更新结果:', data, err)

      if (err) throw err

      // 更新本地数组
      const index = words.value.findIndex(w => w.id === id)
      if (index !== -1 && data && data.length > 0) {
        words.value[index] = data[0]
        console.log('本地数组已更新:', words.value[index])
      }

      return data && data.length > 0 ? data[0] : null
    } catch (err) {
      console.error('更新拟声词失败:', err)
      throw err
    }
  }

  // 删除拟声词（软删除）
  async function deleteWord(id) {
    try {
      const { error: err } = await supabase
        .from('fart_sound_words')
        .update({ is_active: false })
        .eq('id', id)

      if (err) throw err

      words.value = words.value.filter(w => w.id !== id)
    } catch (err) {
      console.error('删除拟声词失败:', err)
      throw err
    }
  }

  // 获取声调标签
  function getToneLabel(tone) {
    const toneMap = {
      1: '第一声',
      2: '第二声',
      3: '第三声',
      4: '第四声',
      5: '第五声'
    }
    return toneMap[tone] || ''
  }

  return {
    words,
    loading,
    error,
    loadWords,
    addWord,
    updateWord,
    deleteWord,
    getToneLabel
  }
}
