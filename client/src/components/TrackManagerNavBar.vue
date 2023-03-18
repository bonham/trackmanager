<template>
  <div>
    <b-navbar
      class="shadow-sm bg-white border-bottom"
    >
      <b-navbar-nav class="my-2 my-md-0 mr-md-3">
        <b-nav-item
          :to="navPath('/select_tracks')"
          class="
          p-2
          text-dark"
        >
          Map
        </b-nav-item>
        <b-nav-item
          :to="navPath('/tracklist')"
          class="
          p-2
          text-dark"
        >
          Tracks
        </b-nav-item>
        <b-nav-item
          :to="navPath('/toverview')"
          class="p-2 text-dark"
        >
          By Year
        </b-nav-item>
        <b-nav-item
          :to="navPath('/track_multi_edit')"
          class="p-2 text-dark"
        >
          Edit
        </b-nav-item>
        <b-nav-item
          :to="navPath('/upload')"
          class="p-2 text-dark"
        >
          Upload
        </b-nav-item>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { BNavbar, BNavbarNav, BNavItem } from 'bootstrap-vue-next'

export default {
  name: 'TrackManagerNavBar',
  components: {
    BNavbar,
    BNavbarNav,
    BNavItem
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  methods: {
    navPath (path) {
      const pathSid = `${path}/sid/${this.sid}`
      return {
        path: pathSid
      }
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
