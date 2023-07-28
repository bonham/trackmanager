<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <nav class="navbar navbar-expand-sm shadow-sm bg-white border-bottom  ">
      <div class="container-fluid">
        <!-- <a class="navbar-brand" to="#">TrckM</a> -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="navbarNavAltMarkup" class="collapse navbar-collapse">
          <div class="navbar-nav">
            <router-link class="nav-link m-2" :to="navPath('/select_tracks')">
              Map
            </router-link>
            <router-link class="nav-link m-2" :to="navPath('/tracklist')">
              Tracks
            </router-link>
            <router-link class="nav-link m-2" :to="navPath('/toverview')">
              By Year
            </router-link>
            <router-link class="nav-link m-2" :to="navPath('/track_multi_edit')">
              Edit
            </router-link>
            <router-link class="nav-link m-2" :to="navPath('/upload')">
              Upload
            </router-link>
            <router-link class="nav-link m-2" :to="navPath('/login')">
              Login
            </router-link>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">


const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

function navPath(path: string) {
  const pathSid = `${path}/sid/${props.sid}`
  return {
    path: pathSid
  }
}

</script>

<style lang="scss">
nav {

  a {

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
