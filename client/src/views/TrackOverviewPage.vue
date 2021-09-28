<template>
  <div>
    <track-manager-nav-bar />
    <h1 class="mt-4 mb-4">
      Track Overview
    </h1>
    <TrackOverview />
  </div>
</template>

<script>
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
export default {
  name: 'TrackOverviewPage',
  components: {
    TrackOverview: () => import(/* webpackChunkName: "TrackOverView" */ '@/components/TrackOverview.vue'),
    TrackManagerNavBar
  }
}
</script>
