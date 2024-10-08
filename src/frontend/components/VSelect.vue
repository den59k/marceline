<template>
  <VFormControl v-bind="pickProps(props)" outline class="v-select" >
    <VPopover v-model:open="opened" placement="bottom" fit-anchor :offset="8">
      <template #activator="{ props: activatorProps }">
        <button class="v-select__activator" :class="{ opened }" v-bind="activatorProps">
          <div v-if="currentItem">{{ currentItem.title }}</div>
          <div v-else class="v-select__placeholder">{{ props.placeholder ?? 'Выберите значение' }}</div>
          <VIconButton v-if="props.nullable && model" icon="close" class="v-select__clear-button" @mousedown.stop @click.stop="resetValue"/>
          <VIcon icon="arrow-down" />
        </button>
      </template>
      <div class="v-select__menu" @mousedown.stop >
        <button v-for="item in items" :key="item.id" @click="onItemClick(item)" >
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
import { Ref, computed, onMounted, ref, shallowRef, watch } from 'vue';
import VFormControl, { VFormControlProps, pickProps } from './VFormControl.vue';
import { useVModel } from '@vueuse/core';
import VIcon from './VIcon.vue';
import VPopover from './VPopover.vue';
import VIconButton from './VIconButton.vue';

type Item = { id: string | number, title: string }

const props = defineProps<{ 
  items: Item[] | (() => Promise<Item[]>), 
  modelValue?: string | number | null, 
  placeholder?: string,
  nullable?: boolean
} & VFormControlProps>()

const emit = defineEmits([ "update:modelValue" ])

const model = useVModel(props, "modelValue", emit, { passive: true, defaultValue: null }) as Ref<string | number | null>

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

const onItemClick = (item: Item) => {
  model.value = item.id
  opened.value = false
}

const resetValue = () => { 
  model.value = null
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
  &>div
    flex: 1 1 auto

  &>svg
    margin-right: -6px
    color: var(--text-secondary-color)

  &.opened
    &>svg
      transform: rotate(180deg)

.v-select__menu
  display: flex
  flex-direction: column
  padding: 6px 0

  &>button
    background: none
    border: none
    color: var(--text-color)
    height: 40px
    display: flex
    align-items: center
    padding: 0 16px

    &:hover
      background-color: var(--hover-color)

.v-select__clear-button
  width: 28px
  height: 28px
  color: var(--text-secondary-color)
  margin-right: 2px


.v-select__empty-label
  padding: 0 16px
  height: 36px
  display: flex
  align-items: center
  color: var(--text-secondary-color)
  
</style>
