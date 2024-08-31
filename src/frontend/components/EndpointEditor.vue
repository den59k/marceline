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
      <template v-if="currentTab === 'create' || currentTab === 'edit'">
        <VSelect v-model="endpointData.form" :items="availableForms" label="Форма для изменения" />
      </template>
      <div v-if="hooksData" class="endpoint-editor__hooks">
        <ListEditor v-model="endpointData.hooks['onRequest']" :items="getHooks('onRequest')" label="Хуки onRequest"/>
        <ListEditor v-model="endpointData.hooks['bodyModifier']" :items="getHooks('bodyModifier')" label="Хуки bodyModifier"/>
        <ListEditor v-model="endpointData.hooks['postEffect']" :items="getHooks('postEffect')" label="Хуки postEffect"/>
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

const props = defineProps<{ systemTable: string, data: any[] }>()

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
const endpointsData: Record<EndpointType, { enabled: boolean, hooks: HooksData, form?: null | string }> = reactive({
  list: { enabled: true, hooks: {}, },
  get: { enabled: true, hooks: {}, },
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
  return hooksData.value[type].filter((item: any) => {
    if (!item.table) return true
    return Array.isArray(item.table)? item.table.includes(props.systemTable): item.table === props.systemTable
  }).map((item: any) => item.name)
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

</style>