<template>
  <div class="app-layout">
    <AppSidebar/>
    <AppDialogProvider/>
    <RouterView/>
  </div>
</template>

<script lang="ts" setup>
import AppDialogProvider from './components/AppDialogProvider.vue';
import AppSidebar from './components/AppSidebar.vue';


</script>

<style lang="sass">
.app-layout
  display: flex
  height: 100vh
  overflow: hidden

.app-content
  flex: 1 1 auto

</style>