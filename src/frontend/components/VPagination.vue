<template>
  <div v-if="props.pageCount && props.pageCount > 1" class="v-pagination">
    <ul class="v-pagination__list">
      <li class="v-pagination__list-item" @click="decrease()">
        <VIcon icon="chevron-left" />
      </li>
      <li
        v-for="item in items"
        class="v-pagination__list-item"
        :class="{ 'v-pagination__active': model === item-1, 'empty': item < 0 }"
        :role="item >= 0? 'button': undefined"
        @click="model = item-1"
      >
        {{ item < 0? "...": item }}
      </li>
      <li class="v-pagination__list-item" @click="increase()">
        <VIcon icon="chevron-right" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useVModel, useWindowSize } from '@vueuse/core'
import { computed } from 'vue'
import VIcon from './VIcon.vue';

const props = defineProps<{
  pageCount?: number,
  modelValue: number
}>()

const { width } = useWindowSize()
const visibleCount = computed(() => {
  if (width.value > 348) return 8
  if (width.value > 312) return 7
  return 6
})

const emit = defineEmits(['update:modelValue'])
const model = useVModel(props, 'modelValue', emit)

const items = computed(() => {
  const arr = []
  arr.push(1)
  if (!props.pageCount) return arr

  if (props.pageCount <= visibleCount.value) {
    for (let i = 2; i <= props.pageCount; i++) {
      arr.push(i)
    }
    return arr
  }

  const leftNumbers = visibleCount.value < 8 ? 0 : 1
  const rightNumbers = visibleCount.value < 8 ? visibleCount.value - 4 : visibleCount.value - 5

  const showSpaceLeft = model.value > visibleCount.value / 2
  const showSpaceRight = model.value < props.pageCount - visibleCount.value / 2

  let firstNum = showSpaceLeft ? (props.modelValue - leftNumbers) : 2
  let lastNum = showSpaceRight ? props.modelValue + rightNumbers : props.pageCount

  if (!showSpaceLeft) {
    lastNum = Math.min(visibleCount.value - 1, props.pageCount)
  }
  if (!showSpaceRight) {
    firstNum = Math.max(props.pageCount - visibleCount.value + 3, 2)
  }

  if (showSpaceLeft) {
    arr.push(-1)
  }

  for (let i = firstNum; i < lastNum; i++) {
    arr.push(i)
  }

  if (showSpaceRight) {
    arr.push(-1)
  }

  arr.push(props.pageCount)
  return arr
})

const increase = () => {
  if (!props.pageCount || model.value >= props.pageCount-1) {
    return
  }
  model.value++
}

const decrease = () => {
  if (model.value < 1) {
    return
  }
  model.value--
}

</script>

<style lang="sass">
.v-pagination
  display: flex
  flex-direction: row
  padding: 12px 16px
  justify-content: center

.v-pagination__list
  display: flex
  flex-direction: row
  margin: 0
  padding-left: 0

.v-pagination__list-item
  display: flex
  align-content: center
  flex-wrap: wrap
  justify-content: center
  background-color: var(--background-color-white)
  border: 1px solid var(--input-border-color)
  min-width: 36px
  height: 36px
  color: #616971
  box-sizing: border-box
  cursor: pointer
  user-select: none
  padding: 0 6px
  &:hover
    background-color: var(--hover-color)

  &.empty
    pointer-events: none
    opacity: 0.5
    cursor: default

  @media(max-width: 900px)
    min-width: 32px
    height: 32px
    padding: 0 4px

.v-pagination__active
  color: var(--primary-color)
  // background-color: #242428
  // background-color: var(--primary-color)
  border-color: var(--primary-color)
  color: white
  &:hover
    background-color: #242428

.v-pagination__list-item:first-child
   border-radius: 4px 0 0 4px

.v-pagination__list-item:last-child
  border-radius: 0 4px 4px 0
</style>
