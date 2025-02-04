<template>
  <div v-if="accountStore.status === 'init'"></div>
  <div v-else class="app-layout">
    <AppSidebar v-if="router.currentRoute.value.meta.showSidebar !== false"/>
    <AppDialogProvider/>
    <RouterView/>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import AppDialogProvider from './components/AppDialogProvider.vue';
import AppSidebar from './components/AppSidebar.vue';
import { useAccountStore } from './stores/accountStore';
import { afterEach, beforeEach } from './router';
import { useRouter } from 'vue-router';

const accountStore = useAccountStore()
const router = useRouter()
onMounted(async () => {
  await accountStore.init()
  const to = beforeEach(router.currentRoute.value)
  if (to) {
    router.push(to)
  }
})

</script>

<style lang="sass">
.app-layout
  display: flex
  height: 100vh
  overflow: hidden

.app-content
  flex: 1 1 auto

</style>