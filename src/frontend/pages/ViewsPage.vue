<template>
  <VLayout>
    <div class="tables-controls">
      <VButton>
        <VIcon icon="add" /> Добавить таблицу
      </VButton>
      <VInput placeholder="Поиск..."/>
    </div>
    <div class="views-page__layout">
      <VTable 
        :columns="columns" 
        :data="data" 
        row-component="router-link" 
        :row-props="item => ({ to: '/dev/views/' + item.id })"
      >

      </VTable>
    </div>
  </VLayout>
</template>

<script lang="ts" setup>
import VInput from '../components/forms/VInput.vue';
import VButton from '../components/VButton.vue';
import VIcon from '../components/VIcon.vue';
import VLayout from '../components/VLayout.vue';
import VTable, { Columns } from '../components/VTable.vue';

const columns: Columns<any> = {
  id: { title: "ID" },
  name: { title: "Название" },
  systemTable: { title: "Системная таблица" },
}

const data = [
  { id: "09cff5a", systemTable: "CarType", name: "Типы автомобилей" },
  { id: "123421s", systemTable: "Companies", name: "Компании" }
]

</script>

<style lang="sass">
.views-page__layout
  border-radius: 12px
  flex: 1 1 auto
  border: 1px solid var(--border-color)

  .v-table__header
    border-radius: 12px 12px 0 0 

.tables-controls
  margin-bottom: 10px
  display: flex
  align-items: center

  .v-input
    height: 38px
    width: 300px
    margin-left: auto

</style>