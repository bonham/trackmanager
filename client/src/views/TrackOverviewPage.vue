<template>
  <b-container>
    <track-manager-nav-bar />
    <h1 class="mt-4 mb-4">
      Track Overview
    </h1>
    <TrackOverview />
  </b-container>
</template>

<script>
import { BContainer } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
export default {
  name: 'TrackOverviewPage',
  components: {
    TrackOverview: () => import(/* webpackChunkName: "TrackOverView" */ '@/components/TrackOverview.vue'),
    TrackManagerNavBar,
    BContainer
  }
}
</script>
