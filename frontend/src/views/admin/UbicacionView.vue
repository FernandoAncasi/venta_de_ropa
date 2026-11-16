<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { stock, TIPOS_UBICACION, ubicaciones } from '@/services/api'

// «navigation class» Ubicacion
const route = useRoute()
const id = route.params.id

const ubicacion = ref(null)
const filas = ref([])
const filtro = ref('')
const error = ref('')

onMounted(async () => {
  try {
    ;[ubicacion.value, filas.value] = await Promise.all([ubicaciones.obtener(id), stock.porUbicacion(id)])
  } catch (e) {
    error.value = e.message
  }
})

const visibles = computed(() => {
  const t = filtro.value.trim().toLowerCase()
  return filas.value
    .filter((f) => !t || [f.codigo, f.prenda, f.talla, f.color].join(' ').toLowerCase().includes(t))
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
})

const total = computed(() => filas.value.reduce((n, f) => n + f.cantidad, 0))
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-ubicaciones' }">Ubicaciones</RouterLink> / {{ ubicacion?.nombre }}</p>
      <h1>{{ ubicacion?.nombre }}</h1>
      <p class="muted" v-if="ubicacion">
        <span class="chip" :class="{ 'chip-ok': ubicacion.tipo === 'tienda' }">{{ TIPOS_UBICACION[ubicacion.tipo] }}</span>
        {{ ubicacion.direccion }} · {{ total }} unidades
      </p>
    </div>
    <RouterLink :to="{ name: 'asignar-stock', params: { id } }" class="btn btn-primario">Asignar stock</RouterLink>
  </section>

  <div v-if="error" class="aviso aviso-error">{{ error }}</div>

  <div v-else class="tarjeta">
    <input v-model="filtro" type="search" placeholder="Filtrar por código, prenda, talla o color" style="margin-bottom: 14px" />
    <p v-if="!visibles.length" class="vacio">No hay stock registrado en esta ubicación.</p>
    <div v-else class="tabla-envoltura">
      <table>
        <thead>
          <tr><th>Código</th><th>Prenda</th><th>Talla</th><th>Color</th><th class="num">Unidades</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="f in visibles" :key="f.idStock">
            <td><strong>{{ f.codigo }}</strong></td>
            <td>{{ f.prenda }}</td>
            <td>{{ f.talla }}</td>
            <td>{{ f.color }}</td>
            <td class="num" :class="{ muted: !f.cantidad }">{{ f.cantidad }}</td>
            <td class="num">
              <RouterLink
                :to="{ name: 'asignar-stock', params: { id }, query: { prenda: f.idPrenda, variante: f.idVariante } }"
                class="btn btn-chico"
              >Ajustar</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
