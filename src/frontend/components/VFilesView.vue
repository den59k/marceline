<template>
  <VFormControl outline>
    <slot name="start-adornment"></slot>
    <div v-if="!modelValue || modelValue.length === 0" class="v-files-view__empty">Нет файлов</div>
    <div v-else class="v-files-view__list">
      <div v-for="item in modelValue" class="v-files-view__file-item">
        <div class="name">
          {{ item.name ?? item.id }}
          <template v-if="item.size">
            ({{ bytesForHuman(item.size) }})
          </template>
        </div>
        <a :href="item.src" :download="item.name ?? item.id">Скачать файл</a>
      </div>
    </div>
    <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import VFormControl from './VFormControl.vue';
import { bytesForHuman } from '../utils/lang'

const props = defineProps<{ modelValue: any }>()

</script>

<style lang="sass">
.v-files-view__empty
  padding: 16px
  color: var(--text-secondary-color)
  text-align: center
  width: 100%

.v-files-view__list
  width: 100%
  padding: 4px 20px
  
.v-files-view__file-item
  height: 46px
  display: flex
  align-items: center
  border-top: 1px solid var(--border-color)

  &:first-child
    border-top: none

  &>.name
    flex: 1 1 auto
    overflow: hidden

  &>a
    color: var(--primary-color)
    cursor: pointer

</style>