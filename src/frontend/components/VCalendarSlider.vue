<template>
  <div class="v-calendar-slider">
    <div class="v-calendar-slider__month-picker">
      <VIconButton icon="chevron-left" @click="changeMonth(-1)"/>
      <div class="month-title">{{ currentMonth.format("MMMM") }}</div>
      <VIconButton icon="chevron-right" @click="changeMonth(1)"/>
    </div>
    <div class="v-calendar-slider__v-calendar-wrapper">
      <Transition>
        <VCalendar 
          :key="sliderMonth.valueOf()" 
          :month="sliderMonth" 
          :class="dir" 
          :start-date="props.startDate" 
          :end-date="props.endDate" 
          @itemclick="emit('itemclick', $event)"
        />
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs, { Dayjs } from 'dayjs';
import { nextTick } from 'process';
import { shallowRef, watch } from 'vue';
import VCalendar from './VCalendar.vue';
import VIconButton from './VIconButton.vue';

const props = defineProps<{ startDate?: Dayjs | null, endDate?: Dayjs | null }>()
const emit = defineEmits([ "itemclick" ])

const currentMonth = shallowRef((props.endDate ?? props.startDate ?? dayjs()).startOf("month"))
const changeMonth = (inc: number) => {
  currentMonth.value = currentMonth.value.add(inc, 'month')
}

const sliderMonth = shallowRef(currentMonth.value)
const dir = shallowRef("slide-left")
watch(currentMonth, (month, lastMonth) => {
  if (month.isBefore(lastMonth)) {
    dir.value = "slide-left"
  } else {
    dir.value = "slide-right"
  }
  nextTick(() => {
    sliderMonth.value = month
  })
})

</script>

<style lang="sass">

.v-calendar-slider
  .v-calendar
    &.v-enter-active, &.v-leave-active 
      transition: opacity 0.3s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)

    &.v-enter-from, &.v-leave-to
      // opacity: 0
      position: absolute
      left: 0px
      top: 0px

    &.slide-left.v-enter-from, &.slide-right.v-leave-to
      transform: translate(-110%)

    &.slide-right.v-enter-from, &.slide-left.v-leave-to
      transform: translate(110%)

.v-calendar-slider__v-calendar-wrapper
  height: 266px
  position: relative

.v-calendar-slider__month-picker
  display: flex
  align-items: center
  justify-content: center

  .month-title
    flex: 1 1 50px
    text-align: center
    text-transform: capitalize

  
</style>