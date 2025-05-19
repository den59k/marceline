import { App, createApp } from "vue"
import Dashboard from "./Dashboard.vue"
import Page2 from "./Page2.vue"
import dayjs from 'dayjs'
import ruLocale from 'dayjs/locale/ru'
import { setKeyDownListeners } from "vuesix"

const marceline = (window as any).marceline
setKeyDownListeners((window as any).keyDownListeners)

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

dayjs.locale(ruLocale)
