<template>
  <div class="form-editor-json-list-props">
    <div class="v-form-control__label">Поля массива</div>
    <ListEditor v-model="model" :default-item="defaultItem">
      <template #item="{ item }">
        <input v-model="item.fieldId" placeholder="ID поля"/>
        <VSelect v-model="item.type" :items="arrayInputTypes" placeholder="Тип поля"/>
      </template>
    </ListEditor>
    <template v-for="item in model">
      <div v-if="item.type === 'select'" class="form-editor-json-list-props__select-title">Настройки {{ item.fieldId }}</div>
      <FormEditorEnumValues v-if="item.type === 'select'" v-model="item.enum" editable/>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import ListEditor from '../ListEditor.vue';
import VSelect from '../VSelect.vue';
import FormEditorEnumValues from './FormEditorEnumValues.vue';
import { useVModel } from '@vueuse/core';

type Item = {
  fieldId: string,
  type: string,
  enum?: any[]
}

const props = defineProps<{ modelValue?: Array<Item> }>()
const emit = defineEmits([ "update:modelValue" ])
const model = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] })

if (!props.modelValue) {
  emit("update:modelValue", model.value)
}

const defaultItem = { fieldId: "", type: "" }

const arrayInputTypes = [
  { id: "input", title: "Строка" },
  { id: "number", title: "Число" },
  { id: "bool", title: "Bool" },
  { id: "select", title: "Select" },
]

</script>

<style lang="sass">

.form-editor-json-list-props
  .list-editor__item  
    .v-form-control, input
      flex: 1 1 50px

    input
      min-width: 50px
      background: none
      height: 100%
      border: none
      outline: none

  .v-select .v-form-control__outline
    border: none

  .v-select__activator
    padding: 0 8px

.form-editor-json-list-props__select-title
  font-size: 13px
  color: var(--text-secondary-color)
  margin-top: 12px
  margin-bottom: 6px

</style>