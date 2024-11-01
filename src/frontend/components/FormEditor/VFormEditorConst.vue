<template>
  <VFormControl class="form-editor-const">
    <div class="form-editor-const__content">
      <slot name="start-adornment"></slot>
      {{ value }}
      <slot name="end-adornment"></slot> 
    </div>
  </VFormControl>
</template>

<script lang="ts" setup>
import VFormControl from '../VFormControl.vue';

const props = defineProps<{ value?: any }>()

</script>

<style lang="sass">
.form-editor-const
  box-sizing: border-box

.form-editor-const__content
  position: relative
  height: 36px
  display: flex
  align-items: center
  color: var(--text-secondary-color)
  
</style>