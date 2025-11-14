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
import VInput from '../VInput.vue'
import { getItems } from '../../utils/getItems';
import VFormEditorConst from './VFormEditorConst.vue';
import { getFormComponent } from '../Form/FormItem.vue';

const props = defineProps<{ item: FormItem, index?: number, fieldsMap: Map<string, Field> }>()

const emit = defineEmits([ "deleteItem", "setActiveItem" ])

const getInputType = (item: FormItem) => {
  if (item.format === "password") return "password"
  if (item.format === "")
  return undefined
}

const component = computed(() => {
  if (!props.item.format) return VInput
  if (props.item.format === 'const') return VFormEditorConst
  return getFormComponent(props.item.format) ?? VInput
})

const additionalProps = computed(() => {
  if (props.item.format === 'select' || props.item.format === 'listSelect') {
    if (props.item.relationType) {
      return {
        items: () => getItems(props.item.relationType!),
        nullable: true,
        search: props.item.format === 'listSelect',
        multiple: true,
      }
    }
    return { 
      items: props.item.enum ?? [],
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
  if (props.item.format === 'const') {
    return {
      value: props.item.value
    }
  }
  if (props.item.format === 'file' || props.item.format === "files-group") {
    return {
      multiple: props.item.format === "files-group",
      accept: props.item.accept
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

<style lang="sass">

</style>