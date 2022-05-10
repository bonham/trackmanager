<template>
  <span>
    <span
      v-show="!editing"
      @click="editing=true"
    >
      {{ text }}
    </span>
    <span v-show="editing">
      <input
        :value="text"
        type="text"
        @keydown.enter="editing=false"
      >
    </span>
  </span>
</template>
<script>
export default {
  props:
    {
      text: {
        type: String,
        default: '',
        required: false
      }
    },
  data () {
    return {
      editing: false
    }
  }
}
</script>
