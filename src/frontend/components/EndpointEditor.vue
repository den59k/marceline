<template>
  <div class="endpoint-editor__layout">
    <div class="endpoint-editor__available-items app-sidebar__items">
      <div class="app-sidebar__group-title">Операции с объектом</div>
      <button v-for="item in tabs" class="app-sidebar__item" :class="{ 'active': item.id === currentTab }" @click="currentTab = item.id">
        <VIcon :icon="item.icon" /> {{ item.title }}
      </button>
    </div>
    <div class="endpoint-editor__work-area form-column">
      <div class="title">Свойства</div>
      <VCheckbox v-model="endpointData.enabled" label="Использовать эндпоинт"/>
      <FieldsSelector 
        v-if="currentTab === 'get' || currentTab === 'list'" 
        v-model="endpointData.fields"
        :table="props.systemTable" 
        label="Выбрать поля"
      />
      <div class="form-row" v-if="currentTab === 'create' || currentTab === 'edit'">
        <VSelect v-model="endpointData.form" :items="availableForms" label="Форма для изменения" />
      </div>
      <div v-if="hooksData" class="endpoint-editor__hooks">
        <ListEditor 
          v-model="endpointData.hooks['onRequest']" 
          :items="getHooks('onRequest')" 
          label="Хуки onRequest"
        />
        <ListEditor 
          v-if="currentTab !== 'get' && currentTab !== 'list'" 
          v-model="endpointData.hooks['bodyModifier']" 
          :items="getHooks('bodyModifier')" 
          label="Хуки bodyModifier"
        />
        <ListEditor 
          v-if="currentTab !== 'get' && currentTab !== 'list'" 
          v-model="endpointData.hooks['postEffect']" 
          :items="getHooks('postEffect')" 
          label="Хуки postEffect"
        />
        <ListEditor 
          v-if="currentTab === 'get' || currentTab === 'list'" 
          v-model="endpointData.filters" 
          :items="availableFilters" 
          label="Фильтры"
        >
          <template #item="{ item }">
            {{ item.param? `:${item.param}`: item.id }}
            <VIcon icon="arrow-right" style="margin-left: 10px"/>
            <VSelect v-model="item.field" :items="getFields()" placeholder="Выберите поле" class="endpoint-editor__field-select"/>
          </template>
        </ListEditor>
        <ListEditor
          v-if="currentTab === 'get' || currentTab === 'list'" 
          v-model="endpointData.hooks['responseModifier']"
          :items="getHooks('responseModifier')"
          label="Обработчики ответа"
        >
          
        </ListEditor>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import VIcon from './VIcon.vue';
import VCheckbox from './VCheckbox.vue';
import VSelect from './VSelect.vue';
import { useRequest } from 'vuesix';
import { formsApi } from '../api/formsApi';
import ListEditor from './ListEditor.vue';
import { utilsApi } from '../api/utils';
import FieldsSelector from './FieldsSelector.vue';
import { filterHooks } from '../utils/filterHooks';

const props = defineProps<{ systemTable: string, data: any[], urlParams: string[] }>()

type EndpointType = "list" | "get" | "create" | "edit" | "delete"
const currentTab = ref<EndpointType>("list")

const tabs: { id: EndpointType, title: string, icon: string }[] = [
  { id: "list", title: "Получить список", icon: "list" },
  { id: "get", title: "Получить элемент", icon: "object" },
  { id: "create", title: "Создание", icon: "add-item" },
  { id: "edit", title: "Изменение", icon: "note-edit" },
  { id: "delete", title: "Удаление", icon: "delete" },
]

const { data: formsData } = useRequest(formsApi.getAll)
const availableForms = computed(() => {
  if (!formsData.value) return []
  return formsData.value.filter(item => item.systemTable === props.systemTable).map(item => ({ id: item.id, title: item.name }))
})

watch([ formsData, () => props.systemTable ], () => {
  if (!formsData.value) return
}, { immediate: true })

type HooksData = Record<string, string[]>
type EndpointData = { enabled: boolean, hooks: HooksData, form?: null | string, fields?: any, filters?: any }
const endpointsData: Record<EndpointType, EndpointData> = reactive({
  list: { enabled: true, hooks: {}, fields: {}, filters: [] },
  get: { enabled: true, hooks: {}, fields: {}, filters: [] },
  create: { enabled: true, hooks: {}, form: null },
  edit: { enabled: true, hooks: {}, form: null },
  delete: { enabled: true, hooks: {}, },
})

watch(() => props.data, () => {
  for (let item of props.data) {
    const _item = endpointsData[item.id as EndpointType]
    Object.assign(_item, item)
  }
}, { immediate: true })

watch(endpointsData, () => {
  for (let [ key, item ] of Object.entries(endpointsData)) {
    const _item = props.data.find(item => item.id === key)
    if (!_item) {
      props.data.push({ id: key, ...item  })
    } else {
      Object.assign(_item, item)
    }
  }
}, { deep: true, immediate: true })

const endpointData = computed(() => endpointsData[currentTab.value])

const { data: hooksData } = useRequest(utilsApi.getHooks)
const getHooks = (type: string) => {
  if (!hooksData.value) return []
  return filterHooks(hooksData.value[type], props.systemTable)
    .filter(item => !(item.options.allow === 'list' && currentTab.value === 'list') && !(item.options.allow === 'object' && currentTab.value === 'list'))
    .map((item: any) => item.name)
}

const availableFilters = computed(() => {
  const arr: { id: string, param?: string, field: null | string }[] = []
  for (let item of props.urlParams) {
    arr.push({ id: "param", param: item, field: null })
  }
  for (let item of filterHooks(hooksData.value.filter, props.systemTable)) {
    arr.push({ id: item.name, field: null })
  }
  return arr 
})

const { data: modelsData } = useRequest(utilsApi.getModels)
const currentTable = computed(() => getTable(props.systemTable))

const getTable = (table: string) => {
  return modelsData.value?.models.find(item => item.name === table) ?? null
}

const getFields = () => {
  if (!currentTable.value) return []
  return currentTable.value.fields
    .filter(item => item.kind !== 'object')
    .map(item => ({ id: item.name, title: item.name }))
}

</script>

<style lang="sass">

.endpoint-editor__layout
  flex: 1 1 auto
  margin-top: 12px
  border-radius: 12px
  display: flex
  border: 1px solid var(--border-color)

.endpoint-editor__available-items
  width: 230px
  background-color: var(--paper-color)
  border-radius: 11px 0 0 11px
  flex: 0 0 auto

  .app-sidebar__group-title
    margin-top: 16px

.endpoint-editor__work-area
  flex: 1 1 auto
  padding: 24px

.endpoint-editor__hooks
  display: flex
  gap: 28px

  .list-editor
    flex: 1 1 50px

.endpoint-editor__field-select
  flex: 1 1 auto
  border: none
  margin-right: -4px

  .v-select__activator
    padding: 0 12px

  .v-form-control__outline
    border: none

</style>