<template>
  <div class="list-editor">
    <div v-if="props.label" class="list-editor__title">{{ props.label }}</div>
    <div v-for="(item, index) in values" class="list-editor__item">
      <VIconButton icon="dots" class="move-button"/>
      <slot name="item" :item="item" :index="index">{{ item }}</slot>
      <VIconButton icon="close" class="delete-button" @click="deleteItem(index)"/>
    </div>
    <VPopover v-model:open="popoverOpen" placement="bottom-start" fit-anchor class="list-editor__add-item-popover">
      <template #activator="{ props: activatorProps }">
        <button v-bind="activatorProps" class="list-editor__add-button">
          <VIcon icon="add"/> {{ props.addLabel ?? "Добавить" }}
        </button>
      </template>
      <button v-for="item in props.items" @click="addItem(item)">{{ item }}</button>
    </VPopover>
  </div>
</template>

<script lang="ts" setup generic="T">
import { useVModel } from '@vueuse/core';
import VIcon from './VIcon.vue';
import VPopover from './VPopover.vue';
import { Ref, ref } from 'vue';
import VIconButton from './VIconButton.vue';

const props = defineProps<{ label?: string, modelValue?: T[], addLabel?: string, items: T[] }>()
const emit = defineEmits([ "update:modelValue" ])

const values = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] }) as Ref<T[]>

const popoverOpen = ref(false)
const addItem = (item: T) => {
  if (!values.value) {
    values.value = []
  }
  if (typeof item === "object") {
    values.value.push({ ...item })
  } else {
    values.value.push(item)
  }
  popoverOpen.value = false
  emit("update:modelValue", values.value)
}

const deleteItem = (index: number) => {
  if (!values.value) return
  values.value.splice(index, 1)
}

</script>

<style lang="sass">
.list-editor
  display: flex
  flex-direction: column
  gap: 8px

.list-editor__title
  font-size: 12px
  letter-spacing: 0.04em
  color: var(--text-secondary-color)

.list-editor__item
  height: 38px
  display: flex
  align-items: center
  border: 1px solid var(--input-border-color)
  border-radius: 8px
  box-sizing: border-box
  gap: 4px

  .v-icon-button
    width: 36px
    height: 36px
    color: var(--text-secondary-color)

  .move-button
    cursor: grab

    &:active
      cursor: grabbing

  .delete-button
    margin-left: auto
    width: 32px
    height: 32px
    margin-right: 2px

.list-editor__add-button
  background: none
  border: none
  display: flex
  align-items: center
  gap: 6px
  color: var(--text-color)
  height: 36px
  width: 100%
  border-radius: 8px

  &:hover
    background-color: var(--hover-color)

.list-editor__add-item-popover
  display: flex
  flex-direction: column
  padding: 6px 0

  &>button
    height: 36px
    background: none
    border: none
    display: flex
    align-items: center
    padding: 0 16px
    color: var(--text-color)
    &:hover
      background-color: var(--hover-color)

</style>