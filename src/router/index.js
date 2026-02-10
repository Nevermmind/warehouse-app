import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Warehouse from '../views/Warehouse.vue'
import Rules from '../views/Rules.vue'
import CategoryManagement from '../views/CategoryManagement.vue'
import FartTracker from '../views/FartTracker.vue'
import CommuteTracker from '../views/CommuteTracker.vue'
import CommuteCheckins from '../views/CommuteCheckins.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/warehouse',
    name: 'Warehouse',
    component: Warehouse
  },
  {
    path: '/rules',
    name: 'Rules',
    component: Rules
  },
  {
    path: '/categories',
    name: 'CategoryManagement',
    component: CategoryManagement
  },
  {
    path: '/fart-tracker',
    name: 'FartTracker',
    component: FartTracker
  },
  {
    path: '/commute-tracker',
    name: 'CommuteTracker',
    component: CommuteTracker
  },
  {
    path: '/commute-checkins',
    name: 'CommuteCheckins',
    component: CommuteCheckins
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
