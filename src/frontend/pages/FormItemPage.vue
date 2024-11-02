<template>
  <VLayout :values="{ form: formInfo? (formInfo.name || 'Создание формы'): '' }">
    <template #header>
      <VButton v-if="hasChange" @click="save">Сохранить изменения</VButton>
    </template>
    <div class="form-row">
      <VSelect v-bind="register('systemTable')" :items="models" label="Системная таблица"/>
      <VInput v-bind="register('name')" label="Название"/>
    </div>
    <div v-if="!tablesData || !values.systemTable" class="form-editor__layout form-item-page__form-editor">
      <div class="form-editor__available-fields"></div>
      <div class="form-editor__work-area">
        <template v-if="formInfo">Выберите таблицу для создания формы</template>
      </div>
    </div>
    <FormEditor v-model="values.fields" v-else :fields="fields" :body-modifiers="values.bodyModifiers" :systemTable="values.systemTable" class="form-item-page__form-editor"/>
  </VLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { mutateRequest, useForm, useRequest, useRequestWatch } from 'vuesix';
import { utilsApi } from '../api/utils';
import VInput from '../components/VInput.vue';
import VSelect from '../components/VSelect.vue';
import VLayout from '../components/VLayout.vue';
import FormEditor from '../components/FormEditor/FormEditor.vue';
import VButton from '../components/VButton.vue';
import { formsApi } from '../api/formsApi';
import { parseItemId } from '../utils/parseItemId';
import { useRouter } from 'vue-router';

const router = useRouter()
const formId = computed(() => parseItemId(router.currentRoute.value.params.formId))

const { data: formInfo, setReturnData } = useRequestWatch(formsApi.getForm, formId)
setReturnData(formId => {
  if (formId === null) return { systemTable: null, name: "", fields: [], bodyModifiers: [] }
})

const { register, values, handleSubmit, hasChange, updateDefaultValues, updateDefaultValuesWatch } = useForm({
  systemTable: null as string | null,
  name: "",
  fields: [],
  bodyModifiers: []
})
updateDefaultValuesWatch(formInfo)

const mapField = (field: any) => {
  if (field.kind === "enum") {
    const enumValues = tablesData.value!.enums.find(enumItem => enumItem.name === field.type)?.values.map(item => item.name)
    if (enumValues) {
      return { ...field, enum: enumValues }
    }
  }
  return field
}

const fields = computed(() => {
  if (!values.systemTable || !tablesData.value) return []
  
  const table = tablesData.value.models.find(item => item.name === values.systemTable)
  if (!table) return []

  return table.fields.map(mapField)
})

const save = handleSubmit(async (values) => {
  if (formId.value) {
    await formsApi.updateForm(formId.value, values)
    mutateRequest(formsApi.getForm, formId.value)
  } else {
    const item = await formsApi.createForm(values)
    router.push(`/dev/forms/${item.id}`)
  }
  mutateRequest(formsApi.getAll)
  updateDefaultValues(values)
})

const { data: tablesData } = useRequest(utilsApi.getModels)
const models = computed(() => {
  if (!tablesData.value) return []
  return tablesData.value.models.map(item => ({ id: item.name, title: item.name }))
})

</script>

<style lang="sass">
.form-item-page__form-editor
  margin-top: 12px
  border-radius: 12px
  border: 1px solid var(--border-color)
  flex: 1 1 auto
  display: flex

  .form-editor__available-fields
    background-color: var(--paper-color)
    border-radius: 11px 0 0 11px

</style>