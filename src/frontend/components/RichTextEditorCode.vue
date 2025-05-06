<template>
  <div class="code-editor" :contenteditable="false">
    <TextEditor v-model="model" tabindex="2" :parser="codeParser" :decorator="codeDecorator" preventMultiline spellcheck="false" @keydown="onKeyDown"/>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Style, TextEditor } from 'vuewrite';
import { codeDecorator, codeParser } from '../utils/richTextCodeComponents';

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits([ "update:modelValue", "newblock", "remove" ])

const model = ref([{ text: "" }])
if (props.modelValue) {
  model.value = props.modelValue.split("\n").map(text => ({ text }))
}
watch(model, () => {
  emit("update:modelValue", model.value.map(item => item.text).join("\n"))
}, { deep: true })

const onKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.code === "Enter") {
    e.preventDefault()
    emit("newblock")
  }
  if (e.code === "Backspace" && !e.shiftKey && model.value.length <= 1 && model.value[0]?.text === "") {
    e.preventDefault()
    emit("remove")
  }
}

</script>

<style lang="sass">

.code-editor
  background-color: var(--background-color)
  border-radius: 6px
  font-size: 14px
  user-select: none

  &>div
    padding: 20px
    outline: none
    user-select: contain

</style>