<template>
  <div class="v-layout">
    <div class="v-layout__header">
      <template v-for="(item, index) in breadcrumbs">
        <VIcon v-if="index > 0" icon="chevron-right" />
        <router-link :to="item" :class="{ active: index === breadcrumbs.length-1 }">
          {{ getName(item.meta.name as string) }}
        </router-link>
      </template>
      <slot name="header"></slot>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { RouteRecordNormalized, useRouter } from 'vue-router';
import VIcon from './VIcon.vue';

const props = defineProps<{ values?: Record<string, string> }>()
const router = useRouter()

const breadcrumbs = computed(() => {
  const routes = router.getRoutes()
  const path = router.currentRoute.value.matched[0]?.path ?? router.currentRoute.value.fullPath

  const arr: RouteRecordNormalized[] = []
  for (let route of routes) {
    if (path.startsWith(route.path)) {
      arr.push(route)
    }
  }
  arr.sort((a, b) => a.path.length - b.path.length)
  if (arr.length > 1 && arr[0].path === "/") arr.shift()

  return arr
})

const getName = (name: string) => {
  if (!name.startsWith("#") || !props.values) return name
  const val = props.values[name.slice(1)]
  if (val) return val
  if (name.startsWith("#")) return ""
  return name
}

</script>

<style lang="sass">
.v-layout
  flex: 1 1 auto
  padding: 28px 36px
  overflow-x: hidden
  overflow-y: auto
  display: flex
  flex-direction: column

  h1
    margin: 0
    margin-bottom: 30px

.v-layout__header
  display: flex
  align-items: center
  gap: 8px
  color: var(--text-secondary-color)
  margin-bottom: 24px
  font-size: 20px
  font-weight: 700

  a
    text-decoration: none
  
  a.active
    color: var(--text-color)

  .v-button
    margin-left: auto 
    margin-top: -4px
    margin-bottom: -12px

  .v-icon-button
    width: 36px
    height: 36px
    margin-top: -10px
    margin-bottom: -10px
  
</style>