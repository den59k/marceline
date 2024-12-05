<template>
  <div v-if="props.item.children" :data-field-id="index" class="form-row">
    <FormEditorItem 
      v-for="child in props.item.children" 
      :item="child"
      :fieldsMap="fieldsMap"
      @delete-item="emit('deleteItem', $event, props.item)"
      @setActiveItem="emit('setActiveItem', $event)"
    />
  </div>
  <component :is="component" 
    v-else
    v-bind="additionalProps"
    :label="props.item.name" 
    :data-field-id="index" 
    :placeholder="props.item.placeholder" 
    @click="emit('setActiveItem', props.item)"
  >
    <template #end-adornment>
      <VIconButton 
        icon="delete" 
        class="form-editor__delete-icon" 
        title="Удалить поле" 
        @click.stop="emit('deleteItem', props.item)"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Field } from './FormEditor.vue';
import { FormItem } from '../../api/formsApi';
import VIconButton from '../VIconButton.vue';
import VSelect from '../VSelect.vue'
import VInput from '../VInput.vue'
import { getItems } from '../../utils/getItems';
import VFileUploader from '../VFileUploader.vue';
import VFormEditorCheckbox from './VFormEditorCheckbox.vue'
import VFormEditorConst from './VFormEditorConst.vue';
import VFormEditorSubitems from '../VFormEditorSubitems.vue';
import VGeoPicker from '../VGeoPicker.vue';
import VListInput from '../VListInput.vue';
import VInputJson from '../VInputJson.vue';
import VJsonListEditor from '../VJsonListEditor.vue';

const props = defineProps<{ item: FormItem, index?: number, fieldsMap: Map<string, Field> }>()

const emit = defineEmits([ "deleteItem", "setActiveItem" ])

const getInputType = (item: FormItem) => {
  if (item.format === "password") return "password"
  if (item.format === "")
  return undefined
}

const component = computed(() => {
  if (props.item.format === 'const') return VFormEditorConst
  if (props.item.format === 'select' || props.item.format === 'multiselect') return VSelect
  if (props.item.format === "file" || props.item.format === "files-group") return VFileUploader
  if (props.item.format === "checkbox") return VFormEditorCheckbox
  if (props.item.format === "subitems") return VFormEditorSubitems
  if (props.item.format === "geo") return VGeoPicker
  if (props.item.format === "listInput") return VListInput
  if (props.item.format === "jsonInput") return VInputJson
  if (props.item.format === "jsonList") return VFormEditorSubitems
  return VInput
})

const additionalProps = computed(() => {
  if (props.item.format === 'select') {
    if (props.item.relationType) {
      return {
        items: () => getItems(props.item.relationType!),
        nullable: true,
        search: true
      }
    }
    return { 
      items: props.item.enum ?? [] 
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
  if (props.item.format === 'const') {
    return {
      value: props.item.value
    }
  }
  if (props.item.format === 'file' || props.item.format === "files-group") {
    return {
      multiple: props.item.format === "files-group"
    }
  }
  if (props.item.format === 'checkbox') {
    return {
      class: "form-editor-item__checkbox"
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

<style lang="sass">

</style>