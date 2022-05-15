<template>
  <div class="hello">
    <h1>Welcome</h1>
    <b-form-input
      type="text"
      value="myinput"
    />
  </div>
</template>

<script>
import {
  BFormInput
} from 'bootstrap-vue'
export default {
  name: 'HelloBoot',
  components: {
    BFormInput
  }
}
</script>
