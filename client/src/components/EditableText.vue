/* eslint-disable vue/no-v-html */
<template>
  <div>
    <div
      v-show="!editing"
      :class="{ 'editable-empty' : valueIsEmptyOrWhitespace }"
      @click="makeEditable"
    >
      <i-bi-pencil-fill />
      {{ valueOrEmptyPlaceholder }}
    </div>
    <div v-show="editing">
      <b-form-textarea
        v-if="textarea"
        ref="inputref"
        v-model="value"
        rows="2"
        max-rows="20"
        type="textarea"
        class="form-control overflow-hidden"
        @change="processValueChange"
        @blur="processBlur"
        @keydown.enter="processEnter"
      />
      <b-form-input
        v-else
        ref="inputref"
        v-model="value"
        type="text"
        @blur="processBlur"
        @change="processValueChange"
        @keydown.enter="processEnter"
      />
    </div>
  </div>
</template>
<script>
import {
  BFormTextarea, BFormInput
} from 'bootstrap-vue-next'
export default {
  components: {
    BFormTextarea,
    BFormInput
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
      },
      textarea: {
        type: Boolean,
        default: false,
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
  computed: {
    valueOrEmptyPlaceholder () {
      if (this.valueIsEmptyOrWhitespace) {
        return 'No Name'
      } else {
        return this.value
      }
    },
    valueIsEmptyOrWhitespace () {
      const isEmptyString = (this.value === '')
      const wsRegex = /^\s+$/
      const isWhitespace = wsRegex.test(this.value)
      return (isEmptyString || isWhitespace)
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

    processValueChange (value) {
      const inputValue = value
      console.log('change', inputValue)
      this.updateFunction(inputValue)
    },
    processEnter (event) {
      const value = event.target.value
      const valueNoWhiteSpace = value.trim()
      this.processValueChange(valueNoWhiteSpace)
      this.editing = false
    },
    processBlur (event) {
      this.editing = false
    }
  }
}
</script>
<style scoped>
.editable-empty {
  opacity: 0.5;
  font-style: italic;
}
</style>
