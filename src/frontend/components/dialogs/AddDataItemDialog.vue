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
import { cloneDeep, mutateRequest } from 'vuesix';
import { useDialogStore } from '../../stores/dialogStore';
import VButton from '../VButton.vue';
import VDialog from '../VDialog.vue';
import { Form as FormType, formsApi } from '../../api/formsApi';
import Form from '../Form/Form.vue';
import { ref } from 'vue';
import { addFormComponent } from '../Form/FormItem.vue';

import VInput from '../VInput.vue';
import VSelect from '../VSelect.vue';
import VFileUploader from '../VFileUploader.vue';
import { dataApi } from '../../api/data';

const props = defineProps<{ viewId: string, form: FormType, systemTable: string, item?: any }>()

const dialogStore = useDialogStore()

const data = ref(cloneDeep(props.item ?? {}))

const apply = async () => {
  if (props.item) {
    await dataApi.updateElement(props.viewId, props.item.id, data.value)
  } else {
    await dataApi.createElement(props.viewId, data.value)
  }
  mutateRequest(dataApi.getData, props.viewId)
  dialogStore.close()
}

</script>

<script lang="ts">

addFormComponent("input", VInput)
addFormComponent("select", VSelect)
addFormComponent("file", VFileUploader)

</script>

<style lang="sass">

</style>