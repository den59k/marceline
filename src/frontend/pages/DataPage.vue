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
      <div ref="tableWrapperRef" class="views-page__layout data-page__table">
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
        <div v-for="(style, index) in moveMarkers" :style="style" class="data-page__move-marker" @columndrop="onColumnDrop($event, index)"></div>
      </div>
      <AddColumnPopover 
        v-bind="contextMenu.props" 
        :table="data.view.systemTable" 
        :column="activeColumn" 
        @addcolumn="addColumn"
        @deletecolumn="deleteColumn"
      />
    </template>
  </VLayout>
</template>

<script lang="ts" setup>
import { mutateRequestFull, useDraggableItem, useRequestWatch } from 'vuesix';
import VInput from '../components/VInput.vue';
import VButton from '../components/VButton.vue';
import { useContextMenu } from '../components/VContextMenu.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable from '../components/VTable.vue';
import { dataApi } from '../api/data';
import { useRouter } from 'vue-router';
import { computed, CSSProperties, reactive, ref, shallowRef, watch } from 'vue';
import AddColumnPopover from '../components/AddColumnPopover.vue';
import { viewsApi } from '../api/views';
import dayjs from 'dayjs';
import VIconButton from '../components/VIconButton.vue';
import { useDialogStore } from '../stores/dialogStore';
import TableSettingsDialog from '../components/dialogs/TableSettingsDialog.vue';
import AddDataItemDialog from '../components/dialogs/AddDataItemDialog.vue';
import ConfirmDialog from '../components/dialogs/ConfirmDialog.vue';
import { addDelimiter, num } from '../../plugin/utils/lang';
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
    if (!value) return null
    value = value[key]
  }
  return value
}

const getByFormula = (value: any, formula: string): string => {

  if (Array.isArray(value)) {
    return value.map((item: any) => getByFormula(item, formula)).join(", ")
  }

  const borders: { start: number, end: number }[] = []
  for (let i = 0; i < formula.length; i++) {
    if (formula[i] === "{" && formula[i-1] != "\\") {
      borders.push({ start: i, end: i })
    }
    if (formula[i] === "}" && formula[i-1] != "\\" && borders.length > 0) {
      borders[borders.length-1].end = i
    }
  }

  let str = ""
  let lastIndex = 0
  for (let item of borders) {
    if (item.end - item.start < 2) continue
    str += formula.slice(lastIndex, item.start)
    const varName = formula.slice(item.start+1, item.end)
    if (value[varName] !== null && value[varName] !== undefined) {
      str += value[varName]
    }
    lastIndex = item.end+1
  }
  str += formula.slice(lastIndex)
  return str
}

const getMapMethod = (column: any) => {
  const keys = column.systemColumn.split(".")
  if (column.format === 'count') {
    keys[keys.length-1] = keys[keys.length-1]+'_count'
  }

  return (item: any) => {
    const value = getByKey(item, keys)

    if (value === null || value === undefined) return "-"
    if (column.format === "formula") return getByFormula(value, column.formula)
    if (column.format === "decimal") return addDelimiter(value.toString())
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

const activeColumn = shallowRef<any>()
const drag = useDraggableItem()
const tableWrapperRef = ref<HTMLDivElement>()
const moveMarkers = shallowRef<CSSProperties[]>([])

const onColumnDrag = (e: MouseEvent, column: any) => {
  if (!tableWrapperRef.value) return
  drag(e, {
    onStart(item) { 
      const rootRect = tableWrapperRef.value!.getBoundingClientRect()
      item.classList.add("data-page__column-drag")
      const headers = Array.from(tableWrapperRef.value!.querySelectorAll(".data-table__header"))
      const markers = headers.map(item => item.getBoundingClientRect().left - rootRect.left - 1)

      moveMarkers.value = []
      for (let i = 0; i < markers.length; i++) {
        const left = i === 0? (markers[i]-100): (markers[i-1]+markers[i])/2
        const right = i === (markers.length - 1)? (markers[i]+100): (markers[i+1]+markers[i])/2
        moveMarkers.value.push({ left: left + "px", width: (right-left) + "px", paddingLeft: (markers[i] - left)+ "px" })
      }
    },
    onEnd(e) {
      e.target?.dispatchEvent(new ColumnDropEvent(column))
      moveMarkers.value = []
    },
    threshold: 5
  })
}
const onColumnDrop = async (e: ColumnDropEvent, index: number) => {
  const sourceIndex = viewColumns.value.indexOf(e.column)
  if (sourceIndex < 0) return
  if (index === sourceIndex || index === sourceIndex + 1) return
  viewColumns.value.splice(sourceIndex, 1)
  viewColumns.value.splice(index > sourceIndex? index-1: index, 0, e.column)
  await viewsApi.updateView(viewId.value, data.value.view)
  mutateRequestFull(dataApi.getData)
}

const columns = computed(() => {
  if (!data.value) return {}

  const columns = [
    ...data.value.view.columns.map((column: any, index: number) => [
      "column-"+index,
      { 
        sortableKey: getSortableKey(column),
        title: column.name,
        map: getMapMethod(column),
        width: column.size,
        headerProps: {
          class: "data-table__header",
          onContextmenu (e: MouseEvent) {
            activeColumn.value = column
            contextMenu.open(e)
          },
          onMousedown(e: MouseEvent) {
            e.preventDefault()
            onColumnDrag(e, column)
          }
        }
      }
    ]),
    [ "_addColumn", { 
      sortable: false, 
      headerProps: { 
        class: "data-page__add-column data-table__header", 
        onClick(e: MouseEvent) {
          activeColumn.value = null
          contextMenu.open(e) 
        } 
      }, 
      width: "120px",
      columnProps: { class: "data-page__more-cell" }
    }]
  ]
    
  return Object.fromEntries(columns)
})

const viewColumns = computed<any[]>(() => data.value.view.columns)

const addColumn = async (newColumn: { name: string, format: string, systemColumn: string }) => {
  if (activeColumn.value) {
    Object.assign(activeColumn.value, newColumn)
  } else {
    viewColumns.value.push(newColumn)
  }
  await viewsApi.updateView(viewId.value, data.value.view)
  mutateRequestFull(dataApi.getData)
}

const deleteColumn = async () => {
  if (!activeColumn.value) return
  const index = viewColumns.value.indexOf(activeColumn.value)
  if (index < 0) return
  viewColumns.value.splice(index, 1)
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
  if (!data.value.editForm) return
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

<script lang="ts">

class ColumnDropEvent extends Event {
  column: any
  constructor(column: any) {
    super("columndrop")
    this.column = column
  }
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

.data-page__column-drag
  display: flex 
  align-items: center
  padding-left: 16px
  background-color: var(--paper-color)
  opacity: 0.5

.data-page__table
  position: relative

.data-page__move-marker
  position: absolute
  height: 40px
  top: 0
  box-sizing: border-box

  &::after
    content: ""
    display: block
    height: 100%
    width: 2px
    margin-left: -1px
    background-color: var(--primary-color)
    display: none

  &:hover::after
    display: block

</style>