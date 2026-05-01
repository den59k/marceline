<template>
  <div class="form-editor-condition">
    <div v-if="props.label" class="list-editor__title">{{ props.label }}</div>

    <div v-for="item in conditions" class="form-editor-condition__row">
      <VSelect v-model="item.field" :items="items" placeholder="Поле" style="flex-grow: 0.6;"/>
      =
      <VSelect v-if="item.field && getValues(item.field)" v-model="item.value" multiple :items="getValues(item.field)!" placeholder="Значение"/>
      <VCheckbox v-else-if="item.field && fieldsMap.get(item.field)?.type === 'Boolean'" v-model="item.value"/>
      <VInput v-else v-model="item.value"/>
    </div>

     <button class="list-editor__add-button" @click="addCondition()">
      <VIcon icon="add"/> Добавить условие
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, unref, watch } from 'vue';
import VSelect from '../VSelect.vue';
import { type Field } from './FormEditor.vue';
import { FormItem } from '../../api/formsApi';
import VIcon from '../VIcon.vue';
import VInput from '../VInput.vue';
import VCheckbox from '../VCheckbox.vue';

const props = defineProps<{ item: FormItem, label?: string, fieldsMap: Map<string, Field> }>()

const conditions = reactive<{ field: string | null, value: any }[]>([])
if (props.item.conditions) {
  for (let item of props.item.conditions) {
    const field = props.fieldsMap.get(item.field)
    if (field?.enum) {
      if (Array.isArray(item.value)) {
        conditions.push({ field: item.field, value: item.value.map(i => ({ id: i, value: i })) })
      } else {
        conditions.push({ field: item.field, value: [{ id: item.value, value: item.value }] })
      }
    } else {
      conditions.push({ field: item.field, value: item.value })
    }
  }
}

const items = computed(() => {
  const arr: { id: string, title: string }[] = []
  for (let [key, value] of props.fieldsMap) {
    arr.push({ id: key, title: key })
  }
  return arr
})

const getValues = (fieldId: string) => {
  const field = props.fieldsMap.get(fieldId)
  if (!field) return undefined
  if (!field.enum) {
    return undefined
  }
  return field.enum.map(i => ({ id: i, title: i }))
}

const addCondition = () => {
  conditions.push({ field: null, value: null })
}

watch(conditions, () => { 
  const arr = []
  for (let item of conditions) {
    if (!item.field || item.value === null || item.value === undefined || item.value === "") continue
    if (Array.isArray(item.value)) {
      const value = item.value.map(i => typeof i === "object"? i["id"]: i)
      if (value.length === 0) {
        continue
      }
      if (value.length === 1) {
        arr.push({ field: item.field, value: value[0] })
      } else {
        arr.push({ field: item.field, value })
      }
    } else {
      arr.push({ field: item.field, value: item.value })
    }
  }

  if (arr.length === 0) {
    props.item.conditions = null
  } else {
    props.item.conditions = arr
  }
}, { deep: true })

</script>

<style lang="sass">
.form-editor-condition
  display: flex
  flex-direction: column
  gap: 6px

.form-editor-condition__row
  display: flex
  gap: 6px
  align-items: center

  &>.v-form-control
    flex: 1 1 50px

  &>.v-checkbox
    flex: 1 1 50px

</style>