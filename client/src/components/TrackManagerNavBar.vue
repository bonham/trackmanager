<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <b-navbar class="shadow-sm" toggleable="sm">
      <b-navbar-brand href="#">Trackmanager</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="my-2 my-md-0 mr-md-3">
          <b-nav-item-dropdown id="dropdown-1" text="Filter" toggle-class="nav-link-custom" right class="p-2">
            <b-dropdown-item :to="navPath('/select_tracks')" class="p-2">Year</b-dropdown-item>
            <b-dropdown-item class="p-2" disabled>Text</b-dropdown-item>
            <b-dropdown-item class="p-2" disabled>Area</b-dropdown-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown id="dropdown-2" text="List" toggle-class="nav-link-custom" right class="p-2">
            <b-nav-item :to="navPath('/toverview')" class="p-2">
              Sections
            </b-nav-item>
            <b-nav-item :to="navPath('/tracklist')" class="p-2">
              Flat
            </b-nav-item>
          </b-nav-item-dropdown>

          <b-nav-item-dropdown id="dropdown-3" text="Maintain" toggle-class="nav-link-custom" right class="p-2">
            <b-nav-item :to="navPath('/track_multi_edit')" class="p-2 ">
              Edit
            </b-nav-item>
            <b-nav-item :to="navPath('/upload')" class="p-2 ">
              Upload
            </b-nav-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script lang="ts">
import { BNavbar, BNavbarNav, BNavbarToggle, BNavbarBrand, BCollapse, BNavItem, BNavItemDropdown, BDropdownItem } from 'bootstrap-vue-next'

export default {
  name: 'TrackManagerNavBar',
  components: {
    BNavbar,
    BNavbarNav,
    BNavbarToggle,
    BNavbarBrand,
    BCollapse,
    BNavItem,
    BNavItemDropdown,
    BDropdownItem
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  methods: {
    navPath(path: string) {
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
</style>
