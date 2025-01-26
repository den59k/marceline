<template>
  <div class="make-link-popover">
    <div class="title">Создать ссылку</div>
    <VSelect v-model="values.type" :items="items"/>
    <VInput v-if="values.type === 'external'" v-model="values.url" placeholder="URL ссылки"/>
    <VCheckbox v-model="values.blank" label="Открывать в новом окне" />
    <div class="actions">
      <VButton flat @click="emit('close')">Отмена</VButton>
      <VButton @click="apply">Создать</VButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VSelect from './VSelect.vue';
import { computed, reactive } from 'vue';
import VInput from './VInput.vue';
import VButton from './VButton.vue';
import VCheckbox from './VCheckbox.vue';
import { useRequest } from 'vuesix';
// import { projectsApi } from '../api/projectsApi';


const emit = defineEmits([ "apply", "close" ])

// const { data: pagesData } = useRequest(projectsApi.getLinks, props.projectId)

const values = reactive({
  type: "external",
  url: "",
  blank: false
})

const items = computed(() => {
  const arr: Array<{ id: string, title: string }> = [
    { id: "external", title: "Внешняя ссылка" },
  ]
  // if (pagesData.value) {
  //   arr.push("Основные страницы")
  //   for (let item of pagesData.value) {
  //     if (item.linkedCollection) continue
  //     arr.push({ id: `page:${item.id}`, title: item.name })
  //   }
  //   for (let item of pagesData.value) {
  //     if (!item.linkedCollection || item.linkedCollection.items.length === 0) continue
  //     arr.push(`${item.linkedCollection.title}`)
  //     for (let collectionItem of item.linkedCollection.items) {
  //       arr.push({ id: `collection:${item.linkedCollection.uuid}:${collectionItem.id}`, title: collectionItem.url })
  //     }
  //   }
  // }

  return arr
})

const apply = () => {
  if (values.type === "external") {
    emit("apply", { type: "external", url: values.url, blank: values.blank })
  } else if (values.type.startsWith("page:")) {
    const [ type, pageId ] = values.type.split(":")
    emit("apply", { type: "page", pageId, blank: values.blank })
  } else if (values.type.startsWith("collection:")) {
    const [ type, collection, itemId ] = values.type.split(":")
    emit("apply", { type: "collection", collection, itemId, blank: values.blank })
  }
}

</script>

<style lang="sass">
.make-link-popover
  padding: 16px 16px
  width: 350px
  display: flex
  flex-direction: column
  gap: 12px
  
  .title
    font-size: 13px
    font-weight: 500
    color: var(--text-secondary-color)

  .actions
    display: flex
    gap: 8px
    justify-content: flex-end
</style>