import { App, createApp } from "vue"
import Dashboard from "./Dashboard.vue"
import Page2 from "./Page2.vue"

const marceline = (window as any).marceline

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

marceline.registerPage({ path: "/", name: "Статистика", ...getProps(Dashboard) })
marceline.registerPage({ path: "/stats", name: "Статистика приложения", icon: "mobile", ...getProps(Page2) })