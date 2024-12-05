<template>
  <div class="list-editor" >
    <div v-if="props.label" class="list-editor__title">{{ props.label }}</div>
    <div 
      v-for="(item, index) in values" 
      class="list-editor__item"
    >
      <VIconButton icon="dots" class="move-button" @mousedown="onItemMouseDown($event, index)"/>
      <slot name="item" :item="item" :index="index">{{ item }}</slot>
      <VIconButton icon="close" class="delete-button" @click="deleteItem(index)"/>
    </div>
    <VPopover v-if="props.items" v-model:open="popoverOpen" placement="bottom-start" fit-anchor class="list-editor__add-item-popover">
      <template #activator="{ props: activatorProps }">
        <button v-bind="activatorProps" class="list-editor__add-button">
          <VIcon icon="add"/> {{ props.addLabel ?? "Добавить" }}
        </button>
      </template>
      <button v-for="item in props.items" @click="addItem(item as T)">{{ item }}</button>
      <div v-if="props.items.length === 0" class="v-select__empty-label">Нет доступных элементов</div>
    </VPopover>
    <button v-else class="list-editor__add-button" @click="addItem(props.defaultItem!)">
      <VIcon icon="add"/> {{ props.addLabel ?? "Добавить" }}
    </button>
  </div>
</template>

<script lang="ts" setup generic="T">
import { useVModel } from '@vueuse/core';
import VIcon from './VIcon.vue';
import VPopover from './VPopover.vue';
import { Ref, ref } from 'vue';
import VIconButton from './VIconButton.vue';
import { handleMove, useDraggableItem } from 'vuesix';

const props = defineProps<{ label?: string, modelValue?: T[], addLabel?: string, items?: T[], defaultItem?: T }>()
const emit = defineEmits([ "update:modelValue" ])

const values = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] as any }) as Ref<T[]>

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

const onItemMouseDown = (e: MouseEvent, index: number) => {
  const item = (e.currentTarget as HTMLElement).parentElement!
  const container = item.parentElement!
    
  const rects = Array.from(container.querySelectorAll(".list-editor__item")).map(item => item.getBoundingClientRect())
  const rect = item.getBoundingClientRect()
  const offset = { left: rect.left - e.clientX, top: rect.top - e.clientY }
  const width = item.clientWidth

  let clonedItem: HTMLElement | null = null
  handleMove(e, {
    onMove({ pos, startPos }){ 
      if (!clonedItem && Math.abs(pos.y - startPos.y) > 2){ 
        item.style.visibility = "hidden"
        clonedItem = item.cloneNode(true) as HTMLElement
        clonedItem.setAttribute("style", "position: fixed; pointer-events: none;")
        container.append(clonedItem)
      }
      clonedItem?.setAttribute(
        "style", 
        `position: fixed; top: ${pos.y + offset.top}px; left: ${pos.x + offset.left}px; width: ${width}px; pointer-events: none;`
      )
    },
    onEnd({ pos }) {
      let targetIndex = 0
      for (let i = 0; i < rects.length; i++) {
        if (rects[i].top > pos.y+offset.top) {
          break
        }
        targetIndex++
      }
      item.style.visibility = ""
      clonedItem?.remove()
      if (targetIndex === index || targetIndex === index+1) {
        return
      }
      const entry = values.value[index]
      values.value.splice(index, 1)
      if (targetIndex > index) {
        targetIndex--
      }
      values.value.splice(targetIndex, 0, entry)
    },
    type: "absolute"
  })
}

</script>

<style lang="sass">
.list-editor
  display: flex
  flex-direction: column
  gap: 8px
  position: relative

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

  &.move
    position: absolute

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