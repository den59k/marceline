import { defineStore } from "pinia";
import { computed, DefineComponent, ExtractPropTypes, shallowReactive } from "vue";
import ExternalDialog from "../components/ExternalDialog.vue";

type OpenExternalDialogOptions = {
  title?: string,
  onMounted?: (el: HTMLElement) => void
}

export const useDialogStore = defineStore('dialog', () => {

  const dialogHistory = shallowReactive<{ dialog: DefineComponent<any, {}, any>, props: any }[]>([])

  const open = <T>(_dialog: DefineComponent<T, {}, any>, props?: ExtractPropTypes<T>) => {
    dialogHistory.push({ dialog: _dialog as any, props })
  }

  const openExternal = (options: OpenExternalDialogOptions) => {
    dialogHistory.push({ dialog: ExternalDialog as any, props: options})
  }

  const close = () => {
    dialogHistory.length = 0
  }

  const back = () => {
    if (dialogHistory.length === 0) return
    dialogHistory.pop()
  }

  const dialog = computed(() => {
    if (dialogHistory.length === 0) return { dialog: null, props: {} }
    return dialogHistory[dialogHistory.length-1]
  })

  const length = computed(() => dialogHistory.length)

  return { open, openExternal, close, back, dialogHistory, length, dialog }
})