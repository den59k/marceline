<template>
  <div v-if="props.item.children" class="form-row">
    <FormItem 
      v-for="child in props.item.children" 
      :model-value="modelValue"
      :item="child"
    />
  </div>
  <component 
    v-else
    :is="component" 
    v-model="model"
    :label="props.item.name" 
    :placeholder="props.item.placeholder" 
    v-bind="additionalProps"
  />
</template>

<script lang="ts" setup>
import { FormItem as FormItemType } from '../../api/formsApi';
import { computed, markRaw } from 'vue';
import { getItems } from '../../utils/getItems';

const props = defineProps<{ item: FormItemType, modelValue?: any }>()
const emit = defineEmits([ "update:modelValue" ])

const getInputType = (item: FormItemType) => {
  if (item.format === "password") return "password"
  if (item.format === "inputNumber") return "number"
  if (item.format === "")
  return undefined
}

const model = computed({
  get() {
    return props.modelValue[props.item.fieldId!]
  },
  set(newValue: string | number | null) {
    if (!props.modelValue || !props.item.fieldId) return
    props.modelValue[props.item.fieldId] = newValue
  }
})

const component = computed(() => {
  if (!props.item.format) return components["input"]
  return components[props.item.format] ?? null
})

const additionalProps = computed(() => {
  if (props.item.format === 'select') {
    if (props.item.relationType) {
      return {
        items: () => getItems(props.item.relationType!),
        nullable: true
      }
    }
    return { items: props.item.enum ?? [] }
  }
  if (props.item.format === 'multiselect') {
    if (props.item.relationType) {
      return {
        items: () => getItems(props.item.relationType!),
        multiple: true,
        search: true
      }
    }
  }
  if (props.item.format === 'file' || props.item.format === "files-group") {
    return {
      multiple: props.item.format === "files-group",
      accept: props.item.accept
    }
  }
  // if (props.item.format === 'file' && props.item.fileField) {
  //   const obj = props.modelValue[props.item.fileField!]
  //   return { 
  //     onLoadfile(file: File) { 
  //       props.modelValue[props.item.fileField!] = { 
  //         file: markRaw(file), 
  //         previewSrc: URL.createObjectURL(file), 
  //         fieldId: props.item.fieldId,
  //         progress: null
  //       }
  //     },
  //     onDeletefile() {
  //       delete props.modelValue[props.item.fileField!]
  //     },
  //     preview: obj?.previewSrc,
  //     progress: obj?.progress
  //   }
  // }
  if (props.item.format === 'subitems') {
    return {
      columns: props.item.columns
    }
  }
  if (props.item.format === "jsonList") {
    return {
      columns: props.item.columns
    }
  }
  if (props.item.format === 'geo') {
    return {
      initialLatLng: props.item.initialLatLng
    }
  }
  return { 
    multiline: props.item.format === 'multiline', 
    type: getInputType(props.item) 
  }
})

</script>

<script lang="ts">

const components: Record<string, any> = {}

export const addFormComponent = (name: string, component: any) => {
  components[name] = component
}

</script>

<style lang="sass">

</style>