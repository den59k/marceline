<template>
  <VFormControl outline>
    <slot name="start-adornment"></slot>
    <div ref="mapContainer" style="width: 100%; height: 400px;"></div>
    <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import VFormControl from './VFormControl.vue';
import L, { Marker } from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps<{ initialLatLng?: string, modelValue?: string }>()
const emit = defineEmits([ "update:modelValue" ])

const mapContainer = ref<HTMLDivElement>()

const getCoords = (coord: string) => {
  return coord.split(",").map(item => parseFloat(item)) as [number, number]
}

const markerRef = shallowRef<Marker | null>(null)
let modelValue: string | null = null
onMounted(() => {

  const map = L.map(mapContainer.value!).setView(getCoords(props.initialLatLng ?? "55.76, 37.64"), 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const markerPosition = getCoords(props.modelValue ?? "55.76, 37.64")
  markerRef.value = L.marker(markerPosition).addTo(map)
  map.on('click', (e: L.LeafletMouseEvent) => {
    const coords = [e.latlng.lat, e.latlng.lng];
    markerRef.value!.setLatLng(e.latlng)
    modelValue = coords.join(",")
    emit("update:modelValue", modelValue)
    console.log('Coordinates:', coords.map(item => item.toFixed(3)).join(", ")); // Выводим в консоль
  });
})

watch(() => props.modelValue, (value) => {
  if (value === modelValue || !value) return
  modelValue = value
  if (markerRef.value) {
    markerRef.value.setLatLng(getCoords(modelValue))
  }
})

</script>

<style lang="sass">
.leaflet-container
  cursor: pointer
  border-radius: 6px

.leaflet-control-attribution
  display: none

</style>