<script setup>
import { RouterView } from 'vue-router'

function keepThisAlive(c) {
  const name = c?.type?.__name
  console.log("Component:", name)
  if (name === "TrackMapPage") {
    console.log("false")
    return false
  } else {
    return true
  }

}
</script>

<template>
  <router-view v-slot="{ Component }">
    <div v-if="keepThisAlive(Component)">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </div>
    <div v-else>
      <component :is="Component" />
    </div>
  </router-view>
</template>

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
