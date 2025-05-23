<template>
  <VDialog class="standart">
    <template #header>
      {{ props.item? "Редактирование": "Добавление" }} элемента
    </template>
    <Form v-model="data" :fields="props.form.fields" />
    <template #actions>
      <VButton outline @click="dialogStore.close">Отмена</VButton>
      <VButton :disabled="pending" @click="apply">{{ props.item? "Сохранить": "Добавить"}}</VButton>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { cloneDeep, mutateRequestFull, usePending } from 'vuesix';
import { useDialogStore } from '../../stores/dialogStore';
import VButton from '../VButton.vue';
import VDialog from '../VDialog.vue';
import { Form as FormType, formsApi } from '../../api/formsApi';
import Form from '../Form/Form.vue';
import { onMounted, provide, ref } from 'vue';
import { addFormComponent } from '../Form/FormItem.vue';

import VInput from '../VInput.vue';
import VSelect from '../VSelect.vue';
import VFileUploader from '../VFileUploader.vue';
import { dataApi } from '../../api/data';
import { traverseFormFields } from '../../utils/traverse';
import VCheckbox from '../VCheckbox.vue';
import VFormEditorSubitems from '../VFormEditorSubitems.vue';
import VGeoPicker from '../VGeoPicker.vue';
import VListInput from '../VListInput.vue';
import RichTextEditor from '../RichTextEditor.vue';
import VInputArray from '../VInputArray.vue';
import VDateRangePicker from '../VDateRangePicker.vue';
import VDatePicker from '../VDatePicker.vue';

const props = defineProps<{ viewId: string, form: FormType, systemTable: string, item?: any }>()

const dialogStore = useDialogStore()

const data = ref(cloneDeep(props.item ?? {}))

const uploader = new Set<() => Promise<void>>()
provide("uploader", uploader)

onMounted(() => {
  if (!props.item) return
  traverseFormFields(props.form.fields, formItem => {
    if (!formItem.fieldId) return
    if (formItem.jsonField) {
      data.value[formItem.fieldId] = props.item[formItem.jsonField][formItem.fieldId]
    } else if (formItem.aliasFieldId) {
      data.value[formItem.fieldId] = props.item[formItem.aliasFieldId]
    }
  })
})

const [ pending, handlePending ] = usePending()
const apply = handlePending(async () => {
  
  for (let upload of uploader) {
    await upload()
  }

  if (props.item) {
    await dataApi.updateElement(props.viewId, props.item.id, data.value)
  } else {
    await dataApi.createElement(props.viewId, data.value)
  }
  mutateRequestFull(dataApi.getData)
  dialogStore.close()
})

</script>

<script lang="ts">

addFormComponent("input", VInput)
addFormComponent("inputNumber", VInput)
addFormComponent("password", VInput)
addFormComponent("select", VSelect)
addFormComponent("file", VFileUploader)
addFormComponent("multiselect", VSelect)
addFormComponent("checkbox", VCheckbox)
addFormComponent("subitems", VFormEditorSubitems)
addFormComponent("geo", VGeoPicker)
addFormComponent("geoRoute", VGeoPicker)
addFormComponent("listInput", VListInput)
addFormComponent("jsonList", VFormEditorSubitems)
addFormComponent("files-group", VFileUploader)
addFormComponent("richText", RichTextEditor)
addFormComponent("inputArray", VInputArray)
addFormComponent("inputArrayNumber", VInputArray)
addFormComponent("dateRange", VDateRangePicker)
addFormComponent("date", VDatePicker)
addFormComponent("const", null)

</script>

<style lang="sass">

</style>