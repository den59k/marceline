<template>
  <div class="code-editor" :contenteditable="false">
    <TextEditor v-model="model" tabindex="2" :parser="parser" :decorator="decorator" preventMultiline spellcheck="false"/>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Style, TextEditor } from 'vuewrite';

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits([ "update:modelValue" ])

const model = ref([{ text: "" }])
if (props.modelValue) {
  model.value = props.modelValue.split("\n").map(text => ({ text }))
}
watch(model, () => {
  emit("update:modelValue", model.value.map(item => item.text).join("\n"))
}, { deep: true })

const colors: { [ key: string ]: string} = {
  "const": "#FF457D",
  "let": "#FF457D",
  "var": "#FF457D",
  "new": "#FF457D",
  "class": "#FF457D",
  "else": "#FF457D",
  "if": "#FF457D",
  "for": "#FF457D",
  "continue": "#FF457D",
  "break": "#FF457D",
  "return": "#FF457D",
  "function": "#FF457D",
  "import": "#FF457D",
  "from": "#FF457D"
}
const quoteColor = "#4B9CE8"

const nextChar = (str: string, pos: number) => {
  for (let i = pos; i < str.length; i++) {
    if (str[i] !== " ") return str[i]
  }
  return null
}

const parser = (text: string) => {
  const arr: (Style)[] = []

  let j = 0
  let quotes = ""
  let comment = false
  for (let i = 0; i <= text.length; i++) {
    if (comment && i === text.length) {
      arr.push ({ start: j, end: i, style: "code", meta: { color: "#71808F" } } )
    }
    if (comment) continue
    if (text[i] === "/" && text[i+1] === "/" && !quotes) {
      comment = true
      j = i
      continue
    }

    if (quotes !== "" && text[i] === "\\") {
      i++
      continue
    }
    if ((i === text.length && quotes !== "") || "\"'".includes(text[i])) {
      if (quotes !== "") {
        if (text[i] !== quotes && i !== text.length) continue
        arr.push({ start: j, end: i+1, style: "code", meta: { color: quoteColor } })
        j = i+1
        quotes = ""
      } else {
        quotes = text[i]
        j = i
      }
    }
    if (quotes !== "") continue

    if (i === text.length || " ()!-=.,;'\"/*".includes(text[i])) {
      if (i < j) {
        continue
      }
      const word = text.slice(j, i)
      if (nextChar(text, i) === "(") {
        arr.push({ start: j, end: i, style: "code", meta: { color: "#26CBFF" }})      // Function
      } else if (word in colors) {
        arr.push({ start: j, end: i, style: "code", meta: { color: colors[word] } })  // Key words
      } else if (/^-?\d*\.?\d*$/.test(word)) {
        if (text[i] === ".") continue
        arr.push({ start: j, end: i, style: "code", meta: { color: "#26CBFF" }})       // Numbers
      } else if (text[j-1] === ".") {
        arr.push({ start: j, end: i, style: "code", meta: { color: "#FFAE26" }})       // Methods
      }
      j = i+1
    }
  }
  return arr
}

const decorator = (style: Style) => {
  if (!style.meta) return {}
  return { style: `color: ${style.meta!.color};` }
}

</script>

<style lang="sass">

.code-editor
  background-color: #262626
  border-radius: 6px
  font-size: 14px
  user-select: none

  &>div
    padding: 20px
    outline: none
    user-select: contain

</style>