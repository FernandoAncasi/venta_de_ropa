<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { prendas, stock, TIPOS_UBICACION, traspasos, ubicaciones } from '@/services/api'
import { fecha } from '@/utils/formato'

// CU08 – Consultar existencias. «index» ExistenciasPrenda.
const route = useRoute()
const id = route.params.id

const prenda = ref(null)
const listaUbicaciones = ref([])
const filas = ref([])
const historial = ref([])
const error = ref('')

onMounted(async () => {
  try {
    ;[prenda.value, listaUbicaciones.value, filas.value, historial.value] = await Promise.all([
      prendas.obtener(id),
      ubicaciones.listar(),
      stock.porPrenda(id),
      traspasos.listarPorPrenda(id)
    ])
  } catch (e) {
    error.value = e.message
  }
})

// Matriz variante × ubicación
const matriz = computed(() =>
  (prenda.value?.variantes ?? []).map((v) => {
    const porUbicacion = listaUbicaciones.value.map(
      (u) => filas.value.find((f) => f.idVariante === v.idVariante && f.idUbicacion === u.idUbicacion)?.cantidad ?? 0
    )
    return { ...v, porUbicacion, total: porUbicacion.reduce((a, b) => a + b, 0) }
  })
)

const totalesUbicacion = computed(() =>
  listaUbicaciones.value.map((_, i) => matriz.value.reduce((n, v) => n + v.porUbicacion[i], 0))
)
const totalGeneral = computed(() => totalesUbicacion.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-prendas' }">Prendas</RouterLink> / Existencias</p>
      <h1>Existencias{{ prenda ? ` de ${prenda.nombre}` : '' }}</h1>
      <p v-if="prenda" class="muted">{{ prenda.codigo }} · unidades por talla, color y ubicación</p>
    </div>
    <RouterLink v-if="prenda" :to="{ name: 'traspaso', params: { id } }" class="btn btn-primario">Registrar traspaso</RouterLink>
  </section>

  <div v-if="error" class="aviso aviso-error">{{ error }}</div>

  <template v-if="prenda">
    <div class="resumen">
      <div class="tarjeta total">
        <span class="muted pequeno">Total</span>
        <strong>{{ totalGeneral }} u.</strong>
        <span class="muted pequeno">en {{ listaUbicaciones.length }} ubicaciones</span>
      </div>
      <div v-for="(u, i) in listaUbicaciones" :key="u.idUbicacion" class="tarjeta">
        <span class="muted pequeno">{{ u.nombre }}</span>
        <strong>{{ totalesUbicacion[i] }} u.</strong>
        <span class="chip" :class="{ 'chip-ok': u.tipo === 'tienda' }" style="justify-self: start">{{ TIPOS_UBICACION[u.tipo] }}</span>
      </div>
    </div>

    <div class="tarjeta">
      <p v-if="!matriz.length" class="vacio">
        La prenda no tiene variantes. <RouterLink :to="{ name: 'variantes', params: { id } }">Agregar variantes</RouterLink>
      </p>
      <div v-else class="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th>Talla</th>
              <th>Color</th>
              <th v-for="u in listaUbicaciones" :key="u.idUbicacion" class="num">{{ u.nombre }}</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in matriz" :key="v.idVariante">
              <td>{{ v.talla }}</td>
              <td>{{ v.color }}</td>
              <td v-for="(c, i) in v.porUbicacion" :key="i" class="num" :class="{ muted: !c }">{{ c }}</td>
              <td class="num"><strong>{{ v.total }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Historial de traspasos</h2>
      <p v-if="!historial.length" class="muted">Sin traspasos registrados.</p>
      <div v-else class="tabla-envoltura">
        <table>
          <thead><tr><th>Fecha</th><th>Variante</th><th>Origen</th><th>Destino</th><th class="num">Cantidad</th></tr></thead>
          <tbody>
            <tr v-for="t in historial" :key="t.idTraspaso">
              <td>{{ fecha(t.fecha) }}</td>
              <td>{{ t.talla }} / {{ t.color }}</td>
              <td>{{ t.origen }}</td>
              <td>{{ t.destino }}</td>
              <td class="num">{{ t.cantidad }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>

<style scoped>
.resumen { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 16px; }
.resumen .tarjeta { margin: 0; display: grid; gap: 2px; padding: 16px; }
.resumen strong { font-size: 1.4rem; }
.resumen .total { background: var(--primary); color: var(--primary-text); border-color: var(--primary); }
.resumen .total .muted { color: rgba(255, 255, 255, 0.7); }
</style>
