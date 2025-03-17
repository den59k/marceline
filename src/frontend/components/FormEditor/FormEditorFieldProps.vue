<template>
  <div class="form-editor-field-props">
    <template v-if="!props.item">
      <div class="subtitle">Данные формы</div>
      <ListEditor v-model="props.bodyModifiers" :items="bodyModifiers" addLabel="Добавить модификатор" label="Модификаторы объекта"/>
      <ListEditor :items="[]" addLabel="Добавить хук" label="Хуки postEffect"/>
    </template>
    <template v-else-if="props.item && activeFormItemField">
      <div class="subtitle">Поле "{{ props.item.fieldId }}"</div>
      <VSelect 
        label="Отображение" 
        v-model="props.item.format" 
        :items="getFormats(activeFormItemField!)"
      />
      <VInput 
        v-if="props.item.format === 'file' || props.item.format === 'file-group'"
        label="Поле accept"
        placeholder="image/*"
        :validator="val => val === ''? null: val"
        v-model="props.item.accept"
      />
      <FormEditorEnumValues 
        v-if="props.item.format === 'select' && !props.item.relationType" 
        v-model="props.item.enum"
        :editable="activeFormItemField?.kind !== 'enum'"
      />
      <FormEditorTableValues v-if="props.item.format === 'subitems'" v-model="props.item.columns" :item="props.item"/>
      <VInput v-if="props.item.isCustom" label="Системное название" v-model="props.item.fieldId" />
      <template v-if="props.item.format === 'const'">
        <VCheckbox v-if="activeFormItemField.type === 'Boolean'" v-model="props.item.value" label="Значение"/>
        <VSelect v-else-if="activeFormItemField.kind === 'enum' && props.item.enum" v-model="props.item.value" label="Значение" :items="props.item.enum"/>
        <VInput v-else v-model="props.item.value" label="Значение"/>
      </template>
      <template v-else>
        <VInput label="Название поля" v-model="props.item.name"/>
        <VInput label="Placeholder" v-model="props.item.placeholder"/>
      </template>
      <VSelect 
        v-if="props.item.format === 'file' || props.item.format === 'files-group'"
        v-model="props.item.fileIdField"
        label="Поле для ID файлов"
        :items="suitableFileIdFields"
      />
      <FormEditorJsonListProps v-if="props.item.format === 'jsonList'" v-model="props.item.columns" />
      <VInput 
        v-if="props.item.format === 'geo' || props.item.format === 'geoRoute'"
        label="Начальные координаты"
        v-model="props.item.initialLatLng"
        placeholder="55.76, 37.64"
      />
      <VSelect
        v-if="props.item.isCustom && props.item.format !== 'file' && props.item.format !== 'files-group'"
        v-model="customFieldValue"
        :items="customFieldItems"
        label="Действие для кастомного поля"
      />
      <ListEditor
        v-model="props.item.modifiers"
        :items="fieldModifiers" 
        addLabel="Добавить модификатор поля" 
        label="Модификаторы поля"
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
import ListEditor from '../ListEditor.vue';
import { useRequest } from 'vuesix';
import { utilsApi } from '../../api/utils';
import VCheckbox from '../VCheckbox.vue';
import FormEditorTableValues from './FormEditorTableValues.vue';
import FormEditorJsonListProps from './FormEditorJsonListProps.vue';

const props = defineProps<{ item: FormItem | null, fieldsMap: Map<string, Field>, bodyModifiers?: string[], systemTable: string }>()

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

const suitableFileIdFields = computed(() => {
  if (!props.item || (props.item.format !== "file" && props.item.format !== "files-group")) return []
  const arr: { id: string, title: string }[] = []
  for (let [key, value] of props.fieldsMap) {
    if (props.item.format === "files-group") {
      if (value.isList && value.kind === "scalar" && value.type === "String") {
        arr.push({ id: key, title: key })
      }
    } else {
      if (value.kind === "scalar" && value.type === "String") {
        arr.push({ id: key, title: key })
      }
    }
  }
  return arr
})

const { data: hooksData } = useRequest(utilsApi.getHooks)
const fieldModifiers = computed(() => {
  if (!hooksData.value) return []
  return hooksData.value.fieldModifier.map((item: any) => item.name)
})
const bodyModifiers = computed(() => {
  if (!hooksData.value) return []
  return hooksData.value.bodyModifier.map((item: any) => item.name)
})

</script>

<script lang="ts">

export const getFormats = (item: Field) => {
  if (item.isList && item.kind !== "scalar") {
    return [
      { id: "multiselect", title: "Выбор из нескольких вариантов" },
      { id: "subitems", title: "Ввод значений" },
      { id: "files-group", title: "Загрузка файлов" }
    ]
  }

  if (item.isList && item.kind === "scalar") {
    return [
      { id: "listInput", title: "Ввод значений" },
      { id: "listSelect", title: "Выбор из вариантов" },
      { id: "files-group", title: "Загрузка файлов" }
    ]
  }

  if (item.kind === 'enum') {
    return [ 
      { id: "select", title: "Выбор из вариантов" },
      { id: 'const', title: "Константное значение" }
    ]
  }
  if (item.type === 'Int' || item.type === "Float" || item.type === "Double") {
    return [
      { id: "inputNumber", title: "Поле ввода числа" },
      { id: 'const', title: "Константное значение" },
    ]
  }
  if (item.type === "Boolean") {
    return [
      { id: "checkbox", title: "Чекбокс" },
      { id: 'const', title: "Константное значение" },
    ]
  }

  if (item.type === "Json") {
    return [
      { id: "jsonInput", title: "Ввод JSON" },
      { id: "jsonList", title: "Редактор массива" },
      { id: "richText", title: "Rich редактор текста" }
    ]
  }
  
  if (item.type === "custom") {
    return [ 
      { id: "input", title: "Поле ввода" },
      { id: "password", title: "Скрытое поле" },
      { id: "multiline", title: "Область текста" },
      { id: "select", title: "Выбор из вариантов" },
      { id: 'const', title: "Константное значение" },
      { id: "geo", title: "Точка на карте" },
      { id: "geoRoute", title: "Маршрут на карте" },
      { id: "checkbox", title: "Чекбокс" },
      { id: "inputNumber", title: "Поле ввода числа" },
      { id: "file", title: "Загрузка файла" },
      { id: "files-group", title: "Загрузка нескольких файлов" }
    ]
  }

  return [ 
    { id: "input", title: "Поле ввода" },
    { id: "password", title: "Скрытое поле" },
    { id: "multiline", title: "Область текста" },
    { id: "select", title: "Выбор из вариантов" },
    { id: 'const', title: "Константное значение" },
    { id: "file", title: "Загрузка файла" },
    { id: "geo", title: "Точка на карте" },
    { id: "geoRoute", title: "Маршрут на карте" },
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