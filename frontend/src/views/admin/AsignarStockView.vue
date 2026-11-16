<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { prendas, stock, TIPOS_UBICACION, ubicaciones } from '@/services/api'

// CU07 – Asignar stock a ubicación. «process class» AsignarStock.
const route = useRoute()

const listaPrendas = ref([])
const listaUbicaciones = ref([])
const prenda = ref(null)
const stockPrenda = ref([])
const datos = reactive({
  idPrenda: route.query.prenda ? Number(route.query.prenda) : '',
  idVariante: route.query.variante ? Number(route.query.variante) : '',
  idUbicacion: Number(route.params.id),
  cantidad: ''
})
const error = ref('')
const exito = ref('')

const ubicacion = computed(() => listaUbicaciones.value.find((u) => u.idUbicacion === Number(datos.idUbicacion)))
const actual = computed(
  () => stockPrenda.value.find((s) => s.idVariante === Number(datos.idVariante) && s.idUbicacion === Number(datos.idUbicacion))?.cantidad ?? 0
)

async function cargarPrenda() {
  if (!datos.idPrenda) {
    prenda.value = null
    stockPrenda.value = []
    return
  }
  ;[prenda.value, stockPrenda.value] = await Promise.all([prendas.obtener(datos.idPrenda), stock.porPrenda(datos.idPrenda)])
}

watch(
  () => datos.idPrenda,
  () => {
    datos.idVariante = ''
    cargarPrenda()
  }
)

// Al elegir variante se propone la cantidad actual para editarla
watch([() => datos.idVariante, () => datos.idUbicacion], () => {
  if (datos.idVariante) datos.cantidad = actual.value
})

onMounted(async () => {
  ;[listaPrendas.value, listaUbicaciones.value] = await Promise.all([prendas.listar(), ubicaciones.listar()])
  await cargarPrenda()
  if (datos.idVariante) datos.cantidad = actual.value
})

async function guardar() {
  error.value = ''
  exito.value = ''
  try {
    await stock.asignar(datos)
    const v = prenda.value.variantes.find((x) => x.idVariante === Number(datos.idVariante))
    exito.value = `${prenda.value.nombre} ${v.talla}/${v.color}: ahora hay ${datos.cantidad} unidad(es) en ${ubicacion.value.nombre}.`
    stockPrenda.value = await stock.porPrenda(datos.idPrenda)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas">
        <RouterLink :to="{ name: 'lista-ubicaciones' }">Ubicaciones</RouterLink> /
        <RouterLink :to="{ name: 'ubicacion', params: { id: route.params.id } }">{{ ubicacion?.nombre ?? 'Ubicación' }}</RouterLink> / Asignar stock
      </p>
      <h1>Asignar stock</h1>
      <p class="muted">Define cuántas unidades de cada talla y color hay en la ubicación.</p>
    </div>
  </section>

  <form class="tarjeta formulario caja" @submit.prevent="guardar">
    <div v-if="error" class="aviso aviso-error">{{ error }}</div>
    <div v-if="exito" class="aviso aviso-ok">{{ exito }}</div>

    <div class="campo">
      <label for="prenda">Prenda</label>
      <select id="prenda" v-model="datos.idPrenda" required>
        <option value="" disabled>Elige una prenda</option>
        <option v-for="p in listaPrendas.filter((x) => x.activo)" :key="p.idPrenda" :value="p.idPrenda">{{ p.codigo }} · {{ p.nombre }}</option>
      </select>
    </div>

    <div class="fila-campos">
      <div class="campo">
        <label for="variante">Variante</label>
        <select id="variante" v-model="datos.idVariante" required :disabled="!prenda">
          <option value="" disabled>Talla / color</option>
          <option v-for="v in prenda?.variantes ?? []" :key="v.idVariante" :value="v.idVariante">{{ v.talla }} / {{ v.color }}</option>
        </select>
        <span v-if="prenda && !prenda.variantes.length" class="ayuda">
          Sin variantes. <RouterLink :to="{ name: 'variantes', params: { id: prenda.idPrenda } }">Agregar</RouterLink>
        </span>
      </div>
      <div class="campo">
        <label for="ubicacion">Ubicación</label>
        <select id="ubicacion" v-model="datos.idUbicacion" required>
          <option v-for="u in listaUbicaciones" :key="u.idUbicacion" :value="u.idUbicacion">{{ u.nombre }} ({{ TIPOS_UBICACION[u.tipo] }})</option>
        </select>
      </div>
    </div>

    <div class="campo">
      <label for="cantidad">Cantidad</label>
      <input id="cantidad" v-model="datos.cantidad" type="number" min="0" step="1" required />
      <span v-if="datos.idVariante" class="ayuda">Cantidad actual en {{ ubicacion?.nombre }}: {{ actual }}</span>
    </div>

    <div class="acciones">
      <button class="btn btn-primario" type="submit">Guardar</button>
      <RouterLink :to="{ name: 'ubicacion', params: { id: route.params.id } }" class="btn">Volver</RouterLink>
    </div>
  </form>
</template>

<style scoped>
.caja { max-width: 600px; }
</style>
