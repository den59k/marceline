<template>
  <div class="v-table" :style="gridStyle">
    <div class="v-table__header">
      <div v-for="(item, key) in columns" v-bind="item.headerProps">
        {{ item.title }}
        <VIcon v-if="key === '_addColumn'" icon="add" />
        <VIconButton 
          v-if="item.sortable !== false"
          icon="arrow-up" 
          :class="{ activeAsc: sortedColumn === '+'+key, activeDesc: sortedColumn === '-'+key }"
          @click="toggleSort(key)" 
        />
      </div>
    </div>
    <component 
      v-for="(item, index) in data" 
      :key="index" 
      :is="props.rowComponent ?? 'div'" 
      v-bind="props.rowProps? props.rowProps(item): undefined"
      class="v-table__row" 
      @click="emit('itemclick', item)"
      @contextmenu="emit('itemcontext', $event, item)"
    >
      <div v-for="(column, key) in columns" :key="key" v-bind="column.columnProps">
        <slot :name="key" :item="item" :cell="item[key as keyof T]">
          {{ column.map? column.map(item): item[key as keyof T] }}
        </slot>
      </div>
    </component>
  </div>
</template>

<script lang="ts" setup generic="T">
import { CSSProperties, HTMLAttributes, computed } from 'vue';
import VIconButton from './VIconButton.vue';
import { useVModel } from '@vueuse/core';
import VIcon from './VIcon.vue';

const props = defineProps<{ 
  data: T[],
  rowComponent?: string,
  rowProps?: (obj: T) => Record<string, any>,
  columns: Columns<T>,
  sortedColumn?: string | null
}>()

const emit = defineEmits([ "itemclick", "itemcontext", "update:sortedColumn" ])

const sortedColumn = useVModel(props, "sortedColumn", emit, { passive: true, defaultValue: null })

const gridStyle = computed<CSSProperties>(() => {
  return {
    gridTemplateColumns: Object.values(props.columns).map(item => item.width ?? '1fr').join(" ")
  }
})

const toggleSort = (key: string) => {
  if (sortedColumn.value === "-"+key) {
    sortedColumn.value = null
  } else if (sortedColumn.value === "+"+key) {
    sortedColumn.value = "-"+key
  } else {
    sortedColumn.value = "+"+key
  } 
}

const compare = (a: any, b: any) => {
  if (typeof a === "number") return a - (b as number)
  if (typeof a === "string") return a.localeCompare(b as string)
  return a > b? 1: -1
}

const data = computed(() => {
  if (sortedColumn.value) {
    const columnId = sortedColumn.value.slice(1)
    const column = props.columns[columnId]
    const k = sortedColumn.value.startsWith("-")? -1: 1

    const getKey = typeof column.sortableKey === "function"? 
      column.sortableKey: 
      ((item: any) => item[column.sortableKey as string ?? columnId])

    const arr = [ ...props.data ].sort((a: any, b: any) => {
      return k*compare(getKey(a), getKey(b))
    })
    return arr
  }
  return props.data
})

</script>

<script lang="ts">

type Column<T> = {
  title?: string,
  width?: string,
  sortable?: boolean,
  sortableKey?: string | ((item: T) => string | any),
  map?: (item: T) => string,
  headerProps?: HTMLAttributes
  columnProps?: HTMLAttributes
}

export type Columns<T> = Record<string, Column<T>>

</script>

<style lang="sass">
.v-table
  display: grid
  grid-template-columns: 1fr 1fr 1fr

.v-table__header, .v-table__row
  display: grid
  grid-template-columns: subgrid
  grid-column: 1 / -1
  align-items: center

  &>div
    height: 100%
    display: flex 
    align-items: center
    padding: 0 16px
    // border-left: 1px solid var(--border-color)

    // &:first-child
    //   border-left: none

.v-table__header
  font-size: 13px
  font-weight: 500
  color: var(--text-secondary-color)
  height: 40px
  box-sizing: border-box
  background-color: var(--paper-color)
  border-bottom: 1px solid var(--border-color)

  .v-icon-button
    width: 28px
    height: 28px
    margin-left: 4px
    color: var(--text-secondary-color)
    opacity: 0.2

    &:hover
      opacity: 1

    &.activeAsc, &.activeDesc
      opacity: 1
      color: var(--text-color)

    &.activeDesc
      svg
        transform: rotate(180deg)

.v-table__row
  height: 50px
  text-decoration: none
  color: var(--text-color)
  font-weight: 500
  text-align: left
  background: none
  border: none
  font-size: 14px
  border-bottom: 1px solid var(--border-color)
  padding: 0
  box-sizing: border-box

button.v-table__row, a.v-table__row
  cursor: pointer
  &:hover
    background-color: var(--hover-color)

a.v-table__row
  text-decoration: none

</style>
