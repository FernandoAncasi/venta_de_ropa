<script setup>
import { computed, onMounted, ref } from 'vue'
import { prendas } from '@/services/api'
import { moneda } from '@/utils/formato'

// CU05 – Buscar prendas. «query» BuscarPrenda → «index» ListaPrendas.
const busqueda = ref('')
const estado = ref('activas')
const lista = ref([])
const cargando = ref(true)
const mensaje = ref('')

let temporizador
function buscarConPausa() {
  clearTimeout(temporizador)
  temporizador = setTimeout(cargar, 250)
}

async function cargar() {
  cargando.value = true
  lista.value = await prendas.listar({ q: busqueda.value })
  cargando.value = false
}

const visibles = computed(() =>
  lista.value.filter((p) => estado.value === 'todas' || (estado.value === 'activas') === p.activo)
)

// RF07 – Dar de baja (desactivar) o reactivar
async function cambiarEstado(p) {
  const accion = p.activo ? 'dar de baja' : 'reactivar'
  if (!confirm(`¿Seguro que quieres ${accion} "${p.nombre}"?`)) return
  await prendas.cambiarEstado(p.idPrenda, !p.activo)
  mensaje.value = p.activo ? `"${p.nombre}" se dio de baja y ya no aparece en el catálogo.` : `"${p.nombre}" está activa otra vez.`
  cargar()
}

onMounted(cargar)
</script>

<template>
  <section class="cabecera">
    <div>
      <h1>Prendas</h1>
      <p class="muted">Busca por código, nombre, categoría, talla o color.</p>
    </div>
    <RouterLink :to="{ name: 'prenda-nueva' }" class="btn btn-primario">+ Nueva prenda</RouterLink>
  </section>

  <div class="tarjeta">
    <div class="barra-busqueda">
      <input v-model="busqueda" type="search" placeholder="Ej.: POL-001, jean, M, Negro…" @input="buscarConPausa" />
      <select v-model="estado">
        <option value="activas">Activas</option>
        <option value="bajas">Dadas de baja</option>
        <option value="todas">Todas</option>
      </select>
    </div>

    <div v-if="mensaje" class="aviso aviso-ok" style="margin-top: 14px">{{ mensaje }}</div>

    <p v-if="cargando" class="vacio">Buscando…</p>
    <p v-else-if="!visibles.length" class="vacio">No se encontraron prendas.</p>
    <div v-else class="tabla-envoltura" style="margin-top: 14px">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Código</th>
            <th>Nombre</th>
            <th class="ocultar-movil">Categoría</th>
            <th class="num ocultar-movil">P. compra</th>
            <th class="num">P. venta</th>
            <th class="num">Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in visibles" :key="p.idPrenda">
            <td><img :src="p.imagen" :alt="p.nombre" class="miniatura" /></td>
            <td><strong>{{ p.codigo }}</strong></td>
            <td>{{ p.nombre }}<div class="muted pequeno">{{ p.variantes }} variante(s)</div></td>
            <td class="ocultar-movil">{{ p.categoria }}</td>
            <td class="num ocultar-movil">{{ moneda(p.precioCompra) }}</td>
            <td class="num">{{ moneda(p.precioVenta) }}</td>
            <td class="num">{{ p.unidades }}</td>
            <td>
              <span class="chip" :class="p.activo ? 'chip-ok' : 'chip-error'">{{ p.activo ? 'Activa' : 'De baja' }}</span>
            </td>
            <td>
              <div class="acciones">
                <RouterLink :to="{ name: 'prenda-editar', params: { id: p.idPrenda } }" class="btn btn-chico">Editar</RouterLink>
                <RouterLink :to="{ name: 'variantes', params: { id: p.idPrenda } }" class="btn btn-chico">Variantes</RouterLink>
                <RouterLink :to="{ name: 'existencias-prenda', params: { id: p.idPrenda } }" class="btn btn-chico">Ver existencias</RouterLink>
                <button class="btn btn-chico" :class="{ 'btn-peligro': p.activo }" @click="cambiarEstado(p)">
                  {{ p.activo ? 'Dar de baja' : 'Reactivar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.barra-busqueda { display: grid; grid-template-columns: 1fr 180px; gap: 10px; }
.miniatura { width: 44px; min-width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); }
td .acciones { flex-wrap: nowrap; }
@media (max-width: 640px) {
  .barra-busqueda { grid-template-columns: 1fr; }
}
</style>
