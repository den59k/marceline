<template>
  <VFormControl class="form-editor-subitems">
    <div ref="containerRef" class="form-editor-subitems__content">
      <slot name="start-adornment"></slot>
      <VTable :columns="columns" :data="data ?? []">
        <template #_remove="{ item }">
          <VIconButton icon="close" class="remove-item-button" @click="deleteItem(item)"/>
        </template>
        <template #_sort="{ item }">
          <VIcon icon="sort" />
        </template>
        <template v-for="column in props.columns" v-slot:[column.fieldId]="{ item }">
          <VSelect v-if="column.type === 'select'" v-model="item[column.fieldId]" :items="column.enum!" />
          <VCheckbox v-else-if="column.type === 'bool'" v-model="item[column.fieldId]"/>
          <input v-else v-model="item[column.fieldId]"  />
        </template>
      </VTable>
      <slot name="end-adornment"></slot>
    </div>
    <VButton class="add-button" @click="addItem">Добавить элемент</VButton>
  </VFormControl>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
import VButton from './VButton.vue';
import VFormControl from './VFormControl.vue';
import VTable from './VTable.vue';
import { useVModel } from '@vueuse/core';
import VIconButton from './VIconButton.vue';
import VSelect from './VSelect.vue';
import VCheckbox from './VCheckbox.vue';
import VIcon from './VIcon.vue';
import { clamp, handleMove } from 'vuesix';

type Item = { fieldId: string, name: string, type?: string, enum?: any[], enabled: boolean }
const props = defineProps<{ modelValue?: any[], columns?: Item[] }>()
const emit = defineEmits([ "update:modelValue" ])

const data = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] })

const columns = computed<Record<string, any>>(() => {
  if (!props.columns) return []
  const columns: [ string, any ][] = props.columns
    .filter(item => item.enabled)
    .map(field => [
      field.fieldId,
      {
        title: field.fieldId ?? field.name,
        sortable: false,
        width: field.type === 'bool'? (Math.max(field.fieldId.length*9, 60)+'px'): undefined
      }
    ])
  columns.unshift([
    "_sort",
    {
      columnProps: { class: "form-editor-subitems__sort-column", onMousedown: onMoveRow },
      title: "",
      sortable: false,
      width: "36px"
    }
  ])
  columns.push([
    "_remove",
    {
      title: "",
      sortable: false,
      width: "46px"
    }
  ])

  return Object.fromEntries(columns)
})

const onMoveRow = (e: MouseEvent) => {
  const item = (e.currentTarget as HTMLElement).parentElement!
  ;(window.document.activeElement as HTMLElement)?.blur()

  const children = Array.from(item.parentElement!.children)
  children.shift()
  const index = children.indexOf(item)
  const height = item.getBoundingClientRect().height
  
  handleMove(e, {
    onMove({ pos, startPos }) {
      item.classList.add("drag")

      const delta = clamp(pos.y - startPos.y, -index * height, (children.length - index - 1) * height);
      item.classList.add("move"),
      item.style.transform = `translateY(${delta}px)`
    },
    onEnd({ pos, startPos }) {
      let newIndex = clamp(Math.round(index + (pos.y - startPos.y) / height), 0, children.length);
      item.classList.remove("drag")
      item.style.transform = ""
      if (newIndex !== index) {
        const k = data.value![index];
        data.value!.splice(index, 1),
        data.value!.splice(newIndex, 0, k),
        emit("update:modelValue", data.value!)
      }
    }
  })
}

const getDefaultValue = (type?: string) => {
  if (type === 'number') return 0
  if (type === 'bool') return false
  if (type === 'select') return null
  return ""
}

const containerRef = ref<HTMLDivElement>()
const addItem = () => {
  const arr = data.value ?? []
  const obj = Object.fromEntries((props.columns ?? [])?.filter(item => item.enabled).map(item => [
    item.fieldId,
    getDefaultValue(item.type)
  ]))
  arr.push(obj)
  data.value = arr
  if (!props.modelValue) {
    emit("update:modelValue", data.value)
  }

  nextTick(() => {
    const items = Array.from(containerRef.value?.querySelectorAll("input") ?? [])
    items.at(-1)?.select()
  })
}

const deleteItem = (item: any) => {
  if (!data.value) return
  const index = data.value.indexOf(item)
  if (index >= 0) {
    data.value.splice(index, 1)
  }
}

</script>

<style lang="sass">
.form-editor-subitems
  .add-button
    align-self: flex-start
    margin-top: 12px

  .remove-item-button
    color: var(--error-color)
    opacity: 0.5
    &:hover
      opacity: 1
    
  .v-table 
    td
      padding: 0
    input
      border: none
      background: none
      height: 100%
      outline: none
      width: 100%
      padding: 0 16px

      &:focus
        box-shadow: 0 0 0 1px var(--primary-color)

    .v-select
      width: 100%
      height: 100%
      .v-form-control__outline
        border: none
        height: 100%

      .v-select__activator.opened
        box-shadow: 0 0 0 1px var(--primary-color)

    .v-checkbox
      margin-left: 16px

  .v-table__row>div
    padding: 0
  .v-table__row:last-child
    border-bottom: none

.form-editor-subitems__content
  position: relative
  min-height: 80px
  border: 1px solid var(--border-color)
  border-radius: 12px

  .v-table__header
    border-radius: 12px 12px 0 0

.form-editor-subitems__sort-column
  cursor: pointer
  &:hover
    background-color: var(--hover-color)
  svg
    width: 20px
    height: 20px
    margin-left: 8px
    opacity: 0.4

</style>