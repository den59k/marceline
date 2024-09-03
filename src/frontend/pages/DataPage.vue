<template>
  <VLayout :values="{ view: data?.view.name }">
    <template #header>
      <VIconButton icon="settings" class="data-page__edit-button" @click="editTable"/>
    </template>
    <template v-if="!data && error">Нет такой страницы</template>
    <template v-else-if="!data"></template>
    <template v-else>
      <div class="tables-controls">
        <VButton v-if="selectedItems.length > 0" @click="deleteItems">
          <VIcon icon="delete" />
          {{ selectedItems.length > 1? "Удалить элементы": "Удалить элемент" }}
        </VButton>
        <VButton v-else-if="data.createForm" @click="addItem">
          <VIcon icon="add" /> Добавить элемент
        </VButton>
        <VInput placeholder="Поиск..."/>
      </div>
      <div class="views-page__layout">
        <VTable 
          v-if="data"
          v-model:checked="selectedItems"
          :checkable="data.view.data.delete?.enabled"
          :columns="columns" 
          :data="data.data" 
          :row-component="data.editForm? 'button': 'div'" 
          @itemclick="onItemClick"
        >
        </VTable>
        <VPagination v-model="searchOptions.page" :page-count="data.totalPages"/>
      </div>
      <AddColumnPopover v-bind="contextMenu.props" :table="data.view.systemTable" @addcolumn="addColumn"/>
    </template>
  </VLayout>
</template>

<script lang="ts" setup>
import { mutateRequestFull, useRequestWatch } from 'vuesix';
import VInput from '../components/VInput.vue';
import VButton from '../components/VButton.vue';
import { useContextMenu } from '../components/VContextMenu.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable from '../components/VTable.vue';
import { dataApi } from '../api/data';
import { useRouter } from 'vue-router';
import { computed, reactive, ref, watch } from 'vue';
import AddColumnPopover from '../components/AddColumnPopover.vue';
import { viewsApi } from '../api/views';
import dayjs from 'dayjs';
import VIconButton from '../components/VIconButton.vue';
import { useDialogStore } from '../stores/dialogStore';
import TableSettingsDialog from '../components/dialogs/TableSettingsDialog.vue';
import AddDataItemDialog from '../components/dialogs/AddDataItemDialog.vue';
import ConfirmDialog from '../components/dialogs/ConfirmDialog.vue';
import { num } from '../../plugin/utils/lang';
import VPagination from '../components/VPagination.vue';

const contextMenu = useContextMenu(() => [])

const router = useRouter()
const viewId = computed(() => router.currentRoute.value.params.viewId as string)

const searchOptions = reactive({ page: 0, search: "" })
const _searchOptions = computed(() => ({ 
  page: searchOptions.page === 0? undefined: searchOptions.page
}))
const { data, error } = useRequestWatch(dataApi.getData, viewId, _searchOptions)

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

const getSortableKey = (column: any) => {
  const keys = column.systemColumn.split(".")
  return (item: any) => {
    const value = getByKey(item, keys)
    return value ?? 0
  }
}

const columns = computed(() => {
  if (!data.value) return {}

  const columns = [
    ...data.value.view.columns.map((column: any, index: number) => [
      "column-"+index,
      { 
        sortableKey: getSortableKey(column),
        title: column.name,
        map: getMapMethod(column)
      }
    ]),
    [ "_addColumn", { 
      sortable: false, 
      headerProps: { class: "data-page__add-column", onClick: (e: MouseEvent) => contextMenu.open(e) }, 
      width: "120px",
      columnProps: { class: "data-page__more-cell" }
    }]
  ]
    
  return Object.fromEntries(columns)
})

const addColumn = async (newColumn: { name: string, format: string, systemColumn: string }) => {
  data.value.view.columns.push(newColumn)
  await viewsApi.updateView(viewId.value, data.value.view)
  mutateRequestFull(dataApi.getData)
}

const dialogStore = useDialogStore()
const editTable = () => {
  dialogStore.open(TableSettingsDialog, { viewId: viewId.value })
}

const addItem = () => {
  dialogStore.open(AddDataItemDialog, { viewId: viewId.value, form: data.value.createForm, systemTable: data.value.view.systemTable })
}

const onItemClick = (item: any) => {
  dialogStore.open(AddDataItemDialog, { item, viewId: viewId.value, form: data.value.editForm, systemTable: data.value.view.systemTable })
}

const selectedItems = ref<any>([])
watch(data, () => {
  selectedItems.value = []
})
const deleteItems = () => {
  dialogStore.open(ConfirmDialog, {
    title: `Удалить ${num(selectedItems.value.length, "элемент", "элемента", "элементов")}?`,
    text: "Отменить действие будет невозможно",
    confirmTitle: "Удалить",
    async onConfirm() {
      await dataApi.deleteElements(viewId.value, selectedItems.value.map((item: any) => item.id))
      mutateRequestFull(dataApi.getData)
    }
  })
}

</script>

<style lang="sass">
.data-page__add-column
  display: flex
  justify-content: center
  cursor: pointer
  border-radius: 0 12px 0 0 
  padding-right: 16px

  &:hover
    background-color: var(--hover-color)

.data-page__edit-button
  color: var(--text-secondary-color)

</style>