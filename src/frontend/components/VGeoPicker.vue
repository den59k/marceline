<template>
  <VFormControl outline>
    <slot name="start-adornment"></slot>
    <div ref="mapContainer" style="width: 100%; height: 400px;"></div>
    <slot name="end-adornment"></slot>
  </VFormControl>
</template>

<script lang="ts" setup>
import VFormControl from './VFormControl.vue';
import L, { LatLng, Marker, Polyline } from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps<{ initialLatLng?: string, type?: string, modelValue?: string }>()
const emit = defineEmits([ "update:modelValue" ])

const mapContainer = ref<HTMLDivElement>()

const getCoords = (coord: string) => {
  return coord.split(",").map(item => parseFloat(item)) as [number, number]
}

const markerRef = shallowRef<Marker | null>(null)

const routePolylineRef = shallowRef<Polyline | null>(null)
const routeMarkers: Marker[] = []

const updatePolyline = () => {
  const latLngs = routeMarkers.map(marker => marker.getLatLng());
  routePolylineRef.value?.setLatLngs(latLngs);
}

const updateModelValue = () => {
  emit("update:modelValue", routeMarkers.map(item => `${item.getLatLng().lat},${item.getLatLng().lng}`).join(";"))
}

let modelValue: string | null = null
onMounted(() => {

  const map = L.map(mapContainer.value!).setView(getCoords(props.initialLatLng ?? "55.76, 37.64"), 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  
  if (props.type === 'geoRoute') {
  
    const removeMarker = (marker: Marker) => {
      map.removeLayer(marker)
      const index = routeMarkers.indexOf(marker)
      if (index >= 0) {
        routeMarkers.splice(index, 1)
        updatePolyline()
      }
      updateModelValue()
    }

    const addPoint = (pos: LatLng | [number,number], index?: number) => {
      const marker = L.marker(pos, {  draggable: true }).addTo(map)
      if (typeof index === 'number') {
        routeMarkers.splice(index, 0, marker)
      } else { 
        routeMarkers.push(marker)
      }
      updatePolyline()
      marker.on("drag", () => updatePolyline())
      marker.on("dragend", () => updateModelValue())
      marker.on("click", () => {})
      marker.on("dblclick", () => {})
      marker.on("contextmenu", () => removeMarker(marker))

      return marker
    }

    routePolylineRef.value = L.polyline([], { color: '#DD4B40', weight: 5 }).addTo(map);

    routePolylineRef.value.on("click", (e) => {
      e.originalEvent.preventDefault()

      const latLngs = routePolylineRef.value!.getLatLngs() as LatLng[]

      let closestSegmentIndex = 0;
      let minDistance = Infinity;
      for (let i = 0; i < latLngs.length-1; i++) {
        const start = latLngs[i];
        const end = latLngs[i + 1];
        const distance = distanceToSegment(e.latlng, start, end);
        if (distance < minDistance) {
            minDistance = distance;
            closestSegmentIndex = i;
        }
      }

      addPoint(e.latlng, closestSegmentIndex+1)
      updateModelValue()
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.defaultPrevented) return
      addPoint(e.latlng)
      updateModelValue()
    });

    if (props.modelValue) {
      const points = props.modelValue.split(";")
      for (let point of points) {
        addPoint(getCoords(point))
      }
    }

  } else {
    const markerPosition = getCoords(props.modelValue ?? "55.76, 37.64")
    markerRef.value = L.marker(markerPosition).addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const coords = [e.latlng.lat, e.latlng.lng];
      markerRef.value!.setLatLng(e.latlng)
      modelValue = coords.join(",")
      emit("update:modelValue", modelValue)
      console.log('Coordinates:', coords.map(item => item.toFixed(3)).join(", ")); // Выводим в консоль
    });
  }
})

watch(() => props.modelValue, (value) => {
  if (value === modelValue || !value) return
  modelValue = value
  if (markerRef.value) {
    markerRef.value.setLatLng(getCoords(modelValue))
  }
})

</script>

<script lang="ts">
 // Функция для вычисления расстояния от точки до сегмента
 function distanceToSegment(point: LatLng, start: LatLng, end: LatLng) {
    const x = point.lng;
    const y = point.lat;
    const x1 = start.lng;
    const y1 = start.lat;
    const x2 = end.lng;
    const y2 = end.lat;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}
</script>

<style lang="sass">
.leaflet-container
  cursor: pointer
  border-radius: 6px

.leaflet-control-attribution
  display: none

</style>