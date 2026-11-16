<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ubicaciones, ventas } from '@/services/api'
import { fecha, moneda } from '@/utils/formato'

// CU15 – Consultar ventas (historial). «index» ListaVentas.
const tiendas = ref([])
const filtros = reactive({ idUbicacion: '', desde: '', hasta: '', estado: '' })
const lista = ref([])
const cargando = ref(true)
const error = ref('')

async function buscar() {
  error.value = ''
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    error.value = 'La fecha "desde" no puede ser posterior a "hasta".'
    return
  }
  cargando.value = true
  lista.value = await ventas.listar(filtros)
  cargando.value = false
}

function limpiar() {
  Object.assign(filtros, { idUbicacion: '', desde: '', hasta: '', estado: '' })
  buscar()
}

const vigentes = computed(() => lista.value.filter((v) => v.estado === 'vigente'))
const totalVigente = computed(() => vigentes.value.reduce((n, v) => n + v.total, 0))

onMounted(async () => {
  tiendas.value = await ubicaciones.listar({ tipo: 'tienda' })
  buscar()
})
</script>

<template>
  <section class="cabecera">
    <div>
      <h1>Ventas</h1>
      <p class="muted">Historial de ventas de las tiendas.</p>
    </div>
    <RouterLink :to="{ name: 'venta-nueva' }" class="btn btn-primario">+ Nueva venta</RouterLink>
  </section>

  <form class="tarjeta filtros" @submit.prevent="buscar">
    <div class="campo">
      <label for="v-tienda">Tienda</label>
      <select id="v-tienda" v-model="filtros.idUbicacion">
        <option value="">Todas</option>
        <option v-for="t in tiendas" :key="t.idUbicacion" :value="t.idUbicacion">{{ t.nombre }}</option>
      </select>
    </div>
    <div class="campo">
      <label for="v-desde">Desde</label>
      <input id="v-desde" v-model="filtros.desde" type="date" />
    </div>
    <div class="campo">
      <label for="v-hasta">Hasta</label>
      <input id="v-hasta" v-model="filtros.hasta" type="date" />
    </div>
    <div class="campo">
      <label for="v-estado">Estado</label>
      <select id="v-estado" v-model="filtros.estado">
        <option value="">Todos</option>
        <option value="vigente">Vigente</option>
        <option value="anulada">Anulada</option>
      </select>
    </div>
    <div class="acciones">
      <button class="btn btn-primario" type="submit">Filtrar</button>
      <button class="btn" type="button" @click="limpiar">Limpiar</button>
    </div>
  </form>

  <div v-if="error" class="aviso aviso-error" style="margin-top: 16px">{{ error }}</div>

  <div class="tarjeta" style="margin-top: 16px">
    <div class="resumen-lista">
      <span class="muted pequeno">{{ lista.length }} venta(s) · {{ vigentes.length }} vigente(s)</span>
      <strong>Total vigente: {{ moneda(totalVigente) }}</strong>
    </div>

    <p v-if="cargando" class="vacio">Cargando…</p>
    <p v-else-if="!lista.length" class="vacio">No hay ventas para los filtros elegidos.</p>
    <div v-else class="tabla-envoltura">
      <table>
        <thead>
          <tr>
            <th>N.º</th><th>Fecha</th><th>Tienda</th><th class="num">Unidades</th><th class="num">Total</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in lista" :key="v.idVenta" :class="{ anulada: v.estado === 'anulada' }">
            <td><strong>#{{ v.idVenta }}</strong></td>
            <td>{{ fecha(v.fecha) }}</td>
            <td>{{ v.tienda }}</td>
            <td class="num">{{ v.unidades }}</td>
            <td class="num">{{ moneda(v.total) }}</td>
            <td>
              <span class="chip" :class="v.estado === 'vigente' ? 'chip-ok' : 'chip-error'">{{ v.estado === 'vigente' ? 'Vigente' : 'Anulada' }}</span>
            </td>
            <td class="num"><RouterLink :to="{ name: 'venta', params: { id: v.idVenta } }" class="btn btn-chico">Ver detalle</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.filtros { display: grid; gap: 14px; grid-template-columns: repeat(4, 1fr) auto; align-items: end; }
.resumen-lista { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
tr.anulada td:not(:last-child):not(:nth-last-child(2)) { color: var(--muted); text-decoration: line-through; }
@media (max-width: 900px) {
  .filtros { grid-template-columns: 1fr 1fr; }
  .filtros .acciones { grid-column: 1 / -1; }
}
</style>
