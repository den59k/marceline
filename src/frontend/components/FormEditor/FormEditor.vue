<template>
  <div class="form-editor__layout">
    <ul class="form-editor__available-fields">
      <li v-for="item in availableFields" class="form-editor__available-fields-item" @mousedown="onItemMouseDown($event, item)">
        {{ item.name }}
      </li>
      <li 
        class="form-editor__available-fields-item custom-item" 
        @mousedown="onItemMouseDown($event, customField)"
      >
        Кастомное поле
      </li>
    </ul>
    <div ref="workAreaRef" class="form-editor__work-area" @blockdrop="onBlockDrop" @click.self="activeFormItem = null">
      <FormEditorItem 
        v-for="(item, index) in state" 
        :item="item" :index="index" 
        :fieldsMap="fieldsMap"
        @delete-item="deleteItem" 
        @setActiveItem="setActiveItem"
      />
      <template v-if="dragMode && places.length > 0">
        <div 
          v-for="place in places" 
          :style="place.style" 
          class="form-editor__work-area-place" 
          :class="{ vertical: place.place === 'left' || place.place === 'right' }" 
          @blockdrop="onPlaceBlockDrop($event, place)"
        >
        </div>
      </template>
    </div>
    <FormEditorFieldProps :item="activeFormItem" :fieldsMap="fieldsMap" :bodyModifiers="bodyModifiers" :systemTable="props.systemTable"/>
  </div>
</template>

<script lang="ts" setup>
import { CSSProperties, Ref, computed, ref, watch } from 'vue';
import { useDraggableItem, useRequest } from 'vuesix';
import FormEditorItem from './FormEditorItem.vue';
import { useVModel } from '@vueuse/core';
import { FormItem } from '../../api/formsApi';
import { traverseFormFields } from '../../utils/traverse';
import FormEditorFieldProps, { getFormats } from './FormEditorFieldProps.vue';
import { utilsApi } from '../../api/utils';

const props = defineProps<{ modelValue?: FormItem[], fields: Field[], bodyModifiers?: string[], systemTable: string }>()
const emit = defineEmits([ "update:modelValue" ])

const fieldsMap = computed(() => {
  return new Map(props.fields.map(item => [ item.name, item ]))
})
const state = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] }) as Ref<FormItem[]>

const workAreaRef = ref<HTMLElement>()

const drag = useDraggableItem()
const dragMode = ref(false)
const onItemMouseDown = (e: MouseEvent, item: Field) => {
  drag(e, {
    onStart(item) {
      item.classList.add("drag")
      dragMode.value = true
    },
    onEnd(e) {
      e.target?.dispatchEvent(new BlockDropEvent(item))
      dragMode.value = false
    }
  })
}

const { data: tablesData } = useRequest(utilsApi.getModels)

const createFormItem = (item: Field): FormItem => {
  if (item.kind === "custom") {
    return { fieldId: "custom", name: "Кастомное поле", format: "input", isCustom: true }
  }
  // if (item.kind === "object" && item.type === "File") {
  //   return { fieldId: item.relationFromFields?.[0] ?? item.name, name: item.name, format: "file" }
  // }
  if (item.kind === "object" && !item.isList && item.relationFromFields) {
    return { fieldId: item.name,  name: item.name, format: "select", relationType: item.type, aliasFieldId: item.relationFromFields[0] }
  }
  if (item.kind === "object" && item.isList) {
    const relationTable = tablesData.value!.models.find(table => table.name === item.type)!
    const sourceField = relationTable.fields.find(_item => _item.relationName === item.relationName)

    if (relationTable.primaryKey) {
      const primaryKeyFields = relationTable.primaryKey.fields.map(fieldId => relationTable.fields.find(item => item.name === fieldId)!)
      const oppositeFieldId = primaryKeyFields.find(item => !sourceField!.relationFromFields?.includes(item.name))!
      const oppositeField = relationTable.fields.find(item => item.relationFromFields?.includes(oppositeFieldId.name))!

      return { fieldId: item.name, name: item.name, format: "multiselect", relationBridgeFieldId: oppositeField.name, 
        relationType: oppositeField.type, relationBridgeType: item.type }
    } else {
      return { fieldId: item.name, name: item.name, format: "multiselect", relationType: item.type, relationBridgeFieldId: sourceField?.name }
    }
  }
  if (item.kind === "enum") {
    return { fieldId: item.name, name: item.name, format: item.isList? "listSelect": "select", enum: item.enum?.map(item => ({ id: item, title: item })) }
  }
  return  { fieldId: item.name, name: item.name, format: getFormats(item)[0].id }
}

const onBlockDrop = (e: BlockDropEvent) => {
  state.value.push(createFormItem(e.item))
}

const deleteItem = (item: FormItem, parent?: FormItem) => {
  const index = (parent?.children ?? state.value).indexOf(item)
  if (index >= 0) {
    (parent?.children ?? state.value).splice(index, 1)
  }
  if (parent?.children && parent.children.length === 0) {
    deleteItem(parent)
  }
  if (item === activeFormItem.value) {
    activeFormItem.value = null
  }
}

const activeFormItem = ref<FormItem | null>(null)
const setActiveItem = (item: FormItem) => {
  activeFormItem.value = item
}

const customField: Field = { name: 'custom', type: 'custom', kind: 'custom' }


type Place = { fieldIndex: number, style: CSSProperties, place: "left" | "right" | "top" | "bottom" }
const places = ref<Place[]>([])
watch(dragMode, () => {
  if (!dragMode.value) return
  const fields = workAreaRef.value!.querySelectorAll("[data-field-id]")
  places.value = []
  for (let item of fields) {
    const rect = item.getBoundingClientRect()
    const s = (val: number) => `${val}px`
    const halfWidth = 20
    const offset = 4
    const fieldIndex = parseInt(item.getAttribute("data-field-id")!)
    places.value.push({ 
      fieldIndex, 
      style: { top: s(rect.top-halfWidth-offset), left: s(rect.left), width: s(rect.width) },
      place: "top"
    })
    places.value.push({ 
      fieldIndex, 
      style: { top: s(rect.bottom-halfWidth+offset), left: s(rect.left), width: s(rect.width) },
      place: "bottom"
    })
    places.value.push({ 
      fieldIndex, 
      style: { top: s(rect.top), left: s(rect.left-halfWidth-offset), height: s(rect.height) }, 
      place: "left"
    })
    places.value.push({ 
      fieldIndex, 
      style: { top: s(rect.top), left: s(rect.right-halfWidth+offset), height: s(rect.height) }, 
      place: "right"
    })
  }
}, { deep: true, flush: "post" })

const onPlaceBlockDrop = (e: BlockDropEvent, place: Place) => {
  const formItem: FormItem = createFormItem(e.item)
  if (place.place === 'top') {
    state.value.splice(place.fieldIndex, 0, formItem)
  } else if (place.place === 'bottom') {
    state.value.splice(place.fieldIndex+1, 0, formItem)
  } else {
    let arr = state.value[place.fieldIndex]?.children
    if (!arr) {
      arr = [ state.value[place.fieldIndex] ]
      state.value.splice(place.fieldIndex, 1, { children: arr })
    }
    if (place.place === 'left') {
      arr.unshift(formItem)
    } else {
      arr.push(formItem)
    }
  } 
}

const availableFields = computed(() => {
  return props.fields.filter(item => !usedKeys.value.includes(item.name))
})

const usedKeys = computed(() => {
  const keys: string[] = []
  traverseFormFields(state.value, (formItem: FormItem) => {
    if (!formItem.fieldId) return
    keys.push(formItem.fieldId)
    if (formItem.fileIdField) {
      keys.push(formItem.fileIdField)
    }
  })
  return keys
})

</script>

<script lang="ts">

export type Field = {
  name: string,
  type: string,
  kind: string,
  isList?: boolean,
  enum?: string[],
  relationName?: string,
  relationFromFields?: string[]
}

export class BlockDropEvent extends Event {
  item: Field
  constructor(item: Field) {
    super("blockdrop")
    this.item = item
  }
}

</script>

<style lang="sass">
.form-editor__layout
  display: flex
  user-select: none

.form-editor__available-fields
  display: flex
  flex-direction: column
  width: 250px
  border-right: 1px solid var(--border-color)
  padding: 20px 
  gap: 12px
  padding-left: 24px
  box-sizing: border-box
  flex-shrink: 0
  margin: 0

.form-editor__available-fields-item
  height: 36px
  display: flex
  align-items: center
  padding: 0 16px
  font-size: 13px
  border: 1px solid var(--input-border-color)
  border-radius: 8px
  cursor: pointer

  &:hover, &.drag
    background: var(--paper-color)
    border-color: var(--primary-color)
  &.drag
    z-index: 100

.form-editor__work-area
  flex: 1 1 auto
  padding: 16px 20px
  display: flex
  flex-direction: column
  gap: 12px

  .v-image-uploader__delete-button
    margin-right: 24px

.form-editor__delete-icon
  position: absolute
  right: 0
  top: -24px
  width: 22px
  height: 22px
  color: var(--error-color)
  tab-index: -1
  svg
    width: 16px
    height: 16px

.form-editor__work-area-place
  position: absolute
  width: 40px
  height: 40px
  box-sizing: border-box
  padding: 19px 0
  z-index: 10

  &.vertical
    padding: 0 19px

  &::after
    content: ""
    width: 100%
    height: 100%
    background-color: var(--primary-color)
    // display: none
  
  &:hover
    &::after
      display: block

</style>