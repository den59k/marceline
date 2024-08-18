<template>
  <VLayout :values="{ view: data?.view.name }">
    <template v-if="!data && error">Нет такой страницы</template>
    <template v-else-if="!data"></template>
    <template v-else>
      <div class="tables-controls">
        <VButton>
          <VIcon icon="add" /> Добавить пользователя
        </VButton>
        <VInput placeholder="Поиск..."/>
      </div>
      <div class="views-page__layout">
        <VTable 
          v-if="data"
          :columns="columns" 
          :data="data.data" 
          row-component="button" 
        >
        </VTable>
      </div>
      <AddColumnPopover v-bind="contextMenu.props" :table="data.view.systemTable" @addcolumn="addColumn"/>
    </template>
  </VLayout>
</template>

<script lang="ts" setup>
import { mutateRequest, useRequestWatch } from 'vuesix';
import VInput from '../components/forms/VInput.vue';
import VButton from '../components/VButton.vue';
import { useContextMenu } from '../components/VContextMenu.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable from '../components/VTable.vue';
import { dataApi } from '../api/data';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import AddColumnPopover from '../components/AddColumnPopover.vue';
import { viewsApi } from '../api/views';
import dayjs from 'dayjs';

const contextMenu = useContextMenu(() => [])

const router = useRouter()
const viewId = computed(() => router.currentRoute.value.params.viewId as string)
const { data, error, pending } = useRequestWatch(dataApi.getData, viewId)

const getByKey = (item: any, keys: string[]) => {
  let value = item
  for (let key of keys) {
    value = value[key]
  }
  return value
}

const getMapMethod = (column: any) => {
  const keys = column.systemColumn.split(".")

  return (item: any) => {
    const value = getByKey(item, keys)
    
    if (value === null || value === undefined) return "-"
    if (column.format === "string") return value
    if (column.format === "date") return dayjs(value).format("D MMMM - YYYY")
    if (column.format === "dateTime") return dayjs(value).format("D MMMM YYYY - HH:mm")
    return value
  }
}

const columns = computed(() => {
  if (!data.value) return {}

  const columns = [
    ...data.value.view.columns.map((column: any, index: number) => [
      "column-"+index,
      { 
        title: column.name,
        map: getMapMethod(column)
      }
    ]),
    [ "_addColumn", { 
      sortable: false, 
      headerProps: { class: "data-page__add-column", onClick: (e: MouseEvent) => contextMenu.open(e) }, 
      width: "150px" 
    }]
  ]
    
  return Object.fromEntries(columns)
})

const addColumn = async (newColumn: { name: string, format: string, systemColumn: string }) => {
  data.value.view.columns.push(newColumn)
  await viewsApi.updateView(viewId.value, data.value.view)
  mutateRequest(dataApi.getData, viewId.value)
}

</script>

<style lang="sass">
.data-page__add-column
  display: flex
  justify-content: center
  cursor: pointer
  border-radius: 0 12px 0 0 

  &:hover
    background-color: var(--hover-color)

</style>