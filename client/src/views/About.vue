<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div>
      x y z
    </div>
    <HelloWorld2 />
  </div>
</template>

<script>
import HelloWorld2 from '@/components/HelloWorld2.vue'
export default {
  name: 'About',
  components: {
    HelloWorld2
  }
}
</script>
