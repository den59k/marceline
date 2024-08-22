<template>
  <div class="form-editor-field-props">
    <template v-if="props.item && activeFormItemField">
      <div class="subtitle">Поле "{{ props.item.fieldId }}"</div>
      <VSelect 
        label="Отображение" 
        v-model="props.item.format" 
        :items="getFormats(activeFormItemField!)"
      />
      <FormEditorEnumValues 
        v-if="props.item.format === 'select'" 
        v-model="props.item.enum"
        :editable="activeFormItemField?.kind !== 'enum'"
      />
      <VInput v-if="props.item.isCustom" label="Системное название" v-model="props.item.fieldId" />
      <VInput label="Название поля" v-model="props.item.name"/>
      <VInput label="Placeholder" v-model="props.item.placeholder"/>
      <VInput 
        v-if="props.item.format === 'file' || props.item.format === 'files-group'" 
        label="Поле для файла" 
        v-model="props.item.fileField" 
      />
      <VSelect
        v-if="props.item.isCustom"
        v-model="customFieldValue"
        :items="customFieldItems"
        label="Действие для кастомного поля"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FormItem } from '../../api/formsApi';
import VInput from '../VInput.vue';
import VSelect from '../VSelect.vue';
import { Field } from './FormEditor.vue';
import FormEditorEnumValues from './FormEditorEnumValues.vue';

const props = defineProps<{ item: FormItem | null, fieldsMap: Map<string, Field> }>()

const customField: Field = { name: 'custom', type: 'custom', kind: 'custom' }

const activeFormItemField = computed(() => {
  if (!props.item) return null
  if (props.item.isCustom) return customField
  if (!props.item.fieldId) return null
  return props.fieldsMap.get(props.item.fieldId)
})

const customFieldItems = computed(() => {
  const arr: { title: string, id: string }[] = []
  for (let field of props.fieldsMap.values()) {
    if (field.type === "Json") {
      arr.push({ id: field.name, title: `Положить в JSON "${field.name}"` })
    }
  }
  return arr
})

const customFieldValue = computed({
  get() {
    return props.item?.jsonField ?? null
  },
  set(value: string | null) {
    if (!props.item) return
    delete props.item.jsonField 
    if (value === null) {
      return
    }
    props.item.jsonField = value
  }
})

</script>

<script lang="ts">

export const getFormats = (item: Field) => {
  if (item.isList) {
    return [
      { id: "files-group", title: "Загрузка файлов" },
      { id: "inputs-group", title: "Ввод нескольких значений" }
    ]
  }

  if (item.kind === 'enum') {
    return [ 
      { id: "select", title: "Выбор из вариантов" }
    ]
  }
  if (item.type === 'Int' || item.type === "Float" || item.type === "Double") {
    return [
      { id: "inputNumber", title: "Поле ввода числа" },
    ]
  }

  return [ 
    { id: "input", title: "Поле ввода" },
    { id: "password", title: "Скрытое поле" },
    { id: "multiline", title: "Область текста" },
    { id: "select", title: "Выбор из вариантов" },
    { id: "file", title: "Загрузка файла" }
 ]
}



</script>

<style lang="sass">
.form-editor-field-props
  border-left: 1px solid var(--border-color)
  width: 380px
  flex-shrink: 0
  display: flex
  flex-direction: column
  padding: 16px
  box-sizing: border-box
  gap: 16px

  &>.subtitle
    color: var(--text-secondary-color)
    font-size: 14px

</style>