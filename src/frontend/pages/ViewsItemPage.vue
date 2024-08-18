<template>
  <VLayout>
    <div class="form-row">
      <VSelect :items="models" label="Системная таблица"/>
      <VInput label="Название"/>
    </div>
    
  </VLayout>
</template>

<script lang="ts" setup>
import { useRequest } from 'vuesix';
import VInput from '../components/forms/VInput.vue';
import VSelect from '../components/forms/VSelect.vue';
import VLayout from '../components/VLayout.vue';
import { utilsApi } from '../api/utils';
import { computed } from 'vue';

const { data } = useRequest(utilsApi.getModels)

const models = computed(() => {
  if (!data.value) return []
  return data.value.models.map(item => ({ id: item.name, title: item.name }))
})

</script>

<style lang="sass">

</style>