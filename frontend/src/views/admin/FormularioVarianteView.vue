<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { prendas, variantes } from '@/services/api'
import { COLORES, TALLAS } from '@/utils/formato'

// CU04 – Registrar variantes. «process class» RegistrarVariante / página FormularioVariante.
const route = useRoute()
const id = route.params.id

const prenda = ref(null)
const nueva = reactive({ talla: '', color: '' })
const error = ref('')
const exito = ref(route.query.nueva ? 'Prenda registrada. Ahora agrega sus tallas y colores.' : '')

async function cargar() {
  prenda.value = await prendas.obtener(id)
}

async function agregar() {
  error.value = ''
  exito.value = ''
  try {
    await variantes.crear({ idPrenda: id, ...nueva })
    exito.value = `Variante ${nueva.talla} / ${nueva.color} agregada.`
    nueva.color = ''
    cargar()
  } catch (e) {
    error.value = e.message
  }
}

async function quitar(v) {
  error.value = ''
  exito.value = ''
  if (!confirm(`¿Quitar la variante ${v.talla} / ${v.color}?`)) return
  try {
    await variantes.eliminar(v.idVariante)
    cargar()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(() => cargar().catch((e) => (error.value = e.message)))
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-prendas' }">Prendas</RouterLink> / Variantes</p>
      <h1>Variantes{{ prenda ? ` de ${prenda.nombre}` : '' }}</h1>
      <p v-if="prenda" class="muted">{{ prenda.codigo }} · {{ prenda.categoria }}</p>
    </div>
    <div class="acciones" v-if="prenda">
      <RouterLink :to="{ name: 'prenda-editar', params: { id } }" class="btn">Editar prenda</RouterLink>
      <RouterLink :to="{ name: 'existencias-prenda', params: { id } }" class="btn">Ver existencias</RouterLink>
    </div>
  </section>

  <div v-if="error" class="aviso aviso-error" style="margin-bottom: 14px">{{ error }}</div>
  <div v-if="exito" class="aviso aviso-ok" style="margin-bottom: 14px">{{ exito }}</div>

  <div class="columnas" v-if="prenda">
    <form class="tarjeta formulario" @submit.prevent="agregar">
      <h2>Nueva variante</h2>
      <div class="campo">
        <label for="talla">Talla</label>
        <select id="talla" v-model="nueva.talla" required>
          <option value="" disabled>Elige</option>
          <option v-for="t in TALLAS" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="campo">
        <label for="color">Color</label>
        <select id="color" v-model="nueva.color" required>
          <option value="" disabled>Elige</option>
          <option v-for="c in COLORES" :key="c">{{ c }}</option>
        </select>
      </div>
      <button class="btn btn-primario" type="submit">Agregar</button>
    </form>

    <div class="tarjeta">
      <h2>Variantes registradas ({{ prenda.variantes.length }})</h2>
      <p v-if="!prenda.variantes.length" class="vacio">Esta prenda todavía no tiene variantes.</p>
      <table v-else>
        <thead><tr><th>Talla</th><th>Color</th><th></th></tr></thead>
        <tbody>
          <tr v-for="v in prenda.variantes" :key="v.idVariante">
            <td>{{ v.talla }}</td>
            <td>{{ v.color }}</td>
            <td class="num"><button class="btn btn-chico btn-peligro" @click="quitar(v)">Quitar</button></td>
          </tr>
        </tbody>
      </table>
      <p class="muted pequeno" style="margin-top: 12px">
        Para cargar unidades, ve a <RouterLink :to="{ name: 'lista-ubicaciones' }">Ubicaciones</RouterLink> y asigna stock.
      </p>
    </div>
  </div>
</template>

<style scoped>
.columnas { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; align-items: start; }
.columnas .tarjeta { margin: 0; }
@media (max-width: 760px) {
  .columnas { grid-template-columns: 1fr; }
}
</style>
