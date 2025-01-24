<template>
  <VFormControl v-bind="pickProps(props)" outline class="v-select" >
    <VPopover v-model:open="opened" placement="bottom" fit-anchor :offset="8">
      <template #activator="{ props: activatorProps }">
        <div class="v-select__activator" :class="{ opened }" v-bind="activatorProps" role="button">
          <div v-if="props.multiple && selected.size > 0" class="v-select__multiple-items">
            <div v-for="item in selected.values()" >
              {{ item.title }}
            </div>
          </div>
          <div v-else-if="currentItem">{{ currentItem.title }}</div>
          <div v-else class="v-select__placeholder">{{ props.placeholder ?? 'Выберите значение' }}</div>
          <div class="flex-spacer"></div>
          <VIconButton 
            v-if="(props.nullable && model) || (props.multiple && selected.size > 0)" 
            icon="close" class="v-select__clear-button" 
            @mousedown.stop
            @click.stop="resetValue"
          />
          <VIcon icon="arrow-down" />
        </div>
      </template>
      <div class="v-select__menu with-scrollbar" @mousedown.stop >
        <button 
          v-for="item in items" 
          :key="item.id" 
          :class="{ selected: props.multiple && selected.has(item.id) }" 
          @click="onItemClick(item)" 
        >
          <slot name="item" :item="item">
            {{ item.title }}
          </slot>
        </button>
        <div v-if="items.length === 0" class="v-select__empty-label">Нет доступных элементов</div>
      </div>
    </VPopover>
    <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import { Ref, computed, reactive, ref, shallowRef, watch } from 'vue';
import VFormControl, { VFormControlProps, pickProps } from './VFormControl.vue';
import { useVModel } from '@vueuse/core';
import VIcon from './VIcon.vue';
import VPopover from './VPopover.vue';
import VIconButton from './VIconButton.vue';

type Item = { id: string | number, title: string }

const props = defineProps<{ 
  items: Item[] | (() => Promise<Item[]>), 
  modelValue?: string | number | null | Array<Item>, 
  placeholder?: string,
  nullable?: boolean,
  multiple?: boolean
} & VFormControlProps>()

const emit = defineEmits([ "update:modelValue" ])

const model = useVModel(props, "modelValue", emit, { passive: true, defaultValue: null }) as Ref<string | number | null | Array<Item>>
const selected = reactive(new Map())

const currentItem = computed(() => {
  if (model.value === null) return null
  return items.value.find(item => item.id === model.value) ?? null
})

const cachedItems = shallowRef<Item[]>([])
const pending = shallowRef(typeof props.items === "function")

const items = computed(() => {
  if (typeof props.items === "function") return cachedItems.value
  return props.items
})

const opened = ref(false)

let requestSended = false
watch([opened, model], async () => {
  if (requestSended) return
  if (typeof props.items === "function" && (opened.value || !!model.value)) {
    cachedItems.value = await props.items()
    pending.value = false
    requestSended = true
  }
}, { immediate: true })

let preventUpdateModelValue = false
watch(selected, () => {
  if (preventUpdateModelValue) { 
    preventUpdateModelValue = false 
    return 
  }
  emit("update:modelValue", Array.from(selected.values())) 
})
watch(items, () => {
  if (props.multiple && props.modelValue && Array.isArray(props.modelValue)) {
    if (items.value.length > 0) {
      const set = new Set(props.modelValue.map(item => item.id))
      for (let item of items.value) {
        if (!set.has(item.id)) continue
        selected.set(item.id, item)
        preventUpdateModelValue = true
      }
    } else {
      for (let item of props.modelValue) {
        selected.set(item.id, item)
        preventUpdateModelValue = true
      }
    }
  }
}, { immediate: true })


const onItemClick = (item: Item) => {
  if (props.multiple) {
    if (selected.has(item.id)) {
      selected.delete(item.id)
    } else {
      selected.set(item.id, item)
    }
  } else {
    model.value = item.id
    opened.value = false
  }
}

const resetValue = () => { 
  if (props.multiple) {
    selected.clear()
  } else {
    model.value = null
  }
  opened.value = false
}

</script>

<style lang="sass">
.v-select
  .v-form-control__outline
    height: 38px

.v-select__placeholder
  color: var(--text-secondary-color)

.v-select__activator
  background: none
  border: none
  display: flex
  align-items: center
  padding: 0 16px
  width: 100%
  color: var(--text-color)
  text-align: left
  outline: none
  cursor: pointer
  &>div
    flex: 1 1 auto

  &>svg
    margin-right: -6px
    color: var(--text-secondary-color)

  &.opened
    &>svg
      transform: rotate(180deg)
  
  .flex-spacer
    flex: 1 1 auto

.v-select__menu
  display: flex
  flex-direction: column
  padding: 6px 0
  max-height: 400px

  &>button
    background: none
    border: none
    color: var(--text-color)
    height: 40px
    display: flex
    align-items: center
    padding: 0 16px
    flex-shrink: 0
    text-align: left

    &:hover
      background-color: var(--hover-color)

    &.selected
      font-weight: 500
      background-color: var(--selected-color)
      
      &:hover
        background-color: var(--selected-hover-color)

.v-select__clear-button
  width: 28px
  height: 28px
  color: var(--text-secondary-color)
  margin-right: 2px

.v-select__multiple-items
  display: flex
  align-items: center
  gap: 6px
  overflow: hidden
  flex-shrink: 1
  position: absolute
  left: 12px
  right: 60px
  height: 100%

  &>div
    background-color: var(--input-border-color)
    padding: 0 8px
    line-height: 20px
    border-radius: 4px

.v-select__empty-label
  padding: 0 16px
  height: 36px
  display: flex
  align-items: center
  color: var(--text-secondary-color)
  font-size: 13px
  
</style>
