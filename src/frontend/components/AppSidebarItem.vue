<template>
  <button v-if="!item.to" class="app-sidebar__item" @click="item.onClick">
    <VIcon v-if="item.icon" :icon="item.icon" />
    {{ item.title }}
  </button>
  <RouterLink v-else :to="item.to" :class="{ active }" class="app-sidebar__item">
    <VIcon v-if="item.icon" :icon="item.icon" />
    {{ item.title }}
  </RouterLink>
</template>

<script lang="ts" setup>
import VIcon from './VIcon.vue';

defineProps<{
  item: { title: string, icon: string, to?: string, onClick?: any },
  active?: boolean
}>()

</script>
