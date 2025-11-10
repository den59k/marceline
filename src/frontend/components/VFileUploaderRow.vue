<template>
  <div ref="containerRef" class="v-image-uploader__files-row">
    <div 
      v-for="(item, index) in props.files" 
      class="v-image-uploader__files-row-item" 
      :class="{ temp: typeof item.progress === 'number' }"
      @mousedown="onDrag($event, index)"
    > 
      <img :src="item.src" alt="Image"/>
      <VIconButton icon="close" @click="deleteFileItem(item)"/>
    </div>
    <div ref="markerRef" class="v-image-uploader__files-row-marker" style="display: none;"></div>
  </div>
</template>

<script lang="ts" setup>
import { useDraggableItem } from 'vuesix';
import { type FileEntry } from './VFileUploader.vue';
import VIconButton from './VIconButton.vue';
import { ref } from 'vue';

const props = defineProps<{ files: any }>()

const deleteFileItem = (item: FileEntry) => {
  const index = props.files.indexOf(item)
  if (index < 0) return
  props.files.splice(index, 1)
}

const drag = useDraggableItem()
const containerRef = ref<HTMLDivElement>()
const markerRef = ref<HTMLDivElement>()

const onDrag = (e: MouseEvent, currentIndex: number) => {
  e.preventDefault()
  const currentItem = e.currentTarget as HTMLElement

  let targetIndex: number = -1

  drag(e, {
    threshold: 2,
    onStart(item) {
      item.classList.add("drag")
      currentItem.style.visibility = "hidden"
    },
    onMove(e, el) {
      if (!containerRef.value || !markerRef.value) return
      let minDistanceX = 60
      let minDistanceY = 60
      let targetItem: HTMLElement | null = null
      let left = true
      let index = 0
      targetIndex = -1

      for (let item of containerRef.value.children) {
        if (item === currentItem) {
          index++
          continue
        }
        if (item === el || item === markerRef.value || item == currentItem) continue
        const rect = item.getBoundingClientRect()
        const distX = Math.abs(e.clientX - (rect.left + rect.right) * 0.5)
        const distY = Math.abs(e.clientY - (rect.top + rect.bottom) * 0.5)
        if (distY < minDistanceY - 20) {
          minDistanceX = distX
          minDistanceY = distY
          targetItem = item as HTMLElement
          targetIndex = index
          left = e.clientX < (rect.left + rect.right) * 0.5
          index++
          continue
        }
        if (distX < minDistanceX) {
          minDistanceX = distX
          targetItem = item as HTMLElement
          targetIndex = index
          left = e.clientX < (rect.left + rect.right) * 0.5
        }
        index++
      }

      if (targetItem) {
        markerRef.value.style.display = "block"
        markerRef.value.style.top = targetItem.offsetTop + "px"
        if (left) {
          markerRef.value.style.left = targetItem.offsetLeft - 4 + "px"
        } else {
          markerRef.value.style.left = targetItem.offsetLeft + 4 + targetItem.offsetWidth + "px"
          targetIndex++
        }
      } else {
        markerRef.value.style.display = "none"
      }
    },
    onEnd() {
      if (markerRef.value) {
        markerRef.value.style.display = "none"
      }
      currentItem.style.visibility = ""
      if (targetIndex >= 0 && currentIndex >= 0 && targetIndex !== currentIndex) {
        let item = props.files.splice(currentIndex, 1)
        props.files.splice(targetIndex > currentIndex? targetIndex-1: targetIndex, 0, item[0])
      }
    }
  })
}

</script>

<style lang="sass">
.v-image-uploader__files-row
  display: flex
  gap: 8px
  margin-top: 16px
  position: relative
  
.v-image-uploader__files-row-item
  width: 60px
  height: 60px
  position: relative
  box-sizing: border-box
  -webkit-user-drag: none
  user-select: none 
  img
    width: 100%
    height: 100%
    display: block
    object-fit: contain

  &.temp
    img
      opacity: 0.6

  &.drag
    z-index: 1000
    pointer-events: none

    .v-icon-button
      display: none
  
  .v-icon-button
    position: absolute
    top: -4px
    right: -4px
    background-color: var(--paper-color)
    width: 22px
    height: 22px

    svg 
      width: 16px
      height: 16px

    &:hover
      background-color: var(--primary-color)

.v-image-uploader__files-row-marker
  position: absolute
  height: 68px
  width: 4px
  border-radius: 2px
  background-color: var(--primary-color)
  margin-left: -2px
  margin-top: -4px
  

</style>