<template>
  <div class="app-sidebar">
    <div class="title">{{ title }}</div>
    <div class="app-sidebar__items">
      <template v-for="item in pages">
        <div v-if="typeof item === 'string'" class="app-sidebar__group-title">
          {{ item }}
        </div>
        <VCollapse
          v-else-if="'group' in item"
          :key="`group:${item.group}`"
          :open="!collapsedGroups[item.group]"
          @update:open="setGroupOpen(item.group, $event)"
        >
          <template #activator="{ props: activator }">
            <div
              class="app-sidebar__group-title app-sidebar__group-toggle"
              :class="{ open: activator.open }"
              @mousedown="activator.onClick"
            >
              <VIcon icon="v-collapse-arrow" />
              {{ item.group }}
            </div>
          </template>
          <AppSidebarItem
            v-for="subItem in item.items"
            :key="subItem.to"
            :item="subItem"
            :active="currentRoute === subItem"
          />
        </VCollapse>
        <AppSidebarItem v-else :key="item.to ?? item.title" :item="item" :active="currentRoute === item" />
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
import { computed, ref, watch } from 'vue';
import VIcon from './VIcon.vue';
import VCollapse from './VCollapse.vue';
import AppSidebarItem from './AppSidebarItem.vue';
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

type SidebarItem = { title: string, icon: string, to?: string, onClick?: any }
type SidebarGroup = { group: string, items: SidebarItem[] }

const dialogStore = useDialogStore()
const addTable = (e: MouseEvent) => {
  dialogStore.open(CreateTableDialog)
}

const pages = computed(() => {
  if (!views.value) return []
  const arr: Array<SidebarItem | SidebarGroup | string> = []
  arr.push(...customPages.value)
  if (views.value) {
    /** Views without a group stay on the top level, grouped ones are collected
     *  into collapsible sections in the order their group is first mentioned */
    const groups = new Map<string, SidebarGroup>()
    for (const view of views.value.filter((item: any) => item.show !== false)) {
      const item = { title: view.name, icon: view.icon ?? "table", to: `/data/${view.id}` }
      if (!view.group) {
        arr.push(item)
        continue
      }
      let group = groups.get(view.group)
      if (!group) {
        group = { group: view.group, items: [] }
        groups.set(view.group, group)
        arr.push(group)
      }
      group.items.push(item)
    }
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

/** Flat list of every link, including the ones nested inside groups */
const routeItems = computed(() => {
  const arr: Array<{ item: SidebarItem, group?: string }> = []
  for (const entry of pages.value) {
    if (typeof entry !== "object") continue
    if ("group" in entry) {
      arr.push(...entry.items.map(item => ({ item, group: entry.group })))
    } else {
      arr.push({ item: entry })
    }
  }
  return arr
})

const currentRoute = computed(() => {
  let target: SidebarItem | null = null
  for (let { item } of routeItems.value) {
    if (!item.to) continue
    if (router.currentRoute.value.path === item.to) return item
    if (router.currentRoute.value.path.startsWith(item.to)) target = item
  }
  return target
})

const COLLAPSED_GROUPS_KEY = "marceline:collapsed-groups"
const collapsedGroups = ref<Record<string, boolean>>((() => {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_GROUPS_KEY) ?? "{}")
  } catch(e) {
    return {}
  }
})())

const setGroupOpen = (group: string, open: boolean) => {
  collapsedGroups.value[group] = !open
  localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(collapsedGroups.value))
}

/** Expand the group of the opened page - but only on navigation, so that
 *  collapsing the group you are currently in keeps working */
watch([ () => router.currentRoute.value.path, routeItems ], () => {
  const active = routeItems.value.find(item => item.item === currentRoute.value)
  if (active?.group) collapsedGroups.value[active.group] = false
}, { immediate: true })

const title = computed(() => {
  return document.title
})

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
  margin-top: 0px
  color: var(--text-secondary-color)

.app-sidebar__group-toggle
  display: flex
  align-items: center
  gap: 4px
  height: 24px
  margin-left: 12px
  cursor: pointer
  user-select: none

  &:hover
    color: var(--text-color)

  svg
    width: 16px
    height: 16px
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)

  &.open svg
    transform: rotate(90deg)

  & + .v-collapse__content .v-collapse__content-inner
    display: flex
    flex-direction: column
    gap: 4px
    padding-top: 4px

.app-sidebar__items
  display: flex
  flex-direction: column
  gap: 4px
  overflow-y: auto
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