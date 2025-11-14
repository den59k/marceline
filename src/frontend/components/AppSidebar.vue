<template>
  <div class="app-sidebar">
    <div class="title">{{ title }}</div>
    <div class="app-sidebar__items">
      <template v-for="item in pages">
        <div v-if="typeof item === 'string'" class="app-sidebar__group-title">
          {{ item }}
        </div>
        <button v-else-if="!item.to" class="app-sidebar__item" @click="item.onClick">
          <VIcon v-if="item.icon" :icon="item.icon" />
          {{ item.title }}
        </button>
        <RouterLink v-else :to="item.to" :key="item.to" :class="{ active: currentRoute === item }" class="app-sidebar__item">
          <VIcon v-if="item.icon" :icon="item.icon" />
          {{ item.title }}
        </RouterLink>
      </template>
      <div class="spacer"></div>
      <a class="app-sidebar__item" href="#">
        <VIcon icon="help"/> Помощь
      </a>
      <button class="app-sidebar__item logout-button" @click="logout">
        <VIcon icon="logout"/> Выйти из аккаунта
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import VIcon from './VIcon.vue';
import { useRouter } from 'vue-router';
import { useDialogStore } from '../stores/dialogStore';
import CreateTableDialog from './dialogs/CreateTableDialog.vue';
import { useRequest } from 'vuesix';
import { viewsApi } from '../api/views';
import { useAccountStore } from '../stores/accountStore';
import { accountApi } from '../api/account';
import { addRegisterPageEvent } from '../marceline';

const { data: views } = useRequest(viewsApi.getViews)
const accountStore = useAccountStore()

const pages = computed(() => {
  if (!views.value) return []
  const arr: Array<{ title: string, icon: string, to?: string, onClick?: any } | string> = []
  arr.push(...customPages.value)
  if (views.value) {
    arr.push(...views.value.filter((item: any) => item.show !== false).map((item: any) => ({
      title: item.name, icon: item.icon ?? "table", to: `/data/${item.id}`
    })))
  }

  if ((window as any).isDev) {
    arr.push({ title: "Добавить таблицу", icon: "add", onClick: addTable }),
    arr.push(
      "Для разработчиков",
      // { to: "/dev/views", title: "Таблицы", icon: "table" },
      { to: "/dev/forms", title: "Формы", icon: "note-edit" },
      { to: "/dev/endpoints", title: "Эндпоинты", icon: "code" },
    )
  }

  return arr
})

const router = useRouter()
const currentRoute = computed(() => {
  let targetRoute: { to?: string } | null = null
  for (let route of pages.value) {
    if (typeof route !== "object" || !route.to) continue
    if (router.currentRoute.value.path === route.to) return route
    if (router.currentRoute.value.path.startsWith(route.to)) targetRoute = route
  }
  return targetRoute
})

const title = computed(() => {
  return document.title
})

const dialogStore = useDialogStore()
const addTable = (e: MouseEvent) => {
  dialogStore.open(CreateTableDialog)
}

const logout = async () => {
  try {
    await accountApi.logout()
  } catch(e) {
    console.warn(e)
  }
  await accountStore.logout()
  router.push("/auth/login")
}

</script>

<script lang="ts">

const customPages = ref<{ to: string, title: string, icon: string }[]>([
  { to: "/", title: "Стартовая страница", icon: "home" },
])
// @ts-ignore
addRegisterPageEvent(e => {
  const newPage = { to: e.path, title: e.name ?? "Страница", icon: e.icon ?? "home" }
  const existsItemIndex = customPages.value.findIndex(item => item.to === e.path)
  if (existsItemIndex >= 0) {
    customPages.value[existsItemIndex] = newPage
  } else {
    customPages.value.push(newPage)
  }
})

</script>

<style lang="sass">
.app-sidebar
  width: 240px
  background-color: var(--paper-color)
  border-right: 1px solid var(--border-color)
  display: flex
  flex-direction: column
  flex-shrink: 0

  .title
    font-weight: 700
    font-size: 16px
    padding: 16px
    margin-bottom: 12px

  .spacer
    flex: 1 1 auto

.app-sidebar__group-title
  font-size: 12px
  letter-spacing: 0.04em
  margin: 0 16px
  margin-top: 24px
  color: var(--text-secondary-color)

.app-sidebar__items
  display: flex
  flex-direction: column
  gap: 4px
  flex: 1 1 auto

.app-sidebar__item
  display: flex
  align-items: center
  gap: 12px
  color: var(--text-unselected-color)
  text-decoration: none
  cursor: pointer
  padding: 0 10px
  margin: 0 8px
  height: 36px
  border-radius: 6px
  background: none
  border: none
  flex-shrink: 0

  &:hover
    background-color: #1E1E22
    text-decoration: none

  &.active
    background-color: #2B2B2B
    color: var(--text-color)

  &.logout-button
    margin-bottom: 16px

  &.disabled
    opacity: 0.5

</style>