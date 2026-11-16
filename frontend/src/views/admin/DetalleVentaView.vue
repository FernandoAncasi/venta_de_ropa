<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ventas } from '@/services/api'
import { fecha, moneda } from '@/utils/formato'

// CU15 – Detalle de venta. «navigation class» Venta → AnularVenta / EmitirComprobante.
const route = useRoute()
const venta = ref(null)
const error = ref('')
const mensaje = ref('')

async function cargar() {
  try {
    venta.value = await ventas.obtener(route.params.id)
  } catch (e) {
    error.value = e.message
  }
}

// CU16 – Anular venta
async function anular() {
  error.value = ''
  if (!confirm(`¿Anular la venta #${venta.value.idVenta}? Las unidades vuelven al stock de ${venta.value.tienda}.`)) return
  try {
    await ventas.anular(venta.value.idVenta)
    mensaje.value = 'Venta anulada. Las unidades se devolvieron al stock de la tienda.'
    cargar()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-ventas' }">Ventas</RouterLink> / Detalle</p>
      <h1>Venta #{{ route.params.id }}</h1>
      <p v-if="venta" class="muted">
        <span class="chip" :class="venta.estado === 'vigente' ? 'chip-ok' : 'chip-error'">{{ venta.estado === 'vigente' ? 'Vigente' : 'Anulada' }}</span>
        {{ fecha(venta.fecha) }} · {{ venta.tienda }}
      </p>
    </div>
    <div v-if="venta" class="acciones">
      <RouterLink :to="{ name: 'comprobante', params: { id: venta.idVenta } }" class="btn">Imprimir comprobante</RouterLink>
      <button v-if="venta.estado === 'vigente'" class="btn btn-peligro" @click="anular">Anular venta</button>
    </div>
  </section>

  <div v-if="error" class="aviso aviso-error" style="margin-bottom: 14px">{{ error }}</div>
  <div v-if="mensaje" class="aviso aviso-ok" style="margin-bottom: 14px">{{ mensaje }}</div>

  <div v-if="venta" class="tarjeta">
    <div class="datos">
      <div><span class="muted pequeno">Tienda</span><strong>{{ venta.tienda }}</strong></div>
      <div><span class="muted pequeno">Fecha</span><strong>{{ fecha(venta.fecha) }}</strong></div>
      <div><span class="muted pequeno">Registrada por</span><strong>{{ venta.usuario }}</strong></div>
      <div><span class="muted pequeno">Total</span><strong>{{ moneda(venta.total) }}</strong></div>
    </div>

    <div class="tabla-envoltura">
      <table>
        <thead>
          <tr><th>Código</th><th>Prenda</th><th>Variante</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Subtotal</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in venta.detalles" :key="d.idDetalle">
            <td>{{ d.codigo }}</td>
            <td>{{ d.prenda }}</td>
            <td>{{ d.talla }} / {{ d.color }}</td>
            <td class="num">{{ d.cantidad }}</td>
            <td class="num">{{ moneda(d.precioUnitario) }}</td>
            <td class="num">{{ moneda(d.subtotal) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td colspan="5" class="num"><strong>Total</strong></td><td class="num"><strong>{{ moneda(venta.total) }}</strong></td></tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.datos { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 18px; }
.datos div { display: grid; }
tfoot td { border-top: 2px solid var(--border); border-bottom: none; }
</style>
