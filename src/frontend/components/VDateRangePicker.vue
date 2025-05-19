<template>
  <VFormControl class="v-date-picker v-date-range-picker" outline>
    <VDateInput v-model="startDate"/>
    -
    <VDateInput v-model="endDate"/>
    <VIconButton class="v-date-picker__activator" :class="{ opened }" icon="calendar" @click="openPopover"/>
    <VPopover v-model:open="opened" placement="bottom-start"  :offset="4" :element="el" class="v-date-picker__popover">
      <VCalendarSlider :start-date="startDate" :end-date="endDate" @itemclick="onDateClick" />
    </VPopover>
  </VFormControl>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue';
import VFormControl from './VFormControl.vue';
import VPopover from './VPopover.vue';
import dayjs, { Dayjs } from 'dayjs';
import VCalendarSlider from './VCalendarSlider.vue';
import VIconButton from './VIconButton.vue';
import VDateInput from './VDateInput.vue';

const opened = shallowRef(false)

const model = defineModel<string | null>()
const splited = model.value?.split("-") ?? []

const startDate = shallowRef<Dayjs | null>(splited[0]? dayjs(splited[0]): null)
const endDate = shallowRef<Dayjs | null>(splited[1]? dayjs(splited[1]): null)

const el = shallowRef<HTMLElement>()

const openPopover = (e: MouseEvent) => {
  el.value = (e.currentTarget as HTMLElement).parentElement?.parentElement!
  opened.value = true
}

const onDateClick = (day: Dayjs) => {
  if (startDate.value && endDate.value) {
    startDate.value = null
    endDate.value = null
  }
  if (!startDate.value) {
    startDate.value = day
  } else {
    if (day.isBefore(startDate.value)) {
      endDate.value = startDate.value
      startDate.value = day
    } else {
      endDate.value = day
    }
  }
}

watch([ startDate, endDate ], ([ startDate, endDate ]) => {
  if (startDate && endDate) {
    model.value = startDate.toISOString() + " - " + endDate.toISOString()
  } else {
    model.value = null
  }
})



</script>


<style lang="sass">
.v-date-picker.v-date-range-picker
  min-width: 260px

</style>