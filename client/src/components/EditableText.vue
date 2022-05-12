<template>
  <div>
    <div
      v-show="!editing"
      @click="makeEditable"
    >
      {{ value === '' ? "&lt;empty&gt;" : value }}
    </div>
    <div v-show="editing">
      <b-form-textarea
        id="textarea-auto-height"
        ref="inputref"
        v-model="value"
        placeholder="Track Name"
        rows="2"
        max-rows="20"
        type="textarea"
        class="form-control overflow-hidden"
        @change="processValueChange"
        @blur="processBlur"
        @keydown.enter="processEnter"
      />
    </div>
  </div>
</template>
<script>
import {
  BFormTextarea
} from 'bootstrap-vue'
export default {
  components: {
    BFormTextarea
  },
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
  emits: {
    blur
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
      // const inputValue = event.target.value // same as this.value
      const inputValue = event
      console.log('change', inputValue)
      this.updateFunction(inputValue)
    },
    processEnter (event) {
      const value = event.target.value
      this.processValueChange(value)
      this.editing = false
    },
    processBlur (event) {
      this.editing = false
      this.$emit('blur')
    }
  }
}
</script>
