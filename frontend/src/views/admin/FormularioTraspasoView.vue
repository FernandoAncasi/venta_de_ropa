<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { prendas, stock, TIPOS_UBICACION, traspasos, ubicaciones } from '@/services/api'

// CU09 – Registrar traspaso. «process class» RegistrarTraspaso / página FormularioTraspaso.
// Puede ir del almacén a una tienda, entre tiendas o de una tienda al almacén.
const route = useRoute()
const router = useRouter()
const id = route.params.id

const prenda = ref(null)
const listaUbicaciones = ref([])
const filas = ref([])
const datos = reactive({ idVariante: '', idOrigen: '', idDestino: '', cantidad: 1 })
const error = ref('')
const enviando = ref(false)

onMounted(async () => {
  try {
    ;[prenda.value, listaUbicaciones.value, filas.value] = await Promise.all([
      prendas.obtener(id),
      ubicaciones.listar(),
      stock.porPrenda(id)
    ])
  } catch (e) {
    error.value = e.message
  }
})

const cantidadEn = (idUbicacion) =>
  filas.value.find((f) => f.idVariante === Number(datos.idVariante) && f.idUbicacion === Number(idUbicacion))?.cantidad ?? 0

const disponible = computed(() => cantidadEn(datos.idOrigen))
const mismaUbicacion = computed(() => datos.idOrigen && datos.idOrigen === datos.idDestino)

function etiqueta(u) {
  const base = `${u.nombre} (${TIPOS_UBICACION[u.tipo]})`
  return datos.idVariante ? `${base} · ${cantidadEn(u.idUbicacion)} u.` : base
}

async function confirmar() {
  error.value = ''
  enviando.value = true
  try {
    await traspasos.registrar(datos)
    router.push({ name: 'existencias-prenda', params: { id } })
  } catch (e) {
    error.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas">
        <RouterLink :to="{ name: 'lista-prendas' }">Prendas</RouterLink> /
        <RouterLink :to="{ name: 'existencias-prenda', params: { id } }">Existencias</RouterLink> / Traspaso
      </p>
      <h1>Registrar traspaso</h1>
      <p v-if="prenda" class="muted">{{ prenda.codigo }} · {{ prenda.nombre }}</p>
    </div>
  </section>

  <form v-if="prenda" class="tarjeta formulario caja" @submit.prevent="confirmar">
    <div v-if="error" class="aviso aviso-error">{{ error }}</div>

    <div class="campo">
      <label for="variante">Variante</label>
      <select id="variante" v-model="datos.idVariante" required>
        <option value="" disabled>Elige talla y color</option>
        <option v-for="v in prenda.variantes" :key="v.idVariante" :value="v.idVariante">{{ v.talla }} / {{ v.color }}</option>
      </select>
    </div>

    <div class="fila-campos">
      <div class="campo">
        <label for="origen">Ubicación de origen</label>
        <select id="origen" v-model="datos.idOrigen" required>
          <option value="" disabled>Elige</option>
          <option v-for="u in listaUbicaciones" :key="u.idUbicacion" :value="u.idUbicacion">{{ etiqueta(u) }}</option>
        </select>
        <span v-if="datos.idVariante && datos.idOrigen" class="ayuda">Disponible: {{ disponible }} unidad(es)</span>
      </div>
      <div class="campo">
        <label for="destino">Ubicación de destino</label>
        <select id="destino" v-model="datos.idDestino" required>
          <option value="" disabled>Elige</option>
          <option v-for="u in listaUbicaciones" :key="u.idUbicacion" :value="u.idUbicacion">{{ etiqueta(u) }}</option>
        </select>
        <span v-if="mismaUbicacion" class="ayuda" style="color: var(--error)">Debe ser distinta al origen.</span>
      </div>
    </div>

    <div class="campo">
      <label for="cantidad">Cantidad</label>
      <input id="cantidad" v-model.number="datos.cantidad" type="number" min="1" step="1" required />
    </div>

    <div class="acciones">
      <button class="btn btn-primario" type="submit" :disabled="enviando || mismaUbicacion">Confirmar</button>
      <RouterLink :to="{ name: 'existencias-prenda', params: { id } }" class="btn">Cancelar</RouterLink>
    </div>
  </form>
  <div v-else-if="error" class="aviso aviso-error">{{ error }}</div>
</template>

<style scoped>
.caja { max-width: 620px; }
</style>
