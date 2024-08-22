<template>
  <VLayout>
    <div class="tables-controls">
      <VButton component="router-link" to="/dev/endpoints/new">
        <VIcon icon="add" /> Добавить эндпоинт
      </VButton>
      <VInput placeholder="Поиск..."/>
    </div>
    <div class="views-page__layout">
      <VTable 
        v-if="data"
        :columns="columns" 
        :data="data" 
        row-component="router-link"
        :row-props="item => ({ to: '/dev/endpoints/' + item.id })"
      >
      </VTable>
    </div>
  </VLayout>
</template>

<script lang="ts" setup>
import { useRequest } from 'vuesix';
import VInput from '../components/VInput.vue';
import VButton from '../components/VButton.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable from '../components/VTable.vue';
import { endpointsApi } from '../api/endpoints';

const { data } = useRequest(endpointsApi.getAll)

const columns = {
  id: { title: "ID" },
  path: { title: "Путь" }
}

</script>

<style lang="sass">

</style>