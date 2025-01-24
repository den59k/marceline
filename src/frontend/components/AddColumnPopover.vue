<template>
  <VPopover 
    :open="open" 
    @update:open="emit('update:open', $event)" 
    :placement="props.column? 'bottom-start': 'bottom-end'" 
    class="add-column-popover"
  >
    <VInput v-bind="register('name')" placeholder="Название столбца" autofocus/>

    <VFormControl v-if="values.selectedItem" outline class="v-select" label="Системное поле">
      <button class="v-select__activator" @click="setField(null)">
        <div>
          {{ [ ...relationItem, values.selectedItem ].map(item => item.name).join(".") }}
        </div>
        <VIcon icon="arrow-down" />
      </button>
    </VFormControl>
    <div v-else class="add-column-popover__avilable-fields">
      <VButton v-if="relationItem.length > 0" @click="relationItem.pop()" class="back-button"> 
        <VIcon icon="chevron-left"/> Назад
      </VButton>
      <VButton v-for="item in fields" @click="setField(item)">
        {{ item.name }}
        <VIcon v-if="item.relationName && !item.isList" icon="chevron-right" class="arrow-icon"/>
      </VButton>
    </div>
    <template v-if="values.selectedItem" >
      <VSelect v-bind="register('format')" :items="formats" label="Формат отображения"  />
      <VInput v-if="values.format === 'formula'" v-bind="register('formula')" label="Выражение" />
      <VSelect v-bind="register('size')" :items="sizeItems" label="Размер столбца"/>
    </template>
    <div class="add-column-popover__actions">
      <VButton v-if="props.column" outline class="delete-button" @click="deleteColumn"><VIcon icon="delete" /></VButton>
      <VButton outline @click="close">Отмена</VButton>
      <VButton v-if="values.selectedItem" @click="apply">
        {{ props.column? "Сохранить": "Добавить" }}
      </VButton>
    </div>
  </VPopover>
</template>

<script lang="ts" setup>
import { useForm, useRequest } from 'vuesix';
import VPopover from './VPopover.vue';
import { utilsApi } from '../api/utils';
import VInput from './VInput.vue';
import VButton from './VButton.vue';
import { computed, reactive, watch } from 'vue';
import VFormControl from './VFormControl.vue';
import VIcon from './VIcon.vue';
import VSelect from './VSelect.vue';

const { register, values, updateDefaultValues, setError } = useForm({
  name: "",
  selectedItem: null as any,
  format: null as string | null,
  formula: "",
  size: null as string | null
})

const props = defineProps<{ open?: boolean, table: string, column?: any }>()
const emit = defineEmits([ "update:open", "addcolumn", "deletecolumn" ])

const { data } = useRequest(utilsApi.getModels)

const relationItem = reactive<any[]>([])

watch(() => props.column, (column) => {
  if (!column) {
    updateDefaultValues({ name: "", selectedItem: null, format: null })
  } else {
    const path = column.systemColumn.split(".")
    const fieldsPath = []
    let tableName = props.table
    for (let pathItem of path) {
      const field = getFields(tableName).find(item => item.name === pathItem)
      if (!field) {
        fieldsPath.push({ name: pathItem })
        continue
      }
      tableName = field.type
      fieldsPath.push(field)
    }
    
    relationItem.length = 0
    relationItem.push(...fieldsPath.slice(0, -1))
    updateDefaultValues({ ...column, selectedItem: fieldsPath.at(-1) })
  }
})

const getFields = (systemTable :string) => {
  const table = data.value?.models.find(item => item.name === systemTable)
  return table?.fields ?? []
}

const fields = computed(() => {
  if (!data.value) return []
  const tableName = relationItem.length > 0? relationItem[relationItem.length-1].type: props.table
  return getFields(tableName)
})

const setField = (item: any) => {
  if (item === null) {
    values.selectedItem = null
    return
  }

  if (item.relationName && !item.isList) {
    relationItem.push(item)
    return
  }

  values.selectedItem = item
  if (item) {
    values.format = formats.value[0].id
  }
}

const formats = computed(() => {
  if (!values.selectedItem) return []
  if (values.selectedItem.type === "Int" || values.selectedItem.type === "Float") {
    return [
      { id: "string", title: "Строка" },
      { id: "decimal", title: "Число с разделителями" },
    ]
  }

  if (values.selectedItem.type === "DateTime") {
    return [
      { id: "dateTime", title: "Дата и время" },
      { id: "date", title: "Дата" },
      { id: "string", title: "Строка" },
    ]
  }

  if (values.selectedItem.isList) {
    return [
      { id: "string", title: "Строковое представление" },
      { id: "formula", title: "Значения элементов" },
      { id: "count", title: "Количество элементов" },
    ]
  }

  if (values.selectedItem.type === "Json") {
    return [
      { id: "string", title: "Строковое представление" },
      { id: "formula", title: "Выражение" }
    ]
  }

  return [
    { id: "string", title: "Строка" }
  ]
})

const close = () => {
  values.selectedItem = null
  relationItem.length = 0
  emit("update:open", false)
}

const apply = () => {
  if (values.format === 'formula') {
    // return setError("formula", { message: "Неверный формат выражения" })
  }
  const systemColumn = [ ...relationItem, values.selectedItem ].map(item => item.name).join(".")
  const name = values.name.trim() || values.selectedItem.name
  emit("addcolumn", { name, format: values.format, systemColumn, formula: values.formula, size: values.size })
  close()
}

const deleteColumn = () => {
  emit("deletecolumn")
  close()
}

const sizeItems = [
  { id: null as any, title: "Авто" },
  { id: "60px", title: "60px" },
  { id: "120px", title: "120px" },
  { id: "200px", title: "200px" },
  { id: "0.5fr", title: "0.5fr" },
  { id: "1fr", title: "1fr" },
  { id: "2fr", title: "2fr" },
]

</script>

<style lang="sass">
.add-column-popover
  width: 350px
  display: flex
  flex-direction: column
  gap: 12px
  padding: 12px

  .title
    font-size: 12px
    letter-spacing: 0.04em
    color: var(--text-secondary-color)
    margin-top: 8px

.add-column-popover__avilable-fields
  display: flex
  flex-direction: column
  border: 1px solid var(--input-border-color)
  border-radius: 8px
  overflow: hidden
  padding: 6px 0

  &>.v-button
    height: 36px
    background: none
    border: none
    color: var(--text-color)
    padding: 0 16px
    &:hover
      background-color: var(--hover-color)

    .arrow-icon
      margin-left: auto
      height: 16px
      color: var(--text-secondary-color)

  .back-button
    color: var(--text-secondary-color)
    svg
      margin-left: -6px

.add-column-popover__actions
  display: flex
  justify-content: flex-end
  gap: 8px

  .v-button
    height: 36px

  .delete-button
    margin-right: auto
  
</style>