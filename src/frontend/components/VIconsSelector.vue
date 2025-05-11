<template>
  <VFormControl outline class="v-icons-selector">
    <VPopover v-model:open="opened" placement="bottom-end" :offset="8">
      <template #activator="{ props: activatorProps }">
        <button class="v-icons-selector__activator" :class="{ opened }" v-bind="activatorProps">
          <VIcon v-if="model" :key="model" :icon="model" />
          <div v-else>-</div>
          <VIcon icon="arrow-down" class="dropdown-icon"/>
        </button>
      </template>
      <div class="v-icons-selector__icons-grid">
        <button v-for="key in icons.keys()" :title="key" @click="selectIcon(key)" >
          <VIcon :icon="key"/>
        </button>
      </div>
    </VPopover>
  </VFormControl>
</template>

<script lang="ts" setup>
import { Ref, ref } from 'vue';
import VFormControl from './VFormControl.vue';
import VIcon, { icons } from './VIcon.vue';
import { useVModel } from '@vueuse/core';
import VPopover from './VPopover.vue';

const props = defineProps<{ modelValue?: string | null }>()
const emit = defineEmits([ "update:modelValue" ])

const model = useVModel(props, "modelValue", emit, { passive: true, defaultValue: null }) as Ref<string | null>

const opened = ref(false)

const selectIcon = (icon: string) => {
  model.value = icon
  opened.value = false
}

</script>

<style lang="sass">
.v-icons-selector
  width: 80px
  flex: 0 0 auto
  .v-form-control__outline
    height: 38px

.v-icons-selector__activator
  background: none
  border: none
  color: var(--text-color)
  width: 100%
  display: flex
  align-items: center
  padding: 0 16px
  outline: none

  svg
    max-width: 20px
    max-height: 20px
  
  &>.dropdown-icon
    margin-left: auto
    margin-right: -6px
    color: var(--text-secondary-color)

  &.opened .dropdown-icon
      transform: rotate(180deg)

.v-icons-selector__icons-grid
  display: grid
  grid-template-columns: repeat(8, 40px)
  padding: 8px

  &>button
    background: none
    border: none
    width: 40px
    height: 40px
    color: var(--text-color)
    border-radius: 12px
    &:hover
      background-color: var(--hover-color)
    svg
      max-width: 20px
      max-height: 20px

</style>