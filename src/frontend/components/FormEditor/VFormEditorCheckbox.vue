<template>
  <VFormControl class="form-editor-checkbox">
    <div class="form-editor-checkbox__content">
      <slot name="start-adornment"></slot>
      <VCheckbox :label="label"/>
      <slot name="end-adornment"></slot>
    </div>
  </VFormControl>
</template>

<script lang="ts" setup>
import VCheckbox from '../VCheckbox.vue';
import VFormControl from '../VFormControl.vue';

const props = defineProps<{ label?: string }>()

</script>

<style lang="sass">
.form-editor-checkbox
  padding-top: 21px
  min-height: 58px
  box-sizing: border-box

.form-editor-checkbox__content
  position: relative

</style>