<template>
  <VInput v-model="innerModel"/>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import VInput from './VInput.vue';

const props = defineProps<{ modelValue?: number[] | string[], format?: string }>()
const emit = defineEmits([ "update:modelValue" ])

const innerModel = ref("")
let preventUpdate = false

watch(() => props.modelValue, (val) => {
  if (val && !preventUpdate) {
    innerModel.value = val.join(",")
  }
  preventUpdate = false
}, { immediate: true })
watch(innerModel, (innerModel) => {
  preventUpdate = true
  const str = innerModel.trim()
  if (!str) {
    emit('update:modelValue', [])
    return
  }
  if (props.format === "number") {
    emit('update:modelValue', str.split(",").map(item => parseFloat(item)))
  } else {
    emit('update:modelValue', str.split(","))
  }
})

</script>

<style lang="sass">

</style>