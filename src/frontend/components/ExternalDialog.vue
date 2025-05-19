<template>
  <VDialog>
    <template #header v-if="props.title">{{ props.title }}</template>
    <template #actions v-if="props.actions">
      <VButton outline @click="dialogStore.back">Отмена</VButton>
      <VButton v-for="item in props.actions" @click="onActionClick($event, item)">{{ item.title }}</VButton>
    </template>
  </VDialog>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import VDialog from './VDialog.vue';
import { useCurrentElement } from '@vueuse/core';
import VButton from './VButton.vue';
import { useDialogStore } from '../stores/dialogStore';

type Action = {
  title: string,
  close?: boolean,
  onClick: () => void
}

const props = defineProps<{ onMounted?: (el: HTMLElement) => void, title?: string, actions?: Action[] }>()

const el = useCurrentElement()
onMounted(() => {
  if (props.onMounted) {
    const element = (el.value as HTMLElement)?.querySelector(".v-dialog__content") as HTMLElement
    props.onMounted(element)
  }
})

const dialogStore = useDialogStore()

const onActionClick = (e: MouseEvent, action: any) => {
  const resp = action.onClick()
  const button = (e.currentTarget as HTMLElement)
  if ("then" in resp) {
    button.classList.add("disabled")
    resp.then(() => {
      if (action.close) {
        dialogStore.close()
      }
    }).finally(() => {
      button.classList.remove("disabled")
    })
  } else {
    if (action.close) {
      dialogStore.close()
    }
  }
}

</script>

<style lang="sass">

</style>