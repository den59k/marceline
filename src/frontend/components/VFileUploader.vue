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
        <img 
          v-if="isImage"
           :src="files[0].src" 
           class="v-file-uploader__preview" 
           :class="{ temp: typeof files[0].progress === 'number' }"
        />
        <div v-else class="v-image-uploader__file-preview">
          <VIcon icon="file" />
          {{ files[0].name }}
        </div>
        <VSpinner v-if="(typeof files[0].progress === 'number')" :progress="files[0].progress" :radius="20" :width="4"/>
      </template>
      <template v-else>
        <slot :icon="icon" >
          <img :src="icon" height="28" alt="empty-file-icon" >
          {{ props.placeholder ?? (props.multiple? "Перетащите файлы сюда": `Перетащите ${isImage? 'изображение': 'файл'} сюда`) }}
          <VButton @click="fileDialog.open({ accept: props.accept, multiple: props.multiple })">
            {{props.multiple? "Загрузить файлы": `Загрузить ${isImage? 'изображение': 'файл'}`}}
          </VButton>
        </slot>
      </template>
      <slot name="end-adornment"></slot>
    </div>
    <VFileUploaderRow v-if="props.multiple && modelValue" :files="files" />
  </VFormControl>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { useFileDialog } from '@vueuse/core';
import lightIcon from '../assets/images/emptyFile.svg'
import darkIcon from '../assets/images/emptyFileDark.svg'
import VFormControl, { pickProps, VFormControlProps } from './VFormControl.vue';
import VIconButton from './VIconButton.vue';
import VButton from './VButton.vue';
import VSpinner from './VSpinner.vue';
import { utilsApi } from '../api/utils';
import VIcon from './VIcon.vue';
import VFileUploaderRow from './VFileUploaderRow.vue';

const props = defineProps<{ 
  modelValue?: FileEntry | FileEntry[],
  accept?: string, 
  placeholder?: string,
  multiple?: boolean
} & VFormControlProps>()
const emit = defineEmits([ "update:modelValue" ])

const isImage = computed(() => !props.accept || props.accept.startsWith('image'))

export type FileEntry = { id?: string, src: string, name?: string, type?: string, progress?: number, error?: string }
const files = reactive<FileEntry[]>([])

const filesMap = new WeakMap<FileEntry, File>()
const uploadFile = async (fileEntry: FileEntry, file: File) => {
  await utilsApi.uploadFile(file, {
    headers: { 
      "x-file-name": encodeURIComponent(file.name),
      "x-file-type": encodeURIComponent(file.type),
    },
    onProgress(percent) { fileEntry.progress = percent }
  })
  .then((_obj) => {
    fileEntry.id = _obj.id 
    fileEntry.src = _obj.src
    fileEntry.type = _obj.type
    fileEntry.progress = undefined
  })
  .catch(() => {
    fileEntry.error = "An error ocurred"
  })
}

const uploadAllFiles = async () => {
  for (let fileEntry of files) {
    const file = filesMap.get(fileEntry)
    if (!file) continue
    await uploadFile(fileEntry, file!)
    filesMap.delete(fileEntry)
  }
}

const uploader = inject("uploader", null) as any
if (uploader) {
  uploader.add(uploadAllFiles)
}

const addFile = (file: File) => {
  const src = URL.createObjectURL(file)
  const fileEntry = reactive<FileEntry>({ src, name: file.name })
  files.push(fileEntry) 
  if (uploader) {
    filesMap.set(fileEntry, file)
  } else {
    uploadFile(fileEntry, file)
  }
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
onMounted(() => {
  skipUpdate = false
})

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
  z-index: 4

  svg
    width: 16px
    height: 16px

.v-image-uploader.no-label .v-image-uploader__delete-button
  top: 2px
  right: 2px

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


.v-image-uploader__file-preview
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  gap: 6px
  
</style>