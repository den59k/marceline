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
import { computed } from 'vue';
import { getItems } from '../../utils/getItems';

const props = defineProps<{ item: FormItemType, modelValue?: any }>()
const emit = defineEmits([ "update:modelValue" ])

const getInputType = (item: FormItemType) => {
  if (item.format === "password") return "password"
  if (item.format === "inputNumber") return "number"
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
  const component = components[props.item.format]
  if (component === null) return null
  return component ?? components["input"]
})

const additionalProps = computed(() => {
  if (props.item.format === 'select' || props.item.format === 'listSelect') {
    if (props.item.relationType) {
      return {
        items: () => getItems(props.item.relationType!),
        nullable: true,
        multiple: props.item.format === 'listSelect',
        search: true,
        returnId: true
      }
    }
    return { 
      items: props.item.enum ?? [], 
      returnId: true,
      multiple: props.item.format === 'listSelect'
    }
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
  if (props.item.format === "inputArrayNumber") {
    return {
      format: "number"
    }
  }
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
  if (props.item.format === 'geo' || props.item.format === 'geoRoute') {
    return {
      initialLatLng: props.item.initialLatLng,
      type: props.item.format
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

export const getFormComponent = (name: string) =>{ 
  return components[name]
}

</script>

<style lang="sass">

</style>