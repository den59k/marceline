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

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: HomePage, meta: { name: "Главная" } },

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

export const beforeEach = (to: RouteLocationNormalized) => {
  // const accountStore = useAccountStore()
  if (to.path === "/auth" || to.path === "/auth/") return "/auth/login"

  // if (!to.meta.public && accountStore.status === "not-authorized") return "/auth/login"
}
router.beforeEach(beforeEach)