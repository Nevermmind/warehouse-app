import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export function useCommuteRoutes() {
  const workRoutes = ref([])
  const homeRoutes = ref([])
  const loading = ref(false)

  async function loadRoutes(userId) {
    loading.value = true

    try {
      const { data, err } = await supabase
        .from('commute_routes')
        .select('*')
        .order('route_name')

      if (err) throw err

      workRoutes.value = data.filter(r => r.route_type === 'work')
      homeRoutes.value = data.filter(r => r.route_type === 'home')
    } catch (err) {
      console.error('加载路线失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function addRoute(userId, routeType, routeData) {
    try {
      const { data, error: err } = await supabase
        .from('commute_routes')
        .insert({
          user_id: userId,
          route_type: routeType,
          route_name: routeData.routeName,
          start_point: routeData.startPoint,
          end_point: routeData.endPoint,
          notes: routeData.notes || null
        })
        .select()
        .single()

      if (err) throw err

      if (routeType === 'work') {
        workRoutes.value.push(data)
      } else {
        homeRoutes.value.push(data)
      }

      return data
    } catch (err) {
      console.error('添加路线失败:', err)
      throw err
    }
  }

  async function updateRoute(id, routeType, routeData) {
    try {
      const { data, error: err } = await supabase
        .from('commute_routes')
        .update({
          route_name: routeData.routeName,
          start_point: routeData.startPoint,
          end_point: routeData.endPoint,
          notes: routeData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      const updateList = (list) => {
        const index = list.findIndex(r => r.id === id)
        if (index !== -1) {
          list[index] = data
        }
      }

      updateList(workRoutes.value)
      updateList(homeRoutes.value)

      return data
    } catch (err) {
      console.error('更新路线失败:', err)
      throw err
    }
  }

  async function deleteRoute(id, routeType) {
    try {
      const { error: err } = await supabase
        .from('commute_routes')
        .delete()
        .eq('id', id)

      if (err) throw err

      if (routeType === 'work') {
        workRoutes.value = workRoutes.value.filter(r => r.id !== id)
      } else {
        homeRoutes.value = homeRoutes.value.filter(r => r.id !== id)
      }
    } catch (err) {
      console.error('删除路线失败:', err)
      throw err
    }
  }

  return {
    workRoutes,
    homeRoutes,
    loading,
    loadRoutes,
    addRoute,
    updateRoute,
    deleteRoute
  }
}
