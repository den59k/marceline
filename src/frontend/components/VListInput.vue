<template>
  <VFormControl>
    <div class="v-list-input">
      <slot name="start-adornment"></slot>
      <slot name="end-adornment"></slot>
      <div v-for="(item, index) in vModel" class="v-list-input__item">
        <VInput v-model="vModel![index]" :placeholder="placeholder"/>
        <VIconButton icon="close" @click="deleteItem(item)"/>
      </div>
      <VButton @click="addItem">Добавить элемент</VButton>
    </div>
  </VFormControl>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import VButton from './VButton.vue';
import VFormControl from './VFormControl.vue';
import VInput from './VInput.vue';
import VIconButton from './VIconButton.vue';

const props = defineProps<{ modelValue?: string[], placeholder?: string }>()
const emit = defineEmits([ "update:modelValue" ])

const vModel = useVModel(props, "modelValue", emit, { passive: true, defaultValue: [] })
if (!props.modelValue) {
  emit("update:modelValue", vModel.value ?? [])
}
const addItem = () => {
  vModel.value?.push("")
}

const deleteItem = (item: string) => {
  const index = vModel.value!.indexOf(item)
  if (index < 0) return
  vModel.value!.splice(index, 1)
}

</script>

<style lang="sass">
.v-list-input
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  margin-top: 4px

  .v-button
    align-self: flex-start

.v-list-input__item
  display: flex
  gap: 8px
  align-items: center

  .v-input
    flex: 1 1 auto

  .v-icon-button
    color: var(--error-color)
    width: 32px
    height: 32px

</style>