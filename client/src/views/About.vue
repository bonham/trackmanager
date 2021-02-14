<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div>
      x y z
    </div>
    <HelloWorld></HelloWorld>
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'
export default {
  name: 'About',
  components: {
    HelloWorld
  }
}
</script>
