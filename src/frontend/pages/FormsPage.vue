<template>
  <VLayout>
    <div class="tables-controls">
      <VButton to="/dev/forms/new" component="router-link">
        <VIcon icon="add" /> Добавить форму
      </VButton>
      <VInput placeholder="Поиск..."/>
    </div>
    <div class="views-page__layout">
      <VTable 
        v-if="data"
        :columns="columns" 
        :data="data" 
        row-component="router-link" 
        :row-props="item => ({ to: '/dev/forms/' + item.id })"
      >

      </VTable>
    </div>
  </VLayout>
</template>

<script lang="ts" setup>
import { useRequest } from 'vuesix';
import VInput from '../components/forms/VInput.vue';
import VButton from '../components/VButton.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable, { Columns } from '../components/VTable.vue';
import { formsApi } from '../api/formsApi';

const { data } = useRequest(formsApi.getAll)

const columns: Columns<any> = {
  id: { title: "ID" },
  systemTable: { title: "Системная таблица" },
  name: { title: "Название" }
}

</script>

<style lang="sass">

</style>