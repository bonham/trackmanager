import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    alias: '/toverview',
    name: 'TrackOverviewPage',
    component: () => import(/* webpackChunkName: "TrackOverViewPage" */ '../views/TrackOverviewPage.vue')
  },
  {
    path: '/upload',
    name: 'UploadPage',
    component: () => import(/* webpackChunkName: "TrackOverViewPage" */ '../views/UploadPage.vue')
  },
  {
    path: '/track/:id',
    name: 'TrackDetail',
    component: () => import(/* webpackChunkName: "TrackDetail" */ '../views/TrackDetail.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
