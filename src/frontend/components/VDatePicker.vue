<template>
  <VFormControl class="v-date-picker" outline>
    <slot name="start-adornment"></slot>
    <VDateInput v-model="dateValue" />
    <VIconButton class="v-date-picker__activator" :class="{ opened }" icon="calendar" @click="openPopover"/>

    <VPopover v-model:open="opened" placement="bottom-start"  :offset="4" :element="el" class="v-date-picker__popover">
      <VCalendarSlider :start-date="dateValue" @itemclick="onDateClick" />
    </VPopover>
     <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import { shallowRef, watch } from 'vue';
import VFormControl from './VFormControl.vue';
import VIconButton from './VIconButton.vue';
import VPopover from './VPopover.vue';
import VCalendarSlider from './VCalendarSlider.vue';
import dayjs, { Dayjs } from 'dayjs';
import VDateInput from './VDateInput.vue';

const model = defineModel<string | null>()
const dateValue = shallowRef<Dayjs | null>(model.value? dayjs(model.value): null)

const opened = shallowRef(false)
const el = shallowRef<HTMLElement>()

const openPopover = (e: MouseEvent) => {
  el.value = (e.currentTarget as HTMLElement).parentElement?.parentElement!
  opened.value = true
}

const onDateClick = (date: Dayjs) => {
  dateValue.value = date
}

watch(dateValue, (dateValue) => {
  if (dateValue) {
    model.value = dateValue.toISOString()
  } else {
    model.value = null
  }
})

</script>

<style lang="sass">
.v-date-picker
  min-width: 50px
  .v-form-control__outline
    height: 38px
    display: flex
    align-items: center

  input
    background: none
    border: none
    padding: 0
    padding-left: 14px
    outline: none
    width: 50px
    flex: 1 1 50px

    &.error
      color: var(--error-color)
  
.v-date-picker__activator
  color: var(--text-secondary-color)
  width: 36px
  height: 36px
  
.v-date-picker__popover
  padding: 8px 16px
  overflow: hidden

</style>