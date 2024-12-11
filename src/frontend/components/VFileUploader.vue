<template>
  <VFormControl v-bind="pickProps(props)" class="v-image-uploader" @drop="onDrop">
    <VIconButton v-if="!props.multiple && files.length > 0" class="v-image-uploader__delete-button" icon="delete" @click="deleteFile" />
    <div class="v-form-control__outline v-image-uploader__drop-zone" :class="{ drag }" @dragover="onDragOver" @dragleave="onDragLeave">
      <template v-if="drag">
        <img :src="icon" height="28" alt="empty-file-icon" >
        <div class="text">
          Отпустите файл здесь
        </div>
      </template>
      <template v-else-if="!props.multiple && files.length > 0">
        <img :src="files[0].src" class="v-file-uploader__preview" :class="{ temp: typeof files[0].progress === 'number' }">
        <VSpinner v-if="(typeof files[0].progress === 'number')" :progress="files[0].progress" :radius="20" :width="4"/>
      </template>
      <template v-else>
        <slot :icon="icon" :openDialog="fileDialog.open">
          <img :src="icon" height="28" alt="empty-file-icon" >
          {{ props.placeholder ?? (props.multiple? "Перетащите файлы сюда": "Перетащите файл сюда") }}
          <VButton @click="fileDialog.open">{{props.multiple? "Загрузить файлы": "Загрузить файл"}}</VButton>
        </slot>
        </template>
      <slot name="end-adornment"></slot>
    </div>
    <div v-if="props.multiple" class="v-image-uploader__files-row">
      <div v-for="item in files" class="v-image-uploader__files-row-item" :class="{ temp: typeof item.progress === 'number' }"> 
        <img :src="item.src" alt="Image"/>
        <VIconButton icon="close" @click="deleteFileItem(item)"/>
      </div>
    </div>
  </VFormControl>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useFileDialog } from '@vueuse/core';
import lightIcon from '../assets/images/emptyFile.svg'
import darkIcon from '../assets/images/emptyFileDark.svg'
import VFormControl, { pickProps, VFormControlProps } from './VFormControl.vue';
import VIconButton from './VIconButton.vue';
import VButton from './VButton.vue';
import VSpinner from './VSpinner.vue';
import { utilsApi } from '../api/utils';

const props = defineProps<{ 
  modelValue?: FileEntry | FileEntry[],
  accept?: string, 
  placeholder?: string,
  multiple?: boolean
} & VFormControlProps>()
const emit = defineEmits([ "update:modelValue" ])

type FileEntry = { id?: string, src: string, progress?: number, error?: string }
const files = reactive<FileEntry[]>([])

const addFile = (file: File) => {
  const src = URL.createObjectURL(file)
  const obj = reactive<FileEntry>({ src, progress: 0 })
  files.push(obj) 

  utilsApi.uploadFile(file, {
    headers: { "x-file-name": file.name },
    onProgress(percent) { obj.progress = percent }
  })
  .then((_obj) => {
    obj.id = _obj.id 
    obj.progress = undefined
  })
  .catch(() => {
    obj.error = "An error ocurred"
  })
}

let skipUpdate = false
watch(() => props.modelValue, () => {
  if (!props.modelValue) return
  if (props.modelValue === files || props.modelValue === files[0]) return
  skipUpdate = true
  files.length = 0
  for (let item of Array.isArray(props.modelValue)? props.modelValue: [props.modelValue]) {
    files.push(item)
  }
}, { immediate: true })

watch(files, () => {
  if (skipUpdate) {
    skipUpdate = false
    return
  }
  if (props.multiple) {
    emit("update:modelValue", files)
  } else {
    emit("update:modelValue", files[0] ?? null)
  }
})

const drag = ref(false)
const onDragOver = (e: DragEvent) => {
  if (e.dataTransfer?.types?.[0]?.startsWith('text')) return
  e.preventDefault()
  drag.value = true
}

const onDragLeave = (e: DragEvent) => {
  drag.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  drag.value = false

  for (const item of (e as any).dataTransfer.items) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile() as File
    if (!file) continue

    addFile(file)
  }
}

const deleteFile = () => {
  emit("update:modelValue", null)
  files.length = 0
}

const deleteFileItem = (item: FileEntry) => {
  const index = files.indexOf(item)
  if (index < 0) return
  files.splice(index, 1)
}

const fileDialog = useFileDialog({
  accept: props.accept ?? 'image/*',
  multiple: false
})

fileDialog.onChange((files) => {
  if (!files || files.length === 0) return
  for (const file of files) {
    addFile(file)
  }
  fileDialog.reset()
})

const icon = computed(() => {
  return (document.querySelector("html")?.classList.contains("dark-theme"))? darkIcon: lightIcon
})

</script>

<style lang="sass">

button.v-image-uploader__delete-button
  width: 24px
  height: 24px
  border: none
  position: absolute
  right: -2px
  top: -4px

  svg
    width: 16px
    height: 16px

.v-image-uploader__drop-zone
  height: 140px
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  text-align: center

  font-size: 12px
  gap: 6px
  color: #A3A3A3

  .v-button
    font-weight: 400

  &.drag
    background-image: none
    box-shadow: 0 0 0px 1px var(--primary-color)

    &>*
      pointer-events: none

  .v-spinner
    position: absolute

.v-file-uploader__preview
  height: 100%

  &.temp
    opacity: 0.6

.v-image-uploader__files-row
  display: flex
  gap: 8px
  margin-top: 16px
  
.v-image-uploader__files-row-item
  width: 60px
  height: 60px
  position: relative
  img
    width: 100%
    height: 100%
    display: block
    object-fit: contain

  &.temp
    img
      opacity: 0.6
  
  .v-icon-button
    position: absolute
    top: -4px
    right: -4px
    background-color: var(--paper-color)
    width: 22px
    height: 22px

    svg 
      width: 16px
      height: 16px

    &:hover
      background-color: var(--primary-color)

</style>