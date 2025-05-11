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