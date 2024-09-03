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
import { mutateRequest, mutateRequestFull, useForm, useRequest } from 'vuesix';
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

const { register, handleSubmit, values, updateDefaultValuesWatch } = useForm({
  name: "",
  icon: "table",
  systemTable: null as string | null,
  columns: [],
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
updateDefaultValuesWatch(data)

const { data: modelsData } = useRequest(utilsApi.getModels)
const models = computed(() => {
  if (!modelsData.value) return []
  return modelsData.value.models.map(item => ({ id: item.name, title: item.name }))
})

const dialogStore = useDialogStore()
const save = handleSubmit(async () => {
  await viewsApi.updateView(props.viewId, values)
  mutateRequest(viewsApi.getView, props.viewId)
  mutateRequest(viewsApi.getViews)
  mutateRequestFull(dataApi.getData)
  dialogStore.close()
})

const { data: formsData } = useRequest(formsApi.getAll)
const availableForms = computed(() => {
  if (!formsData.value || !data.value) return []
  return formsData.value.filter(item => item.systemTable === data.value.systemTable)
    .map(item => ({ id: item.systemTable, title: item.name }))
})

  
</script>

<style lang="sass">

</style>