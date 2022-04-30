import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const DEFAULT_SID = Vue.config.devtools ? '8pz22a' : ''
const routes = [
  {
    path: '/',
    redirect: `/select_tracks/sid/${DEFAULT_SID}`
  },
  {
    path: '/select_tracks/sid/:sid',
    name: 'SelectTracksPage',
    component: () => import(/* webpackChunkName: "SelectTracksPage" */ '../views/SelectTracksPage.vue'),
    props: true
  },
  {
    path: '/toverview/sid/:sid',
    name: 'TrackOverviewPage',
    component: () => import(/* webpackChunkName: "TrackOverViewPage" */ '../views/TrackOverviewPage.vue'),
    props: true
  },
  {
    path: '/upload/sid/:sid',
    name: 'UploadPage',
    component: () => import(/* webpackChunkName: "UploadPage" */ '../views/UploadPage.vue'),
    props: true
  },
  {
    path: '/track_multi_edit/sid/:sid',
    name: 'TrackMultiEdit',
    component: () => import(/* webpackChunkName: "TrackMultiEdit" */ '../views/TrackMultiEdit.vue'),
    props: true
  },
  {
    path: '/track/:id/sid/:sid',
    name: 'TrackDetailPage',
    component: () => import(/* webpackChunkName: "TrackDetail" */ '../views/TrackDetailPage.vue'),
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
