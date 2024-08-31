<template>
  <VPopover :open="open" @update:open="emit('update:open', $event)" placement="bottom-end" class="add-column-popover">
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
    <VSelect v-if="values.selectedItem" v-bind="register('format')" :items="formats" label="Формат отображения"  />
    <div class="add-column-popover__actions">
      <VButton outline @click="close">Отмена</VButton>
      <VButton v-if="values.selectedItem" @click="apply">Добавить</VButton>
    </div>
  </VPopover>
</template>

<script lang="ts" setup>
import { useForm, useRequest } from 'vuesix';
import VPopover from './VPopover.vue';
import { utilsApi } from '../api/utils';
import VInput from './VInput.vue';
import VButton from './VButton.vue';
import { computed, reactive } from 'vue';
import VFormControl from './VFormControl.vue';
import VIcon from './VIcon.vue';
import VSelect from './VSelect.vue';

const { register, values } = useForm({
  name: "",
  selectedItem: null as any,
  format: null as string | null
})

const props = defineProps<{ open?: boolean, table: string }>()
const emit = defineEmits([ "update:open", "addcolumn" ])

const { data } = useRequest(utilsApi.getModels)

const relationItem = reactive<any[]>([])

const fields = computed(() => {
  if (!data.value) return []

  const tableName = relationItem.length > 0? relationItem[relationItem.length-1].type: props.table
  
  const table = data.value.models.find(item => item.name === tableName)
  return table?.fields ?? []
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
      { id: "string", title: "Значения элементов" },
      { id: "count", title: "Количество элементов" },
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
  const systemColumn = [ ...relationItem, values.selectedItem ].map(item => item.name).join(".")
  const name = values.name.trim() || values.selectedItem.name
  emit("addcolumn", { name, format: values.format, systemColumn })
  close()
}

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
  
</style>