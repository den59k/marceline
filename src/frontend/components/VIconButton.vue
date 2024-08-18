<template>
  <button class="v-icon-button">
    <slot></slot>
    <VIcon v-if="props.icon" :icon="props.icon" />
  </button>
</template>

<script lang="ts" setup>
import VIcon from './VIcon.vue';


const props = defineProps<{ icon?: string }>()

</script>

<style lang="sass">
.v-icon-button
  width: 40px
  height: 40px
  border-radius: 9999px
  display: flex
  align-items: center
  justify-content: center
  background: none
  flex-shrink: 0
  padding: 0
  border: none
  color: var(--text-color)
  position: relative

  &:hover
    background-color: var(--hover-color)

</style>