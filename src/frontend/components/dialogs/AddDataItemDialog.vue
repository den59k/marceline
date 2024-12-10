<template>
  <VDialog class="standart">
    <template #header>
      {{ props.item? "Редактирование": "Добавление" }} элемента
    </template>
    <Form v-model="data" :fields="props.form.fields" />
    <template #actions>
      <VButton outline @click="dialogStore.close">Отмена</VButton>
      <VButton @click="apply">{{ props.item? "Сохранить": "Добавить"}}</VButton>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { cloneDeep, mutateRequestFull } from 'vuesix';
import { useDialogStore } from '../../stores/dialogStore';
import VButton from '../VButton.vue';
import VDialog from '../VDialog.vue';
import { Form as FormType, formsApi } from '../../api/formsApi';
import Form from '../Form/Form.vue';
import { onMounted, ref } from 'vue';
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

const props = defineProps<{ viewId: string, form: FormType, systemTable: string, item?: any }>()

const dialogStore = useDialogStore()

const data = ref(cloneDeep(props.item ?? {}))

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

const apply = async () => {
  if (props.item) {
    await dataApi.updateElement(props.viewId, props.item.id, data.value)
  } else {
    await dataApi.createElement(props.viewId, data.value)
  }
  mutateRequestFull(dataApi.getData)
  dialogStore.close()
}

</script>

<script lang="ts">

addFormComponent("input", VInput)
addFormComponent("select", VSelect)
addFormComponent("file", VFileUploader)
addFormComponent("multiselect", VSelect)
addFormComponent("checkbox", VCheckbox)
addFormComponent("subitems", VFormEditorSubitems)
addFormComponent("geo", VGeoPicker)
addFormComponent("listInput", VListInput)
addFormComponent("jsonList", VFormEditorSubitems)
addFormComponent("files-group", VFileUploader)

</script>

<style lang="sass">

</style>