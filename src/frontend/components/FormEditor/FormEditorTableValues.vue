<template>
  <div class="form-editor-table-values">
    <div class="v-form-control__label">Поля таблицы</div>
    <table>
      <tr v-for="field in props.modelValue" class="form-editor-table-values__item">
        <td class="checkbox-cell">
          <VCheckbox 
            v-model="field.enabled"
            :label="field.fieldId"
          />
        </td>
        <td class="input-cell">
          <VInput v-model="field.name" placeholder="Название столбца" :disabled="!field.enabled"/>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { useRequest } from 'vuesix';
import { FormItem } from '../../api/formsApi';
import { computed, watch } from 'vue';
import { utilsApi } from '../../api/utils';
import VCheckbox from '../VCheckbox.vue';
import VInput from '../VInput.vue';

const props = defineProps<{ item: FormItem, modelValue?: Array<{ fieldId: string, name: string, enabled: boolean }> }>()
const emit = defineEmits([ "update:modelValue" ])

const { data: tablesData } = useRequest(utilsApi.getModels)
const table = computed(() => {
  return tablesData.value?.models.find(item => item.name === props.item.relationType) ?? null
})
const fields = computed(() => {
  if (!table.value) return []
  const oppositeColumn = table.value.fields.find(field => field.name === props.item.relationBridgeFieldId)
  const columns = table.value.fields
    .filter(field => 
      field.name !== props.item.relationBridgeFieldId && 
      !oppositeColumn?.relationFromFields?.includes(field.name)
    )
    .map(item => ({
      fieldId: item.name,
      default: item.default
    }))

  return columns
})

watch(fields, (fields) => {
  if (fields.length === 0) return
  if (!props.modelValue) {
    const defaultValue = fields.map(item => ({ fieldId: item.fieldId, name: item.fieldId, enabled: !item.default }))
    emit("update:modelValue", defaultValue)
  }
}, { immediate: true })

</script>

<style lang="sass">

.form-editor-table-values
  table
    width: 100%

.form-editor-table-values__item
  height: 38px

  .checkbox-cell
    padding-right: 8px

  .input-cell
    padding-right: 0
    .v-input
      width: 100%
      height: 32px
    input
      padding: 0 10px

</style>