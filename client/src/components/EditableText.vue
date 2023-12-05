<template>
  <div>
    <div v-show="!editing" :class="{ 'editable-empty': valueIsEmptyOrWhitespace }" @click="makeEditable">
      <i-bi-pencil-fill />
      {{ valueOrEmptyPlaceholder }}
    </div>
    <div v-show="editing">
      <b-form-textarea v-if="textarea" ref="inputref" v-model="value" rows="2" max-rows="20" type="textarea"
        class="form-control overflow-hidden" @change="processValueChange" @blur="processBlur"
        @keydown.enter="processEnter" />
      <b-form-input v-else ref="inputref" v-model="value" type="text" @blur="processBlur" @change="processValueChange"
        @keydown.enter="processEnter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BFormTextarea,
  BFormInput
} from 'bootstrap-vue-next'

import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  initialtext: {
    type: String,
    default: '',
    required: false
  },
  updateFunction: {
    type: Function,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    default: () => { },
    required: false
  },
  textarea: {
    type: Boolean,
    default: false,
    required: false
  }
})

const editing = ref(false)
const value = ref(props.initialtext)
const inputref = ref(null)

function makeEditable() {
  editing.value = true

  nextTick(() => {
    (inputref.value as any).focus()
  })
}

function processValueChange(value: string) {
  const inputValue = value
  console.log('change', inputValue)
  props.updateFunction(inputValue)
}

function processEnter(event: KeyboardEvent) {
  const value = (event.target as HTMLInputElement).value
  const valueNoWhiteSpace = value.trim()
  processValueChange(valueNoWhiteSpace)
  editing.value = false
}
function processBlur() {
  editing.value = false
}

const valueOrEmptyPlaceholder = computed(() => {
  if (valueIsEmptyOrWhitespace.value) {
    return 'No Name'
  } else {
    return value.value
  }
})
const valueIsEmptyOrWhitespace = computed(() => {
  const isEmptyString = (value.value === '')
  const wsRegex = /^\s+$/
  const isWhitespace = wsRegex.test(value.value)
  return (isEmptyString || isWhitespace)
})

</script>

<style scoped>
.editable-empty {
  opacity: 0.5;
  font-style: italic;
}
</style>
