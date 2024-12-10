<template>
  <VFormControl class="form-editor-subitems">
    <div ref="containerRef" class="form-editor-subitems__content">
      <slot name="start-adornment"></slot>
      <VTable :columns="columns" :data="data ?? []">
        <template #_remove="{ item }">
          <VIconButton icon="close" class="remove-item-button" @click="deleteItem(item)"/>
        </template>
        <template v-for="column in props.columns" v-slot:[column.fieldId]="{ item }">
          <VSelect v-if="column.type === 'select'" v-model="item[column.fieldId]" :items="column.enum!" />
          <input v-else v-model="item[column.fieldId]" />
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
        sortable: false
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

const containerRef = ref<HTMLDivElement>()
const addItem = () => {
  const arr = data.value ?? []
  const obj = Object.fromEntries((props.columns ?? [])?.filter(item => item.enabled).map(item => [
    item.fieldId,
    ""
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

</style>