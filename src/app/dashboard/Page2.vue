<template>
  <div class="v-layout">
    <h2>Page 2</h2>
    <div>{{ stats }}</div>
    <button @click="add">Add</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const stats = ref(0)
const add = () => {
  stats.value++
}

</script>

<style lang="sass">

</style>