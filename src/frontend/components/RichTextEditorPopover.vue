<template>
  <VPopover :anchor-position="position" placement="bottom-start" v-model:open="open" class="custom-blocks-popover">
    <button v-for="item in visibleBlocks" :class="{ active: activeItem === item }" @mouseenter="activeItem = item" @click="item.onClick">
      {{ item.title }}
    </button>
  </VPopover>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import VPopover from './VPopover.vue';
import { shallowRef, computed, watch } from 'vue';

type BlockType = {
  id: string,
  title: string,
  onClick: () => void
}

const props = defineProps<{ 
  position: { x: number, y: number }, 
  open: boolean, 
  word: string | null, 
  blocks: BlockType[] 
}>()

const emit = defineEmits([ "update:open" ])

const open = useVModel(props, "open", emit)

const activeItem = shallowRef<BlockType | null>(null)
const visibleBlocks = computed(() => {
  if (!props.word || !open.value) return []
  return props.blocks.filter(item => item.id.startsWith(props.word!.slice(1)))
})

watch(visibleBlocks, (visibleBlocks) => {
  if (visibleBlocks.length === 0) {
    activeItem.value = null
  } else {
    activeItem.value = visibleBlocks[0]
  }
}, { immediate: true })

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && open.value && activeItem.value) {
    e.preventDefault()
    activeItem.value.onClick()
    return
  }
  if ((e.key === "ArrowUp" || e.key === "ArrowDown") && open.value && visibleBlocks.value.length > 0) {
    e.preventDefault()
    const index = visibleBlocks.value.indexOf(activeItem.value!)
    let newIndex = index + (e.key === "ArrowUp"? -1: 1)
    if (newIndex < 0) newIndex = visibleBlocks.value.length-1
    if (newIndex >= visibleBlocks.value.length) newIndex = 0
    activeItem.value = visibleBlocks.value[newIndex]
  }
}

defineExpose({
  onKeyDown
})

</script>

<style lang="sass">
.custom-blocks-popover
  display: flex
  flex-direction: column
  padding: 8px 0
  width: 200px
  &>button
    background: none
    height: 36px
    color: white
    border: none
    display: flex
    align-items: center
    padding: 0 16px

    &.active
      background-color: rgba(255, 255, 255, 0.015)
      cursor: pointer
</style>