<template>
  <input v-model="strValue" :class="{ error }" placeholder="DD.MM.YYYY" @input="onInput" @blur="applyValue"/>
</template>

<script lang="ts" setup>
import dayjs, { Dayjs } from 'dayjs';
import { shallowRef, watch } from 'vue';

const model = defineModel<Dayjs | null>()
const strValue = shallowRef("")

const error = shallowRef(false)

const applyValue = () => {
  let val = strValue.value.trim()
  if (val === "") {
    model.value = null
    return
  }
  const date = dayjs(val, "DD.MM.YYYY")
  if (!date.isValid()) {
    error.value = true
    return
  }
  error.value = false
  model.value = date
}

const onInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  if ((e as InputEvent).inputType === "insertText" && el.value.length < 6) {
    let value = el.value.replace(/\D/g, ''); // Оставляем только цифры

    let formattedValue = '';

    for (let i = 0; i < value.length; i++) {
      formattedValue += value[i];
      if (i === 1 || i === 3) {
        formattedValue += '.';
      }
    }
    
    el.value = formattedValue
    strValue.value = formattedValue
  }
  error.value = false
}

watch(model, (model) => {
  if (model) {
    strValue.value = model.format("DD.MM.YYYY")
  } else {
    strValue.value = ""
  }
}, { immediate: true })

</script>

<script lang="ts">
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
</script>

<style lang="sass">

</style>