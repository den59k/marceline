<template>
  <div class="v-layout" style="align-items: flex-start;">
    <h2>Page 2</h2>
    <div>
      <VDateRangePicker v-model="range"/>
      <VDatePicker/>
      <VInput style="margin-top: 16px"/>
      {{ range }}
    </div>
    <div>{{ counter }}</div>
    <button @click="add">Add</button>
    <button @click="open">Open Dialog</button>
  </div>
</template>

<script lang="ts" setup>
import { createApp, ref } from 'vue';
import VInput from '../../frontend/components/VInput.vue';
import VDateRangePicker from '../../frontend/components/VDateRangePicker.vue';
import VDatePicker from '../../frontend/components/VDatePicker.vue';
import TestDialog from './TestDialog.vue';

const range = ref("")

const counter = ref(0)
const add = () => {
  counter.value++
}

const dialog = (window as any).dialogStore
const open = () => {
  dialog.openExternal({
    title: "Test",
    class: "standart",
    actions: [
      { title: "Сохранить", async onClick() {
        await new Promise(res => setTimeout(res, 1000))
      } }
    ],
    onMounted(el: HTMLElement) {
      createApp(TestDialog)
        .mount(el)
    }
  })
  // dialog.open()
}

</script>

<style lang="sass">

</style>