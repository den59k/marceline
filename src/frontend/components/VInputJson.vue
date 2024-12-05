<template>
  <VFormControl outline class="v-input-json" :error="error">
    <slot name="start-adornment"></slot>
    <textarea v-model="model" ref="inputRef" class="v-input-json__textarea" rows="1">

    </textarea>
    <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import { computed, ref, Ref } from 'vue';
import VFormControl from './VFormControl.vue';
import { useTextareaAutosize, useVModel, watchDebounced } from '@vueuse/core';

const props = defineProps<{ modelValue?: string, error?: any }>()
const emit = defineEmits([ "update:modelValue" ])
const model = useVModel(props, "modelValue", emit, { passive: true, defaultValue: "" })

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()

useTextareaAutosize({ element: inputRef as Ref<HTMLTextAreaElement>, input: model })

const isJsonError = ref(false)
watchDebounced(model, () => {
  if (!model.value) {
    isJsonError.value = false
    return
  }
  try {
    JSON.parse(model.value)
    isJsonError.value = false
  } catch(e) {
    isJsonError.value = true
  }
}, { debounce: 700 })

const errror = computed(() => {
  if (isJsonError.value) return { message: 'Invalid Json' }
  return props.error
})

</script>

<style lang="sass">

.v-input-json
  .v-form-control__outline
    height: auto


.v-input-json__textarea
  background: none
  border: none
  resize: none 
  width: 100%
  outline: none
  padding: 12px 14px
  box-sizing: border-box
  min-height: 60px
  font-family: Consolas,monaco,monospace

</style>