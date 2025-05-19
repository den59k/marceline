<template>
  <table class="v-calendar" cellspacing="0">
    <thead>
      <th v-for="item in weekValues">
        {{ item }}
      </th>
    </thead>
    <tbody>
      <tr v-for="row in calendarValues">
        <td
          v-for="cell in row"
          :class="getClass(cell.date, cell.otherMonth)"
          @click="emit('itemclick', cell.date)"
        >
          {{ cell?.title }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import dayjs, { Dayjs } from 'dayjs'
import { computed } from 'vue'

const props = defineProps<{ month: Dayjs, startDate?: Dayjs | null, endDate?: Dayjs | null }>()
const emit = defineEmits([ "itemclick" ])

const showRange = computed(() => {
  if (!props.startDate || !props.endDate) return false
  if (props.startDate.isSame(props.endDate)) return false
  return true
})

const currentDate = dayjs()

const getClass = (date: Dayjs, otherMonth?: boolean) => {

  let className = ""
  if (otherMonth) {
    className += " otherMonth"
  }
  if (date.isSame(currentDate, 'day')) {
    className += " currentDate"
  }

  if (props.startDate && date.isSame(props.startDate, 'day')) {
    if (showRange.value) {
      className += " highlightStart active"
    } else {
      className += " active"
    }
  }
  if (props.endDate && date.isSame(props.endDate, 'day')) {
    if (showRange.value) {
      className += " highlightEnd active"
    } else {
      className += " active"
    }
  }
 
  if (showRange.value && date.isAfter(props.startDate) && date.isBefore(props.endDate)) {
    className += " highlight"
  }
  if (className === "") return undefined
  return className
}

const weekValues = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const calendarValues = computed(() => {
  const arr = []
  let item: ({ title: string, date: dayjs.Dayjs, otherMonth?: boolean })[] = []

  for (let i = props.month.weekday(); i > 0; i--) {
    const date = props.month.add(-i, 'day')
    item.push({ title: date.format('D'), date, otherMonth: true })
  }
  const daysInMonth = props.month.daysInMonth()
  for (let i = 0; i < daysInMonth; i++) {
    item.push({ title: (i + 1).toString(), date: props.month.date(i + 1) })
    if (item.length === 7) {
      arr.push(item)
      item = []
    }
  }
  if (item.length > 0) {
    const lastDate = item[item.length - 1].date
    for (let i = 1; i < 7 - lastDate.weekday(); i++) {
      const date = lastDate.add(i, 'day')
      item.push({ title: date.format('D'), date, otherMonth: true })
    }
    arr.push(item)
  }
  return arr
})

</script>

<script lang="ts">
import weekday from 'dayjs/plugin/weekday'

dayjs.extend(weekday)

</script>

<style lang="sass">
.v-calendar
  font-size: 13px
  border: none

  th
    font-weight: 400
    color: var(--text-secondary-color)
    width: 38px
    height: 26px
    padding: 0

  td
    position: relative
    text-align: center
    cursor: pointer
    height: 40px
    padding: 0
    width: 38px

    &.otherMonth
      color: var(--text-secondary-color)
      visibility: hidden
      pointer-events: none
      
    &:after
      content: ""
      display: none
      position: absolute
      left: 0
      right: 0
      top: 1px
      bottom: 1px
      border-radius: 9999px
      z-index: -1

    &.currentDate:after
      display: block
      border: 1px solid var(--text-secondary-color)

    &:hover:after
      display: block
      border: 1px solid var(--text-secondary-color)
      background-color: var(--hover-color)

    &.active
      color: white
      &:after
        display: block
        background-color: var(--primary-color)

    &:before
      content: ""
      display: none
      position: absolute
      left: 0
      right: 0
      top: 1px
      bottom: 1px
      z-index: -1

    &.highlight:before, &.highlightStart:before, &.highlightEnd:before
      display: block
      background-color: var(--selected-color)

    &.highlightStart:before
      border-radius: 20px 0 0 20px 

    &.highlightEnd:before
      border-radius: 0 20px 20px  0 

</style>