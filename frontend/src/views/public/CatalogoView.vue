<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogo } from '@/services/api'
import { moneda } from '@/utils/formato'

// CU12 – Ver catálogo. «query» FiltrarCatalogo + «index» CatalogoPrendas.
const route = useRoute()
const router = useRouter()

const opciones = ref({ categorias: [], tallas: [], colores: [] })
const filtros = reactive({
  idCategoria: route.query.categoria ?? '',
  talla: route.query.talla ?? '',
  color: route.query.color ?? ''
})
const lista = ref([])
const cargando = ref(true)

async function filtrar() {
  cargando.value = true
  router.replace({
    query: {
      ...(filtros.idCategoria && { categoria: filtros.idCategoria }),
      ...(filtros.talla && { talla: filtros.talla }),
      ...(filtros.color && { color: filtros.color })
    }
  })
  lista.value = await catalogo.listar(filtros)
  cargando.value = false
}

function limpiar() {
  Object.assign(filtros, { idCategoria: '', talla: '', color: '' })
  filtrar()
}

onMounted(async () => {
  opciones.value = await catalogo.filtros()
  filtrar()
})
</script>

<template>
  <section class="cabecera">
    <div>
      <h1>Catálogo</h1>
      <p class="muted">Mira nuestras prendas y en qué tienda las encuentras.</p>
    </div>
  </section>

  <!-- «presentation group» Filtros -->
  <form class="tarjeta filtros" @submit.prevent="filtrar">
    <div class="campo">
      <label for="f-cat">Categoría</label>
      <select id="f-cat" v-model="filtros.idCategoria">
        <option value="">Todas</option>
        <option v-for="c in opciones.categorias" :key="c.idCategoria" :value="c.idCategoria">{{ c.nombre }}</option>
      </select>
    </div>
    <div class="campo">
      <label for="f-talla">Talla</label>
      <select id="f-talla" v-model="filtros.talla">
        <option value="">Todas</option>
        <option v-for="t in opciones.tallas" :key="t">{{ t }}</option>
      </select>
    </div>
    <div class="campo">
      <label for="f-color">Color</label>
      <select id="f-color" v-model="filtros.color">
        <option value="">Todos</option>
        <option v-for="c in opciones.colores" :key="c">{{ c }}</option>
      </select>
    </div>
    <div class="acciones">
      <button class="btn btn-primario" type="submit">Filtrar</button>
      <button class="btn" type="button" @click="limpiar">Limpiar</button>
    </div>
  </form>

  <!-- «presentation group» ListaPrendas -->
  <p v-if="cargando" class="vacio">Cargando prendas…</p>
  <p v-else-if="!lista.length" class="vacio">Ninguna prenda coincide con el filtro. Prueba con otra combinación.</p>
  <section v-else class="grilla">
    <RouterLink v-for="p in lista" :key="p.idPrenda" :to="{ name: 'detalle-prenda', params: { id: p.idPrenda } }" class="producto">
      <img :src="p.imagen" :alt="p.nombre" />
      <div class="info">
        <span class="muted pequeno">{{ p.categoria }}</span>
        <h3>{{ p.nombre }}</h3>
        <strong class="precio">{{ moneda(p.precioVenta) }}</strong>
        <span class="muted pequeno">Tallas {{ p.tallas.join(', ') }} · {{ p.colores.join(', ') }}</span>
        <span class="ver">Ver detalle →</span>
      </div>
    </RouterLink>
  </section>
</template>

<style scoped>
.filtros { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr) auto; align-items: end; margin-bottom: 24px; }
.grilla { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.producto {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  overflow: hidden; text-decoration: none; display: flex; flex-direction: column;
  transition: transform 0.15s, box-shadow 0.15s;
}
.producto:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.producto img { aspect-ratio: 1; object-fit: cover; width: 100%; background: var(--surface-2); }
.info { padding: 14px; display: grid; gap: 4px; }
.info h3 { font-size: 1rem; margin: 0; }
.precio { font-size: 1.05rem; }
.ver { color: var(--accent); font-size: 0.85rem; font-weight: 600; margin-top: 4px; }

@media (max-width: 760px) {
  .filtros { grid-template-columns: 1fr 1fr; }
  .filtros .acciones { grid-column: 1 / -1; }
  .grilla { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
@media (max-width: 330px) {
  .grilla { grid-template-columns: 1fr; }
}
</style>
