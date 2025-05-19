import { type App, createApp } from "vue"

type PageInfo = { path: string, name?: string, icon?: string, component: any }

const getProps = (component: any) => {
  let app: App
  return {
    mount(el: any) {
      app = createApp(component)
      app.mount(el)
    },
    unmount() {
      app.unmount()
    }
  }
}

export const registerPage = (page: PageInfo) => {
  (window as any).marceline.registerPage({ ...page, component: undefined, ...getProps(page.component) })
}

export { default as VButton } from '../frontend/components/VButton.vue'
export { default as VTable } from '../frontend/components/VTable.vue'
export { default as VIcon } from '../frontend/components/VIcon.vue'
export { default as VInput } from '../frontend/components/VInput.vue'
export { default as VSelect } from '../frontend/components/VSelect.vue'
export { default as VCard } from '../frontend/components/VCard.vue'
export { default as VPopover } from '../frontend/components/VPopover.vue'
export { default as VContextMenu } from '../frontend/components/VContextMenu.vue'
export { default as VDatePicker } from '../frontend/components/VDatePicker.vue'
export { default as VDateRangePicker } from '../frontend/components/VDateRangePicker.vue'