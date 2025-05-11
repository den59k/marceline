<template>
  <div ref="elementRef">

  </div>
</template>

<script lang="ts" setup>
import { App, createApp, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ component?: any, mount?: (el: HTMLElement) => void, unmount?: () => void }>()
const elementRef = ref<HTMLElement>()

let vueApp: App
onMounted(() => {
  if (props.mount) {
    props.mount(elementRef.value!)
  } else if (props.component) {
    vueApp = createApp(props.component)
    vueApp.mount(elementRef.value!)
  }
})
onBeforeUnmount(() => {
  if (props.unmount) {
    props.unmount()
  }
  if (vueApp) {
    vueApp.unmount()
  }
})

</script>

<style lang="sass">

</style>