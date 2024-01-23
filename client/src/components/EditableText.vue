<template>
  <div>
    <div v-show="!editing" :class="{ 'editable-empty': valueIsEmptyOrWhitespace }" @click="makeEditable">
      <i-bi-pencil-fill />
      {{ valueOrEmptyPlaceholder }}
    </div>
    <div v-show="editing">
      <b-form-textarea v-if="textarea" ref="inputref" v-model="textLocal" rows="2" max-rows="20" type="textarea"
        class="form-control overflow-hidden" @change="processValueChange" @blur="processBlur"
        @keydown.enter="processEnter" />
      <b-form-input v-else ref="inputref" v-model="textLocal" type="text" @change="processValueChange" @blur="processBlur"
        @keydown.enter="processEnter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BFormTextarea,
  BFormInput
} from 'bootstrap-vue-next'

import { ref, computed, nextTick, watch } from 'vue'

/*
The value of form input or textarea dom elements can not be synchronized with a prop.
Therefore there are two values
a) textProp
b) textLocal

a) is the prop, b) is synchronized with the text value in the dom element ( input or textarea )

This is the  process:

Component initialization: textLocal is initialized from textProp
During component lifetime: But if parent component wants to set textLocal again from textProp, it needs
to increment the value of `setLocalValueFromProp`.

Value change of dom element from within EditableText is handled in `processValueChange` and calls props.updateFunction(v)
The parent element is owning updateFunction() and is responsible to persist the new text value and handle success and failure.
On failure to persist, the parent component needs to use setLocalValueFromProp to reset dom element text to old value.
*/

const props = defineProps({
  textProp: {
    type: String,
    required: true
  },
  setLocalValueFromProp: {
    type: Number,
    required: true,
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

// initial value of text field
const textLocal = ref(props.textProp)

// prepare for watch
const setLocalValueFromProp = computed(() => props.setLocalValueFromProp)

// trigger update of dom text by setting setLocalValueFromProp to nonzero
watch(setLocalValueFromProp, () => {
  console.log("Update of text value triggered")
  textLocal.value = props.textProp
})

const inputref = ref<InstanceType<typeof BFormTextarea>>()

function makeEditable() {
  editing.value = true

  nextTick(() => {
    if (inputref.value == undefined) {
      console.warn("Warn, could not set focus")
    } else {
      (inputref.value).focus()
    }
  }).catch((err) => {
    console.error("Error in nextTick", err)
  })
}

function processValueChange(value: string) {
  const inputValue = value
  console.log('change', inputValue)
  // call the update function which was injected through props
  props.updateFunction(inputValue)
}

function processEnter(event: KeyboardEvent) {
  const value = (event.target as HTMLInputElement).value
  const valueNoWhiteSpace = value.trim()
  processValueChange(valueNoWhiteSpace)
  editing.value = false
}
function processBlur() {
  console.log("Blur event. Localvalue", textLocal.value)
  editing.value = false
  //processValueChange(localValue.value) // this does not work ;-(
}

// boolean value to decide if there is a text in the cell or not
const valueIsEmptyOrWhitespace = computed(() => {
  const isEmptyString = (textLocal.value === '')
  const wsRegex = /^\s+$/
  const isWhitespace = wsRegex.test(textLocal.value)
  return (isEmptyString || isWhitespace)
})

// if there is no text in this cell, then show 'No Name'
const valueOrEmptyPlaceholder = computed(() => {
  if (valueIsEmptyOrWhitespace.value) {
    return 'No Name'
  } else {
    return textLocal.value
  }
})

</script>

<style scoped>
.editable-empty {
  opacity: 0.5;
  font-style: italic;
}
</style>
