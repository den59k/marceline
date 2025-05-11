import Dashboard from "./Dashboard.vue"
import Page2 from "./Page2.vue"

const marceline = (window as any).marceline

// marceline.registerPage({ path: "/", name: "Статистика", component: Dashboard })
marceline.registerPage({ path: "/stats", name: "Статистика приложения", icon: "mobile", component: Page2 })