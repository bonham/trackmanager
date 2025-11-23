<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <b-container id="root" class="d-flex flex-column vh-100 gx-0 border">
    <login-modal />
    <div class="bg-light d-flex flex-column vh-100">
      <nav class="navbar navbar-expand bg-success-subtle border-bottom py-1">
        <div class="container-fluid">
          <!-- <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button> -->
          <!-- <div id="navbarNavAltMarkup" class="collapse navbar-collapse"> -->
          <a class="navbar-brand" to="#"><i-bi-compass-fill /></a>
          <div class="navbar-collapse">
            <ul class="navbar-nav">
              <li class="nav-item">
                <router-link class="nav-link my-1" :to="navPath('/trackmap')">
                  Map
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link my-1" :to="navPath('/toverview')">
                  List
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link my-1" :to="navPath('/progress')">
                  Progress
                </router-link>
              </li>
              <li class="nav-item">
                <router-link v-if="userLoginStore.loggedIn" class="nav-link my-1" :to="navPath('/track_multi_edit')">
                  Edit
                </router-link>
              </li>
              <li class="nav-item">
                <router-link v-if="userLoginStore.loggedIn" class="nav-link my-1" :to="navPath('/upload')">
                  Upload
                </router-link>
              </li>
            </ul>
          </div>
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link v-if="userLoginStore.loggedIn" class="nav-link my-1" to="#"
                @click="userLoginStore.logout()">Logout</router-link>
              <router-link v-else class="nav-link my-1" to="" @click="triggerLoginF()">
                Login
              </router-link>
            </li>
          </ul>
          <!-- </div> -->
        </div>
      </nav>
      <slot></slot>
    </div>
  </b-container>
</template>

<script setup lang="ts">
import { BContainer } from 'bootstrap-vue-next'
import { useUserLoginStore } from '@/stores/userlogin'
import LoginModal from '@/components/auth/LoginModal.vue'

const userLoginStore = useUserLoginStore()

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

function triggerLoginF() {
  userLoginStore.triggerLoginVar++
}

</script>

<style lang="scss">
a,
a:visited {

  &.router-link-exact-active {
    color: #42b983;
  }
}

.navbar-toggler-icon {
  height: 1em !important;
  width: 1em
    /* Adjust this value to your preference */
}
</style>
