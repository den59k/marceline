<template>
  <div class="fields-selector">
    <div v-if="props.label" class="fields-selector__label">{{ props.label }}</div>
    <template v-for="item in currentTable?.fields">
      <VCollapse v-if="item.kind === 'object'" :label="item.name">
        <FieldsSelector 
          :model-value="props.modelValue?.[item.name] as Fields" 
          :table="item.type" 
          @update:model-value="onModelValueUpdate(item.name, $event)"
        />
      </VCollapse>
      <VCheckbox 
        v-else 
        :label="item.name" 
        :model-value="props.modelValue && item.name in props.modelValue" 
        @update:model-value="onModelValueUpdate(item.name, $event)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useRequest } from 'vuesix';
import { utilsApi } from '../api/utils';
import { computed } from 'vue';
import VCheckbox from './VCheckbox.vue';
import VCollapse from './VCollapse.vue';

type Fields = { [key: string]: boolean | Fields }

const props = defineProps<{ table: string, label?: string, modelValue?: Fields }>()
const emit = defineEmits([ "update:modelValue" ])
const { data: modelsData } = useRequest(utilsApi.getModels)

const currentTable = computed(() => getTable(props.table))

const getTable = (table: string) => {
  return modelsData.value?.models.find(item => item.name === table) ?? null
}

const onModelValueUpdate = (key: string, value: boolean | Fields) => {
  const obj = props.modelValue ?? {}
  if (value === false) {
    delete obj[key]
  } else if (value === true) {
    obj[key] = true
  } else if (typeof value === "object") {
    if (Object.keys(value).length === 0) {
      delete obj[key]
    } else {
      obj[key] = value
    }
  }
  emit("update:modelValue", obj)
}

</script>

<style lang="sass">
.fields-selector
  display: flex
  flex-direction: column
  gap: 8px  
  padding: 8px 0

  .v-checkbox
    gap: 8px
  
  .v-collapse__activator
    height: 18px
    font-size: 13px
    gap: 7px
    &>svg
      margin-left: -1px

  .v-collapse__content
    padding-left: 28px

.fields-selector__label
  font-size: 12px
  letter-spacing: 0.04em
  color: var(--text-secondary-color)


</style>