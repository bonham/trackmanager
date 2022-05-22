import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'NoSidPage',
    component: () => import(/* webpackChunkName: "NoSidPage" */ '../views/NoSidPage.vue')
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
    name: 'TrackMultiEditPage',
    component: () => import(/* webpackChunkName: "TrackMultiEdit" */ '../views/TrackMultiEditPage.vue'),
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
