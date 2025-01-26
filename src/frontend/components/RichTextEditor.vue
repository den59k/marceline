<template>
  <div class="rich-text-editor">
    <div class="v-form-control__label">
      {{ props.label }}
    </div>
    <div v-if="$slots.actions" class="v-form-control__actions">
      <slot name="actions"></slot>
    </div>
    <TextEditor 
      ref="textEditorRef" 
      class="rich-text-editor__editor"
      v-model="modelValue"
      :decorator="decorator"
      @keydown="onKeyDown"
    >
      <template #h1="{ content, props }">
        <h1 v-bind="props"><component :is="content" /></h1>
      </template>
      <template #h2="{ content, props }">
        <h2 v-bind="props"><component :is="content" /></h2>
      </template>
      <template #h3="{ content, props }">
        <h3 v-bind="props"><component :is="content" /></h3>
      </template>
      <template #li="{ content, props }">
        <li v-bind="props"><component :is="content" /></li>
      </template>
      <template #callout="{ props, content }">
        <div v-bind="props" class="callout" ><component :is="content"/></div>
      </template>
      <template #code="{ props, block }">
        <RichTextEditorCode v-model="block.text" v-bind="props"/>
      </template>
      <!-- <template #image="{ props, block }">
        <VImageUploader v-model="block.src" :contenteditable="false" v-bind="props"/>
      </template> -->
      <template #placeholder>
        <div class="rich-text-editor__placeholder" :contenteditable="false">
          Введите текст...
        </div>
      </template>
    </TextEditor>
    <VPopover
      v-model:open="makeLinkPopover.open"
      placement="bottom-start"
      :anchor-position="makeLinkPopover.position"
    >
      <RichTextMakeLinkPopover @apply="setLink($event)" @close="makeLinkPopover.open = false"/>
    </VPopover>
    <RichTextEditorPopover
      ref="popoverRef"
      v-model:open="popoverOpen" 
      :word="currentWord" 
      :position="popoverPosition" 
      :blocks="customBlocks"
    />
  </div>
</template>  

<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { Style, TextEditor, TextEditorRef } from 'vuewrite'
import RichTextEditorPopover from './RichTextEditorPopover.vue';
import RichTextEditorCode from './RichTextEditorCode.vue';
import VPopover from './VPopover.vue';
import RichTextMakeLinkPopover from './RichTextMakeLinkPopover.vue';

const props = defineProps<{ label?: string }>()

const modelValue = defineModel<any>()

const textEditorRef = shallowRef<TextEditorRef>()

const decorator = (style: Style) => {
  if (style.style === 'color') {
    return { style: `color: ${style.meta!.color};` }
  }
  if (style.style === 'bold') {
    return { tag: "b", class: "bold" }
  }
  if (style.style === "underline" || style.style === "italic" || style.style === "code") {
    return { class: style.style }
  }
  if (style.style === 'link') {
    return { tag: "a", href: style.meta.url }
  }
}

const makeLinkPopover = ref({
  open: false,
  position: { x: 0, y: 0 },
  selection: {} as any
})


const onKeyDown = (e: KeyboardEvent) => {
  if (e.defaultPrevented) return

  if (popoverOpen.value && popoverRef.value) {
    popoverRef.value.onKeyDown(e)
    if (e.defaultPrevented) return
  }
  
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
  if (!textEditorRef.value?.isCollapsed && e.code === "Backquote") {
    textEditorRef.value?.toggleStyle("code")
    e.preventDefault()
  }
  if (e.code === "Space" && textEditorRef.value?.currentBlock) {
    if (textEditorRef.value.currentBlock.text === "#") {
      textEditorRef.value.currentBlock.type = "h1"
      textEditorRef.value.currentBlock.text = ""
      e.preventDefault()
    } else if (textEditorRef.value.currentBlock.text === "##") {
      textEditorRef.value.currentBlock.type = "h2"
      textEditorRef.value.currentBlock.text = ""
      e.preventDefault()
    } else if (textEditorRef.value.currentBlock.text === "###") {
      textEditorRef.value.currentBlock.type = "h3"
      textEditorRef.value.currentBlock.text = ""
      e.preventDefault()
    } else if (textEditorRef.value.currentBlock.text === "*") {
      textEditorRef.value.currentBlock.type = "li"
      textEditorRef.value.currentBlock.text = ""
      e.preventDefault()
    }
  }
  if (e.code === "Enter" && textEditorRef.value?.currentBlock?.type === "li") {
    e.preventDefault()
    textEditorRef.value.addNewLine()
    textEditorRef.value!.currentBlock.type = "li"
  }
}

const currentWord = computed(() => {
  if (!textEditorRef.value || !textEditorRef.value.isCollapsed || !textEditorRef.value.currentBlock) return null
  const text = textEditorRef.value.currentBlock!.text
  const end = textEditorRef.value.selection.anchor.offset
  let start = end
  for (start = end; start > 0; start--) {
    if (text[start] === ' ') {
      start++
      break
    }
  }
  return text.slice(start, end)
})

const customBlocks = [
  { 
    id: "code", 
    title: "Code", 
    onClick() {
      popoverOpen.value = false
      textEditorRef.value!.selection.anchor.offset -= currentWord.value!.length
      textEditorRef.value?.insertBlock({ type: "code", editable: false, text: "" })
    } 
  },
  {
    id: "callout",
    title: "Callout",
    onClick() {
      popoverOpen.value = false
      textEditorRef.value!.selection.anchor.offset -= currentWord.value!.length
      textEditorRef.value!.insertBlock({ type: "callout", text: "" })
    }
  },
  { 
    id: "list", 
    title: "List", 
    onClick() {
      popoverOpen.value = false
      textEditorRef.value!.selection.anchor.offset -= currentWord.value!.length
      textEditorRef.value!.insertBlock({ type: "li", text: "" })
    }
  },
  { 
    id: "image", 
    title: "Image", 
    onClick() {
      popoverOpen.value = false
      textEditorRef.value!.selection.anchor.offset -= currentWord.value!.length
      textEditorRef.value!.insertBlock({ type: "image", editable: false })
    }
  },
]

const popoverPosition = ref<{ x: number, y: number }>({ x: 0, y: 0 })
const popoverOpen = ref(false)
watch(currentWord, (currentWord) => {
  if (textEditorRef.value && currentWord?.startsWith("/")) {
    popoverOpen.value = true
    const selection = JSON.parse(JSON.stringify(textEditorRef.value.selection))
    selection.anchor.offset -= currentWord.length
    const rect = textEditorRef.value.getClientRects(selection)?.[0]
    if (rect) {
      popoverPosition.value = { y: rect.bottom, x: rect.left }
    }
  } else {
    popoverOpen.value = false
  }
}, { flush: "post" })

const popoverRef = shallowRef<any>()

const setLink = (linkData: any) => {
  if (!textEditorRef.value || !makeLinkPopover.value.selection) return
  Object.assign(textEditorRef.value.selection, makeLinkPopover.value.selection)
  textEditorRef.value.applyStyle("link", linkData)
}

</script>

<style lang="sass">
.rich-text-editor
  position: relative
  
.rich-text-editor__editor
  outline: none
  position: relative
  white-space: pre-wrap
  font-size: 14px
  overflow-y: hidden
  min-height: 150px

  &>div
    margin: 12px 0
    line-height: 1.5em

  &>li
    margin: 12px 0
    line-height: 1.5em

  .callout
    background-color: var(--blocks-color)
    border: 1px solid var(--primary-color)
    border-radius: 8px
    padding: 20px

  
  .bold
    font-weight: 700

  .italic
    font-style: italic
  
  .underline
    text-decoration: underline

  .code
    background-color: var(--blocks-color)
    padding: 2px 4px
    border-radius: 4px
    color: var(--primary-color)

  a
    color: var(--primary-color)
    font-weight: 500
    text-decoration: underline
    text-underline-offset: 2px

.rich-text-editor__placeholder
  color: var(--text-secondary-color)
  position: absolute
  top: 0
  pointer-events: none
  user-select: none
  white-space: nowrap
</style>