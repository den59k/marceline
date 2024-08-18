<template>
  <VLayout :values="{ form: formInfo? (formInfo.name || 'Создание формы'): '' }">
    <template #header>
      <VButton v-if="hasChange" @click="save">Сохранить изменения</VButton>
    </template>
    <div class="form-row">
      <VSelect v-bind="register('systemTable')" :items="models" label="Системная таблица"/>
      <VInput v-bind="register('name')" label="Название"/>
    </div>
    <div v-if="!data || !values.systemTable" class="form-editor__layout form-item-page__form-editor">
      <div class="form-editor__available-fields"></div>
      <div class="form-editor__work-area">
        <template v-if="formInfo">Выберите таблицу для создания формы</template>
      </div>
    </div>
    <FormEditor v-model="values.fields" v-else :fields="fields" class="form-item-page__form-editor"/>
  </VLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { mutateRequest, useForm, useRequest } from 'vuesix';
import { utilsApi } from '../api/utils';
import VInput from '../components/forms/VInput.vue';
import VSelect from '../components/forms/VSelect.vue';
import VLayout from '../components/VLayout.vue';
import FormEditor from '../components/FormEditor/FormEditor.vue';
import VButton from '../components/VButton.vue';
import { formsApi } from '../api/formsApi';
import { parseItemId } from '../utils/parseItemId';
import { useRouter } from 'vue-router';

const { data } = useRequest(utilsApi.getModels)

const router = useRouter()
const formId = computed(() => parseItemId(router.currentRoute.value.params.formId))

const { data: formInfo, setReturnData } = useRequest(formsApi.getForm, formId.value)
setReturnData(formId => {
  if (formId === null) return { systemTable: null, name: "", fields: [] }
})

const models = computed(() => {
  if (!data.value) return []
  return data.value.models.map(item => ({ id: item.name, title: item.name }))
})

const { register, values, handleSubmit, hasChange, updateDefaultValues, updateDefaultValuesWatch } = useForm({
  systemTable: null as string | null,
  name: "",
  fields: []
})
updateDefaultValuesWatch(formInfo)

const fields = computed(() => {
  if (!values.systemTable || !data.value) return []
  
  const table = data.value.models.find(item => item.name === values.systemTable)
  if (!table) return []

  return table.fields
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