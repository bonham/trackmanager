<template>
  <div>
    <h1 class="mt-4 mb-4">
      Track Overview
    </h1>
    <TrackOverview />
  </div>
</template>

<script>
export default {
  name: 'TrackOverviewPage',
  components: {
    TrackOverview: () => import(/* webpackChunkName: "TrackOverView" */ '@/components/TrackOverview.vue')
  }
}
</script>
