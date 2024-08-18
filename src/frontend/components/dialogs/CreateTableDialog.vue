<template>
  <VDialog class="standart">
    <template #header>
      Добавить таблицу
    </template>
    <div class="form-column">
      <VSelect v-bind="register('systemTable')" :items="models" label="Системная таблица" />
      <VInput v-bind="register('name')" label="Название таблицы" />
    </div>
    <template #actions>
      <VButton outline @click="dialogStore.close">Отмена</VButton>
      <VButton @click="apply" :disabled="!requiredFilled || pending">Сохранить</VButton>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { useForm, useRequest } from 'vuesix';
import VInput from '../forms/VInput.vue';
import VSelect from '../forms/VSelect.vue';
import VDialog from '../VDialog.vue';
import { utilsApi } from '../../api/utils';
import { computed } from 'vue';
import VButton from '../VButton.vue';
import { useDialogStore } from '../../stores/dialogStore';
import { viewsApi } from '../../api/views';

const dialogStore = useDialogStore()

const { register, handleSubmit, requiredFilled, pending } = useForm({
  systemTable: null as string | null,
  name: "",
}, { required: [ "systemTable", "name" ] })

const { data } = useRequest(utilsApi.getModels)
const models = computed(() => {
  if (!data.value) return []
  return data.value.models.map(item => ({ id: item.name, title: item.name }))
})

const apply = handleSubmit(async (values) => {
  await viewsApi.createView(values)
  dialogStore.close()
})

</script>

<style lang="sass">

</style>