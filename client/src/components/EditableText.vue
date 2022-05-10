<template>
  <span>
    <span
      v-show="!editing"
      @click="makeEditable"
    >
      {{ value }}
    </span>
    <span v-show="editing">
      <input
        id="xyz"
        ref="inputref"
        v-model="value"
        type="text"
        class="form-control"
        @change="processValueChange"
      >
    </span>
  </span>
</template>
<script>

export default {
  props:
    {
      initialtext: {
        type: String,
        default: '',
        required: false
      },
      updateFunction: {
        type: Function,
        default: function () {},
        required: false
      }
    },
  data () {
    return {
      editing: false,
      value: ''
    }
  },
  created () {
    this.value = this.initialtext
  },
  methods: {
    makeEditable: function () {
      this.editing = true
      this.$nextTick(() => {
        this.$refs.inputref.focus()
      })
    },
    processValueChange (event) {
      const inputValue = event.target.value // same as this.value
      console.log('change', inputValue)
      this.updateFunction(inputValue)
      this.editing = false
    }
  }
}
</script>
