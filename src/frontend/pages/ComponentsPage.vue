<template>
  <VLayout>
    <div class="components__layout">
      <div class="components__list">
        <button 
          v-for="item in components" 
          class="components__list-item" 
          :class="{ active: currentComponent === item }" 
          @click="currentComponent = item"
        >
          {{ item.title }}
        </button>
      </div>
      <div class="components__viewer">
        <component v-if="currentComponent" :is="currentComponent.component" />
      </div>
    </div>
  </VLayout>
</template>

<script lang="ts" setup>
import { shallowRef, watchEffect } from 'vue';
import VInput from '../components/VInput.vue';
import VLayout from '../components/VLayout.vue';
import VSelect from '../components/VSelect.vue';
import VFileUploader from '../components/VFileUploader.vue';

const components = [
  { 
    title: "input",
    component: VInput
  },
  {
    title: "select",
    component: VSelect
  },
  {
    title: "file",
    component: VFileUploader
  }
]

const currentComponent = shallowRef<typeof components[number] | null>(null)

watchEffect(() => {
  console.log(currentComponent.value?.component.props)
})

</script>

<style lang="sass">
.components__layout
  display: flex
  flex: 1 1 auto
  background-color: var(--paper-color)
  border-radius: 12px

.components__list
  width: 240px
  border-right: 1px solid var(--border-color)
  display: flex
  flex-direction: column
  padding: 8px 0
  gap: 4px

.components__list-item
  background: none
  height: 36px
  border: none
  text-align: left
  font-size: 14px
  padding: 0 10px
  color: var(--text-unselected-color)
  margin: 0 8px
  border-radius: 6px

  &:hover
    background-color: #1E1E22

  &.active
    color: var(--text-color)
    background-color: #2B2B2B

.components__viewer
  flex: 1 1 auto
  display: flex
  align-items: center
  justify-content: center
  flex-direction: column

  .v-form-control__outline
    min-width: 300px

</style>