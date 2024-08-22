<template>
  <VLayout :values="{ endpoint: endpointInfo? (endpointInfo.id? 'Изменение эндпоинта': 'Создание эндпоинта'): '' }">
    <template #header>
      <VButton v-if="hasChange" @click="save">Сохранить изменения</VButton>
    </template>
    <div class="form-row">
      <VInput v-bind="register('path')" label="Путь"/>
      <VSelect v-bind="register('systemTable')" :items="models" label="Системная таблица"/>
    </div>
    <div v-if="!values.systemTable" class="endpoint-editor__layout">
      <div class="endpoint-editor__available-items"></div>
      <div class="endpoint-editor__work-area">Сначала выберите системную таблицу</div>
    </div>
    <EndpointEditor v-else :data="values.data" :systemTable="values.systemTable" />
  </VLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VLayout from '../components/VLayout.vue';
import { parseItemId } from '../utils/parseItemId';
import { mutateRequest, useForm, useRequest, useRequestWatch } from 'vuesix';
import { endpointsApi } from '../api/endpoints';
import { utilsApi } from '../api/utils';
import VInput from '../components/VInput.vue';
import VSelect from '../components/VSelect.vue';
import EndpointEditor from '../components/EndpointEditor.vue';
import VButton from '../components/VButton.vue';

const router = useRouter()
const itemId = computed(() => parseItemId(router.currentRoute.value.params.endpointId))

const { data: endpointInfo, setReturnData } = useRequestWatch(endpointsApi.getEndpoint, itemId)
setReturnData(endpointId => {
  if (endpointId === null) return { systemTable: null, path: "", data: [] }
})

const { register, values, handleSubmit, hasChange, updateDefaultValues, updateDefaultValuesWatch } = useForm({
  systemTable: null as string | null,
  path: "",
  data: []
}, { required: [ "systemTable", "path" ]})
updateDefaultValuesWatch(endpointInfo)

const { data } = useRequest(utilsApi.getModels)
const models = computed(() => {
  if (!data.value) return []
  return data.value.models.map(item => ({ id: item.name, title: item.name }))
})

const save = handleSubmit(async (values) => {
  if (itemId.value) {
    await endpointsApi.updateEndpoint(itemId.value, values)
    mutateRequest(endpointsApi.getEndpoint, itemId.value)
  } else {
    const item = await endpointsApi.createEndpoint(values)
    router.push(`/dev/endpoints/${item.id}`)
  }
  mutateRequest(endpointsApi.getAll)
  updateDefaultValues(values)
})

</script>

<style lang="sass">

</style>