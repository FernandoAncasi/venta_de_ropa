<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { catalogo } from '@/services/api'
import { moneda } from '@/utils/formato'

// CU13 – Ver detalle de prenda. «navigation class» Prenda → «index» DisponibilidadTiendas → Tienda.
const route = useRoute()
const prenda = ref(null)
const error = ref('')

watchEffect(async () => {
  error.value = ''
  prenda.value = null
  try {
    prenda.value = await catalogo.detalle(route.params.id)
  } catch (e) {
    error.value = e.message
  }
})
</script>

<template>
  <p class="migas" style="margin-top: 20px"><RouterLink to="/">← Volver al catálogo</RouterLink></p>

  <div v-if="error" class="vacio">{{ error }}</div>
  <p v-else-if="!prenda" class="vacio">Cargando…</p>

  <article v-else class="detalle">
    <img :src="prenda.imagen" :alt="prenda.nombre" class="foto" />

    <div class="datos">
      <span class="chip">{{ prenda.categoria }}</span>
      <h1>{{ prenda.nombre }}</h1>
      <p class="precio">{{ moneda(prenda.precioVenta) }}</p>
      <p>{{ prenda.descripcion }}</p>

      <div class="grupo">
        <h3>Tallas</h3>
        <div class="chips"><span v-for="t in prenda.tallas" :key="t" class="chip">{{ t }}</span></div>
      </div>
      <div class="grupo">
        <h3>Colores</h3>
        <div class="chips"><span v-for="c in prenda.colores" :key="c" class="chip">{{ c }}</span></div>
      </div>

      <!-- «presentation group» disponibilidad por tienda -->
      <div class="grupo">
        <h3>¿Dónde la encuentro?</h3>
        <p v-if="!prenda.disponibilidad.length" class="muted">Por ahora no hay unidades disponibles en tienda.</p>
        <ul v-else class="tiendas">
          <li v-for="t in prenda.disponibilidad" :key="t.idUbicacion" class="tarjeta">
            <strong>{{ t.nombre }}</strong>
            <span class="muted pequeno">{{ t.direccion }}</span>
            <div class="chips">
              <span v-for="v in t.variantes" :key="v.talla + v.color" class="chip chip-ok">{{ v.talla }} · {{ v.color }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.detalle { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 36px; margin-top: 8px; }
.foto { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface-2); }
.datos h1 { margin-top: 10px; }
.precio { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
.grupo { margin-top: 20px; }
.grupo h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
.tiendas { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.tiendas .tarjeta { display: grid; gap: 6px; padding: 14px; margin: 0; }

@media (max-width: 760px) {
  .detalle { grid-template-columns: 1fr; gap: 20px; }
}
</style>
