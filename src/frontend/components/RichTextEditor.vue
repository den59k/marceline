<template>
  <div class="rich-text-editor__dialog">
    <div class="rich-text-editor__controls">
      <VSelect v-model="blockType" :items="blockTypes" style="width: 200px"/>
      <div class="rich-text-editor__actions-group">
        <button v-for="item in styles" :class="{ active: item.active }" @click="item.onClick">
          <VIcon :icon="item.icon" />
        </button>
      </div>
      <div class="rich-text-editor__actions-group">
        <button title="Вставить изображение" @click="insertImage"><VIcon icon="image-solid"/></button>
        <button title="Вставить галерею" @click="insertGallery"><VIcon icon="gallery"/></button>
        <button title="Вставить файл" @click="insertFile"><VIcon icon="file"/></button>
        <button title="Вставить элемент кода" @click="insertCodeBlock"><VIcon icon="code"/></button>
      </div>
    </div>
    <TextEditor ref="textEditorRef" v-model="model" class="text-editor" :renderer="defaultRenderer" :decorator="defaultDecorator" @keydown="onKeyDown">
      <template #code="{ props, block }">
        <RichTextEditorCode v-model="block.text" v-bind="props" @newblock="textEditorRef?.addNewLine()" @remove="textEditorRef?.removeCurrentBlock()"/>
      </template>
      <template #image="{ props, block }">
        <VFileUploader 
          v-model="block.image" 
          v-bind="props" 
          accept="image/*"
          :class="{ selected: textEditorRef?.selection.focus.blockId === block.id }" 
          contenteditable="false"
          @keydown="onKeyDown"
        />
      </template>
      <template #file="{ props, block }">
        <VFileUploader 
          v-model="block.image" 
          v-bind="props" 
          accept="*"
          :class="{ selected: textEditorRef?.selection.focus.blockId === block.id }" 
          contenteditable="false"
          @keydown="onKeyDown"
        />
      </template>
      <template #gallery="{ props, block }">
        <VFileUploader 
          v-model="block.image" 
          v-bind="props" 
          accept="image/*"
          multiple
          :class="{ selected: textEditorRef?.selection.focus.blockId === block.id }" 
          contenteditable="false"
          @keydown="onKeyDown"
        />
      </template>
      <template #placeholder>
        <div class="rich-text-editor__placeholder" :contenteditable="false">Введите текст...</div>
      </template>
    </TextEditor>
    <VPopover v-model:open="makeLinkPopover.open" placement="bottom-start" :anchor-position="makeLinkPopover.position">
      <RichTextMakeLinkPopover @apply="setLink($event)" @close="makeLinkPopover.open = false"/>
    </VPopover>
  </div>
</template>

<script lang="ts" setup>
import { TextEditor, TextEditorRef } from 'vuewrite';
import VSelect from './VSelect.vue';
import { computed, ref, shallowRef } from 'vue';
import { defaultDecorator, defaultRenderer } from '../utils/richTextComponents';
import RichTextEditorCode from './RichTextEditorCode.vue';
import RichTextMakeLinkPopover from './RichTextMakeLinkPopover.vue';
import VIcon from './VIcon.vue';
import VFileUploader from './VFileUploader.vue';
import VPopover from './VPopover.vue';

const props = defineProps<{ label?: string }>()
const model = defineModel<any[]>()
if (!model.value || model.value.length === 0) {
  model.value = [{ text: "" }]
}

const blockTypes = [
  { id: "default", title: "Обычный текст" },
  { id: "h1", title: "Заголовок 1" },
  { id: "h2", title: "Заголовок 2" },
  { id: "h3", title: "Заголовок 3" },
  { id: "li", title: "Список" },
  { id: "callout", title: "Callout" },
  { id: "code", title: "Элемент кода" }
]
const textEditorRef = shallowRef<TextEditorRef>()

const blockType = computed({
  get() {
    return textEditorRef.value?.currentBlock?.type ?? "default"
  },
  set(type) {
    if (!textEditorRef.value?.currentBlock) return
    if (type === "default") {
      delete textEditorRef.value.currentBlock.type
    } else {
      textEditorRef.value.currentBlock.type = type ?? undefined
    }
    if (type === "code") {
      textEditorRef.value.currentBlock.editable = false
    } else {
      delete textEditorRef.value.currentBlock.editable
    }
  }
})

const styles = computed(() => {
  const textEditor = textEditorRef.value
  if (!textEditor) return []
  const currentStyles = textEditor.currentStyles
  return [
    { icon: "bold", active: currentStyles.has("bold"), onClick: () => textEditor.toggleStyle("bold") },
    { icon: "italic", active: currentStyles.has("italic"), onClick: () => textEditor.toggleStyle("italic") },
    { icon: "underline", active: currentStyles.has("underline"), onClick: () => textEditor.toggleStyle("underline") },
    { icon: "strikethrough", active: currentStyles.has("strikethrough"), onClick: () => textEditor.toggleStyle("strikethrough") }
  ]
})

const makeLinkPopover = ref({
  open: false,
  position: { x: 0, y: 0 },
  selection: {} as any
})

const onKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
    if (e.code === "KeyB") {
      textEditorRef.value?.toggleStyle("bold")
    }
    if (e.code === "KeyI") {
      textEditorRef.value?.toggleStyle("italic")
    }
    if (e.code === "KeyU") {
      textEditorRef.value?.toggleStyle("underline")
    }
    if (e.code === "KeyK" && textEditorRef.value && !textEditorRef.value.isCollapsed) {
      e.preventDefault()
      const rect = textEditorRef.value.getClientRects(textEditorRef.value.selection)?.[0]
      if (rect) {
        makeLinkPopover.value = {
          open: true,
          position: { x: rect.left, y: rect.bottom },
          selection: textEditorRef.value.selection
        }
      }
    }
  }
  // if (e.key === "Enter" && popoverOpen.value && activeItem.value) {
  //   e.preventDefault()
  //   activeItem.value.onClick()
  //   return
  // }
  if (e.key === "Enter" && !e.shiftKey && textEditorRef.value?.currentBlock?.type === "li") {
    e.preventDefault()
    textEditorRef.value.addNewLine()
    textEditorRef.value!.currentBlock.type = "li"
    textEditorRef.value.pushHistory("setText")
  }
  if (textEditorRef.value?.currentBlock?.editable === false && textEditorRef.value.currentBlock.type !== 'code' && (e.code === "Backspace" || e.code === "Delete")) {
    textEditorRef.value.removeCurrentBlock()
    e.preventDefault()
  }
  // if ((e.key === "ArrowUp" || e.key === "ArrowDown") && popoverOpen.value && visibleBlocks.value.length > 0) {
  //   e.preventDefault()
  //   const index = visibleBlocks.value.indexOf(activeItem.value!)
  //   let newIndex = index + (e.key === "ArrowUp"? -1: 1)
  //   if (newIndex < 0) newIndex = visibleBlocks.value.length-1
  //   if (newIndex >= visibleBlocks.value.length) newIndex = 0
  //   activeItem.value = visibleBlocks.value[newIndex]
  // }
}

const insertCodeBlock = () => {
  textEditorRef.value?.insertBlock({ type: "code", editable: false, text: "" })
}

const insertImage = () => {
  textEditorRef.value?.insertBlock({ type: "image", editable: false, text: "" })
}

const insertFile = () => {
  textEditorRef.value?.insertBlock({ type: "file", editable: false, text: "" })
}
const insertGallery = () => {
  textEditorRef.value?.insertBlock({ type: "gallery", editable: false, text: "" })
}

const setLink = (linkData: any) => {
  if (!textEditorRef.value || !makeLinkPopover.value.selection) return
  Object.assign(textEditorRef.value.selection, makeLinkPopover.value.selection)
  textEditorRef.value.applyStyle("link", linkData)
  makeLinkPopover.value.open = false
}

</script>

<style lang="sass">
.rich-text-editor__dialog
  .text-editor
    outline: none
    white-space: pre-wrap
    word-break: break-all
    min-height: 400px
    position: relative
    padding-top: 4px
    
    .callout
      background-color: rgba(#0073E9, 0.1)
      border: 1px solid var(--primary-color)
      border-radius: 8px
      padding: 16px
      margin-bottom: 8px
      margin-top: 8px

    .v-image-uploader
      width: 320px
      margin-top: 12px
      margin-bottom: 12px
      &.selected .v-form-control__outline
        border-color: var(--primary-color)
        box-shadow: 0 0 0 2px var(--shadow-color)

  .bold
    font-weight: 700
  .italic
    font-style: italic
  .underline
    text-decoration: underline
  .strikethrough
    text-decoration: line-through
    
  .underline.strikethrough
    text-decoration: underline line-through

  a
    color: var(--primary-color)

.rich-text-editor__placeholder
  position: absolute
  top: 4px
  left: 0px
  color: var(--text-secondary-color)
  user-select: none
  pointer-events: none
  margin-top: 1em

.rich-text-editor__controls
  height: 40px
  display: flex
  align-items: center
  padding-top: 12px
  gap: 12px

.rich-text-editor__actions-group
  height: 40px
  // background-color: var(--blocks-color)
  border: 1px solid var(--input-border-color)
  border-radius: 8px
  padding: 3px
  box-sizing: border-box
  display: flex
  button
    background: none
    border: none
    height: 32px
    width: 32px
    cursor: pointer
    border-radius: 6px
    color: var(--text-secondary-color)
    display: flex
    align-items: center
    justify-content: center

    &:hover
      background-color: var(--hover-color)

    &.active
      background-color: var(--background-active-color)
      color: var(--text-color)

</style>