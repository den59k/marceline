import { createApp } from "vue"
import Dashboard from "./Dashboard.vue"

let element: HTMLElement | null = null
const mountApp = () => {
  const mounted = !!element
  element = document.getElementById("app-home-page")
  if (mounted && element) {
    return
  }
  const app = createApp(Dashboard)
  if (element) {
    app.mount(element)
  }
}
window.addEventListener("open-page", mountApp)

setTimeout(() => {
  mountApp()
}, 10)