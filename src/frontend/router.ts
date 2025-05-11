import { RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router'
import ComponentsPage from './pages/ComponentsPage.vue'
import ViewsPage from './pages/ViewsPage.vue'
import ViewsItemPage from './pages/ViewsItemPage.vue'
import HomePage from './pages/HomePage.vue'
import DataPage from './pages/DataPage.vue'
import FormsPage from './pages/FormsPage.vue'
import FormItemPage from './pages/FormItemPage.vue'
import EndpointsPage from './pages/EndpointsPage.vue'
import EndpointItemPage from './pages/EndpointItemPage.vue'
import LoginPage from './pages/LoginPage.vue'
import { useAccountStore } from './stores/accountStore'
import { nextTick } from 'vue'
import { addRegisterPageEvent } from './marceline'
import CustomPage from './pages/CustomPage.vue'

const basePath = document.head.querySelector("base")?.getAttribute("href")
export const router = createRouter({
  history: createWebHistory(basePath ?? undefined),
  routes: [
    { path: "/", component: HomePage, name: "main", meta: { name: document.title ?? "Добро пожаловать" } },
    { path: "/auth/login", component: LoginPage, meta: { public: true, showSidebar: false } },

    { path: "/data/:viewId", component: DataPage, meta: { name: "#view" } },

    { path: "/dev/views", component: ViewsPage, meta: { name: "Таблицы" } },
    { path: "/dev/views/:viewId", component: ViewsItemPage, meta: { name: "#view" } },

    { path: "/dev/components", component: ComponentsPage, meta: { name: "Компоненты" } },

    { path: "/dev/forms", component: FormsPage, meta: { name: "Формы" } },
    { path: "/dev/forms/:formId", component: FormItemPage, meta: { name: "#form" } },

    { path: "/dev/endpoints", component: EndpointsPage, meta: { name: "Эндпоинты" } },
    { path: "/dev/endpoints/:endpointId", component: EndpointItemPage, meta: { name: "#endpoint" } },
  ]
})

addRegisterPageEvent((e) => {
  if (e.path === "/") {
    router.removeRoute("main")
  }
  router.addRoute({ 
    path: e.path, 
    component: CustomPage, 
    props: { component: e.component, mount: e.mount, unmount: e.unmount }, 
    meta: { name: e.name ?? "" } 
  })
  if (router.currentRoute.value.path === e.path) {
    router.push(router.currentRoute.value.path)
  }
})

export const beforeEach = (to: RouteLocationNormalized) => {
  const accountStore = useAccountStore()
  if (to.path === "/auth/login" && accountStore.status === "authorized") {
    return "/"
  }
  if (to.path === "/auth" || to.path === "/auth/") return "/auth/login"

  if (!to.meta.public && accountStore.status === "not-authorized") return "/auth/login"
}
router.beforeEach(beforeEach)

export const afterEach = () => {
  const event = new Event("open-page")
  Object.assign(event, { path: router.currentRoute.value.path })
  window.dispatchEvent(event)
}

router.afterEach(() => {
  nextTick(afterEach) 
})