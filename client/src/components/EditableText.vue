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

Props and Refs:

The value of form input or textarea dom elements can not be synchronized with a prop.
Therefore there are two values

a) textProp ( initial value and during runtime, a 'to be' value)
b) textLocal ( ref )

a) is the prop, b) is synchronized with the text value in the dom element ( input or textarea )

This is the  process:

- Component initialization: textLocal is initialized from textProp

- In non edit mode, during runtime:  textProp is changing, a watcher will update textLocal and thus update dom

- Edit mode: Change from within EditableText

  When user klicks edit few things can happen
    a) User does not change text and klicks away -> Blur event only
    b) User does not change text and press Enter -> Enter event and Blur Event
    c) User changes text and press Enter -> Enter Event + Change event + Blur event
    d) User changes text and klicks away  -> Change event + Blur Event
  A value change of dom element from within EditableText is handled in `processValueChange` and calls props.updateFunction(v)
The parent element is owning updateFunction() and returns true for successful update and false for no success.
On failure - editable text makes sure to set dom text value to prop value

In other cases where parent element wants to update dom text from prop - there is a trick: set editing to true and then to false
to force re-rendering
*/

interface UpdateFunction {
  (v: string): Promise<boolean>
}

const props = defineProps({
  textProp: {
    type: String,
    required: true
  },
  // function injected from parent to persist the value change after 'enter' or moving focus somewhere else ( blur )
  // The function provided, should return true if backend update was successful. false otherwise.
  updateFunction: {
    type: Function,
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    default: async (v: string) => Promise.resolve(true),
    required: false
  },
  // specifies type of form field: true: textarea, false: input 
  textarea: {
    type: Boolean,
    default: false,
    required: false
  }
})

const editing = ref(false)

// initial value of text field
const textLocal = ref(props.textProp)

// all change of props should change textLocal
watch(() => props.textProp, (newValue) => { // this is how to watch a property of an object - see https://vuejs.org/guide/essentials/watchers.html
  if ((typeof newValue === 'string')) {
    textLocal.value = newValue
  } else {
    console.error("Should not happen")
    return
  }
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

async function processValueChange(inputValue: string) {
  try {
    console.log('Process value change:', inputValue)

    const valueNoWhiteSpace = inputValue.trim()

    // call the update function which was injected through props
    const success = await (props.updateFunction as UpdateFunction)(valueNoWhiteSpace) // dirty cast

    if (success) {
      // on success make sure dom text value is also trimmed
      textLocal.value = valueNoWhiteSpace
    } else {
      // on failure, reset the dom element value
      textLocal.value = props.textProp
    }
  } catch (e) {
    console.error(e)
  } finally {
    editing.value = false
  }
}

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
async function processEnter(event: KeyboardEvent) {
  console.log("Process Enter")
  // In case user is not changing the value, then 'processValueChange will not be triggered
  // Also Blur will not be triggered by itself.

  // Still we need to leave 'edit' mode
  editing.value = false // this will trigger blur event because dom element changing 

}
function processBlur() {
  console.log("Blur event. Localvalue", textLocal.value)
  editing.value = false
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
