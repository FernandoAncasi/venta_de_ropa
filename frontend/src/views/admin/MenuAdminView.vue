<script setup>
import { onMounted, ref } from 'vue'
import { prendas, ubicaciones, ventas } from '@/services/api'
import { sesion } from '@/stores/auth'
import { hoy, moneda } from '@/utils/formato'

// «menu» MenuAdmin
const resumen = ref({ activas: 0, unidades: 0, ventasHoy: 0, totalHoy: 0, ubicaciones: [] })

onMounted(async () => {
  const [lista, listaUbicaciones, deHoy] = await Promise.all([
    prendas.listar(),
    ubicaciones.listar(),
    ventas.listar({ desde: hoy(), hasta: hoy(), estado: 'vigente' })
  ])
  resumen.value = {
    activas: lista.filter((p) => p.activo).length,
    unidades: listaUbicaciones.reduce((n, u) => n + u.unidades, 0),
    ventasHoy: deHoy.length,
    totalHoy: deHoy.reduce((n, v) => n + v.total, 0),
    ubicaciones: listaUbicaciones
  }
})

const opciones = [
  { to: { name: 'venta-nueva' }, titulo: 'Nueva venta', texto: 'Registrar una venta en una tienda y emitir su comprobante.' },
  { to: { name: 'lista-ventas' }, titulo: 'Ventas', texto: 'Historial, detalle y anulación de ventas.' },
  { to: { name: 'lista-prendas' }, titulo: 'Prendas', texto: 'Buscar, registrar, editar y dar de baja prendas y sus variantes.' },
  { to: { name: 'lista-ubicaciones' }, titulo: 'Ubicaciones', texto: 'Tiendas y almacén: existencias y asignación de stock.' },
  { to: { name: 'reportes' }, titulo: 'Reportes', texto: 'Inventario, ventas, ganancias y más vendidas, con exportación a PDF.' }
]
</script>

<template>
  <section class="cabecera">
    <div>
      <h1>Hola, {{ sesion.usuario?.nombre }}</h1>
      <p class="muted">¿Qué quieres hacer hoy?</p>
    </div>
  </section>

  <section class="indicadores">
    <div class="tarjeta"><span class="muted pequeno">Ventas de hoy</span><strong>{{ resumen.ventasHoy }}</strong><span class="muted pequeno">{{ moneda(resumen.totalHoy) }}</span></div>
    <div class="tarjeta"><span class="muted pequeno">Prendas activas</span><strong>{{ resumen.activas }}</strong></div>
    <div class="tarjeta"><span class="muted pequeno">Unidades en total</span><strong>{{ resumen.unidades }}</strong></div>
    <RouterLink v-for="u in resumen.ubicaciones" :key="u.idUbicacion" :to="{ name: 'ubicacion', params: { id: u.idUbicacion } }" class="tarjeta enlace">
      <span class="muted pequeno">{{ u.nombre }}</span><strong>{{ u.unidades }} u.</strong>
    </RouterLink>
  </section>

  <section class="opciones">
    <RouterLink v-for="o in opciones" :key="o.titulo" :to="o.to" class="tarjeta opcion">
      <h2>{{ o.titulo }} →</h2>
      <p class="muted">{{ o.texto }}</p>
    </RouterLink>
  </section>
</template>

<style scoped>
.indicadores { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin-bottom: 24px; }
.indicadores .tarjeta { margin: 0; display: grid; gap: 2px; padding: 16px; align-content: start; }
.indicadores strong { font-size: 1.5rem; }
.enlace { text-decoration: none; }
.enlace:hover, .opcion:hover { border-color: var(--accent); }
.opciones { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.opcion { margin: 0 !important; text-decoration: none; transition: border-color 0.15s; }
.opcion p { margin: 0; }
</style>
