<template>
  <div class="v-layout" style="align-items: flex-start;">
    <h2>Page 2</h2>
    <div>
      <VDateRangePicker/>
      <VDatePicker/>
      <VInput style="margin-top: 16px"/>
    </div>
    <div>{{ counter }}</div>
    <button @click="add">Add</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import VInput from '../../frontend/components/VInput.vue';
import VDateRangePicker from '../../frontend/components/VDateRangePicker.vue';
import VDatePicker from '../../frontend/components/VDatePicker.vue';

const counter = ref(0)
const add = () => {
  counter.value++
}

</script>

<style lang="sass">

</style>