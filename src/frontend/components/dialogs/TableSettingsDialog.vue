<template>
  <VDialog class="standart">
    <template #header>
      Настройки таблицы
    </template>
    <div class="form-column">
      <div class="form-row">
        <VInput v-bind="register('name')" label="Название таблицы" />
        <VIconsSelector v-bind="register('icon')" style="margin-top: 20px"/>
      </div>
      <VInput v-bind="register('group')" label="Группа в меню"
        :placeholder="groupsHint" />
      <div v-if="existingGroups.length > 0" class="table-settings__groups">
        <button v-for="group in existingGroups" :key="group" type="button" @click="values.group = group">
          {{ group }}
        </button>
      </div>
      <VSelect v-if="actionsData && actionsData.length > 0" v-model="values.actions" label="Действия" multiple :items="actionsData" />
      <VCheckbox v-model="values.data.create.enabled" label="Разрешить создание объекта" style="margin-bottom: -8px"/>
      <VSelect v-model="values.data.create.form" :items="availableForms" 
        placeholder="Форма для создания объекта" :disabled="!values.data.create.enabled"/>

      <VCheckbox v-model="values.data.edit.enabled" label="Разрешить редактирование объекта" style="margin-bottom: -8px"/>
      <VSelect v-model="values.data.edit.form" :items="availableForms" 
        placeholder="Форма для редактирования объекта" :disabled="!values.data.edit.enabled"/>

      <VCheckbox v-model="values.data.delete.enabled" label="Разрешить удаление"/>
    </div>

    <template #actions>
      <VButton outline @click="dialogStore.close">Отмена</VButton>
      <VButton @click="save">Сохранить</VButton>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { mutateRequest, mutateRequestFull, useForm, useRequest, useRequestWatch } from 'vuesix';
import VDialog from '../VDialog.vue';
import { viewsApi } from '../../api/views';
import { computed } from 'vue';
import { utilsApi } from '../../api/utils';
import VSelect from '../VSelect.vue';
import VInput from '../VInput.vue';
import VIconsSelector from '../VIconsSelector.vue';
import VButton from '../VButton.vue';
import { useDialogStore } from '../../stores/dialogStore';
import VCheckbox from '../VCheckbox.vue';
import { formsApi } from '../../api/formsApi';
import { dataApi } from '../../api/data';

const props = defineProps<{ viewId: string }>()

const { data, error } = useRequest(viewsApi.getView, props.viewId)

const tableId = computed(() => data.value?.systemTable)
const { data: actionsData, setReturnData } = useRequestWatch(utilsApi.getActions, tableId)
setReturnData((tableName) => {
  if (!tableName) return []
})

const { register, handleSubmit, values, updateDefaultValuesWatch } = useForm({
  name: "",
  icon: "table",
  group: "",
  systemTable: null as string | null,
  columns: [],
  actions: [] as any[],
  data: {
    create: {
      enabled: true,
      form: null as string | null
    },
    edit: {
      enabled: true,
      form: null as string | null
    },
    delete: {
      enabled: true
    }
  }
}, { required: [ "name" ] })

updateDefaultValuesWatch(data, obj => ({
  ...obj,
  group: obj.group ?? "",
  actions: obj.actions?.map((item: string) => ({ id: item, title: item })) ?? []
}))

const { data: viewsData } = useRequest(viewsApi.getViews)
const existingGroups = computed(() => {
  if (!viewsData.value) return []
  return [ ...new Set(viewsData.value.map((item: any) => item.group).filter(Boolean)) ] as string[]
})
const groupsHint = computed(() => {
  if (existingGroups.value.length === 0) return "Без группы"
  return `Без группы, например «${existingGroups.value[0]}»`
})

const { data: modelsData } = useRequest(utilsApi.getModels)
const models = computed(() => {
  if (!modelsData.value) return []
  return modelsData.value.models.map(item => ({ id: item.name, title: item.name }))
})

const dialogStore = useDialogStore()
const save = handleSubmit(async (values) => {
  const _values = { ...values, actions: values.actions.map(item => item.id) }
  await viewsApi.updateView(props.viewId, _values)
  mutateRequest(viewsApi.getView, props.viewId)
  mutateRequest(viewsApi.getViews)
  mutateRequestFull(dataApi.getData)
  dialogStore.close()
})

const { data: formsData } = useRequest(formsApi.getAll)
const availableForms = computed(() => {
  if (!formsData.value || !data.value) return []
  return formsData.value.filter(item => item.systemTable === data.value.systemTable)
    .map(item => ({ id: item.id, title: item.name }))
})
  
</script>

<style lang="sass">
.table-settings__groups
  display: flex
  flex-wrap: wrap
  gap: 6px
  margin-top: -8px

  button
    background: none
    border: 1px solid var(--border-color)
    border-radius: 6px
    padding: 3px 8px
    font-size: 12px
    color: var(--text-secondary-color)
    cursor: pointer

    &:hover
      color: var(--text-color)
</style>