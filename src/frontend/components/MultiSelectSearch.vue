<template>
  <VFormControl>
    <div v-if="$slots['end-adornment']" style="position: relative">
      <slot name="end-adornment"></slot>
    </div>
    <div v-if="modelValue.length > 0" class="multiselect__items" >
      <div v-for="item in modelValue" class="multiselect__item">
        <VIconButton v-if="props.hasOrder" icon="sort" class="multiselect__sort-btn" @mousedown="onMoveRow"/>
        <div class="multiselect__item-title">{{ mapItem(item).title }}</div>
        <VIconButton 
          v-if="props.subform" 
          icon="edit" 
          class="multiselect__subinfo-btn" 
          :class="{ active: item[props.subformField ?? '_sub'] }" 
          @click="editSubInfo(item)"
        />
        <VIconButton icon="close" class="multiselect__remove-btn" @click="deleteItem(item)"/>
      </div>
    </div>
    <VPopover v-model:open="popoverOpen" placement="bottom" fit-anchor :offset="8">
      <template #activator="{ props }">
        <VFormControl outline class="multiselect__activator" v-bind="props">
          <input v-model="searchValue" placeholder="Добавить элемент..." :class="{ popoverOpen }" />
          <VIcon icon="arrow-down" />
        </VFormControl>
      </template>
      <div class="v-select__menu with-scrollbar">
        <button v-for="item in showData" @click="addItem(item)">
          {{ item.title }}
        </button>
        <div v-if="!data" class="v-select__empty-label">Идет загрузка</div>
        <div v-else-if="showData.length === 0 && searchValue !== ''" class="v-select__empty-label">Ничего не найдено</div>
        <div v-else-if="showData.length === 0" class="v-select__empty-label">Нет доступных элементов</div>
      </div>
    </VPopover>
  </VFormControl>
</template>

<script lang="ts" setup>
import { computed, shallowRef, triggerRef, watch } from 'vue';
import VFormControl from './VFormControl.vue';
import VIcon from './VIcon.vue';
import VPopover from './VPopover.vue';
import { clamp, handleMove, makeRequest, useSearch } from 'vuesix';
import VIconButton from './VIconButton.vue';
import { mapItem } from '../utils/getItems'
import { formsApi } from '../api/formsApi';
import { useDialogStore } from '../stores/dialogStore';
import AddDataItemDialog from './dialogs/AddDataItemDialog.vue';

const props = defineProps<{ items: () => Promise<any>, hasOrder?: boolean, subform?: string, subformField?: string }>()
const modelValue = defineModel<any[]>({ default: [] })

const popoverOpen = shallowRef(false)
const searchValue = shallowRef("")

const data = shallowRef<any[]>([])

watch(popoverOpen, (popoverOpen) => {
  if (popoverOpen) {
    props.items().then((resp) => {
      data.value = resp
    })
  }
  if (!popoverOpen) {
    searchValue.value = ""
  }
})

const filteredData = useSearch(searchValue, data, item => item.title)

const modelValueSet = computed(() => new Set(modelValue.value?.map(i => i.id)))
const showData = computed(() => {
  const set = modelValueSet.value;
  if (set.size === 0) return filteredData.value
  return filteredData.value.filter((item) => !set.has(item.id))
})

const addItem = (item: any) => {
  modelValue.value.push(item)
  triggerRef(modelValue)
  popoverOpen.value = false
}

const deleteItem = (item: any) => {
  const index = modelValue.value.indexOf(item)
  if (index >= 0) {
    modelValue.value.splice(index, 1)
    triggerRef(modelValue)
  }
}

const onMoveRow = (e: MouseEvent) => {
  const item = (e.currentTarget as HTMLElement).parentElement!
  ;(window.document.activeElement as HTMLElement)?.blur()

  const children = Array.from(item.parentElement!.children) as HTMLElement[]
  const index = children.indexOf(item)
  const height = item.getBoundingClientRect().height

  handleMove(e, {
    onMove({ pos, startPos }) {
      item.classList.add("drag")

      const delta = clamp(pos.y - startPos.y, (-index) * height, (children.length - index - 1) * height);
      item.style.transform = `translateY(${delta}px)`

      let newIndex = clamp(Math.round(index + (pos.y - startPos.y) / height), 0, children.length);
      for (let i = 0; i < children.length; i++) {
        if (i === index) continue
        if (i > index && i <= newIndex) {
          children[i].style.transform = `translateY(-${height}px)`
        } else if (i < index && i >= newIndex) {
          children[i].style.transform = `translateY(${height}px)`
        } else {
          children[i].style.transform = ""
        }
      }
    },
    onEnd({ pos, startPos }) {
      let newIndex = clamp(Math.round(index + (pos.y - startPos.y) / height), 0, children.length);
      queueMicrotask(() =>  { 
        for (let i = 0; i < children.length; i++) {
          children[i].style.transform = ""
        }
        item.classList.remove("drag")
      })

      if (newIndex !== index) {
        const k = modelValue.value[index];
        modelValue.value.splice(index, 1);
        modelValue.value.splice(newIndex, 0, k);
        triggerRef(modelValue)
      }
    },
  })
}

const dialog = useDialogStore()
const editSubInfo = async (item: any) => {
  const form = await makeRequest(formsApi.getForm, props.subform!)
  dialog.open(AddDataItemDialog, { 
    form, 
    item: item[props.subformField ?? "_sub"],
    onComplete(values: any) {
      item[props.subformField ?? "_sub"] = values
    } 
  })
}

</script>

<style lang="sass">
.multiselect__items
  position: relative
  border: 1px solid var(--border-color)
  border-radius: 8px
  margin-bottom: 8px
  padding: 4px 0

  &.isEmpty
    border: none
    margin-bottom: 0
    padding: 0

.multiselect__item
  height: 40px
  flex-shrink: 0
  display: flex
  align-items: center
  border-bottom: 1px solid var(--border-color)
  padding-left: 16px
  box-sizing: border-box

  &:last-child
    border-color: transparent

  &.drag
    background-color: var(--background-color)
    border-color: transparent

.multiselect__item-title
  flex: 1 1 auto

.multiselect__activator>.v-form-control__outline
  height: 38px
  display: flex
  align-items: center
  color: var(--text-secondary-color)
  cursor: pointer

  &>svg
    margin-right: 8px
  
  &>input
    height: 100%
    background: none
    color: var(--text-color)
    border: none
    flex: 1 1 auto
    padding: 0 16px
    outline: none
    cursor: pointer

    &::placeholder
      color: var(--text-secondary-color)

    &.popoverOpen
      cursor: text

.multiselect__sort-btn
  color: var(--text-secondary-color)
  width: 36px
  height: 36px
  margin-left: -12px
  margin-right: 4px
  &>svg
    width: 20px
    height: 20px

.multiselect__remove-btn
  color: var(--error-color)
  opacity: 0.5
  width: 36px
  height: 36px
  margin-right: 2px
  &:hover
    opacity: 1

.multiselect__subinfo-btn
  color: var(--text-secondary-color)
  &.active
    color: var(--text-color)

</style>