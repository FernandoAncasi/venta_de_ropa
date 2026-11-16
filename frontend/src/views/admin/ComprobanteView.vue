<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ventas } from '@/services/api'
import { fecha, moneda } from '@/utils/formato'

// CU17 – Emitir comprobante. «process class» EmitirComprobante: generarComprobante() e imprimir().
const route = useRoute()
const venta = ref(null)
const error = ref('')

onMounted(async () => {
  try {
    venta.value = await ventas.obtener(route.params.id)
  } catch (e) {
    error.value = e.message
  }
})

const imprimir = () => window.print()
</script>

<template>
  <div class="pantalla">
    <div class="barra no-imprimir">
      <RouterLink :to="{ name: 'venta', params: { id: route.params.id } }" class="btn">← Ver venta</RouterLink>
      <RouterLink :to="{ name: 'venta-nueva' }" class="btn">Nueva venta</RouterLink>
      <button class="btn btn-primario" :disabled="!venta" @click="imprimir">Imprimir</button>
    </div>

    <div v-if="route.query.nueva && venta" class="aviso aviso-ok no-imprimir">Venta registrada y stock descontado.</div>
    <div v-if="error" class="aviso aviso-error">{{ error }}</div>

    <article v-if="venta" class="comprobante">
      <header>
        <h1>Comprobante de venta</h1>
        <p class="numero">N.º {{ String(venta.idVenta).padStart(6, '0') }}</p>
        <p v-if="venta.estado === 'anulada'" class="sello">ANULADA</p>
      </header>

      <dl>
        <div><dt>Tienda</dt><dd>{{ venta.tienda }}</dd></div>
        <div><dt>Dirección</dt><dd>{{ venta.direccion }}</dd></div>
        <div><dt>Fecha</dt><dd>{{ fecha(venta.fecha) }}</dd></div>
        <div><dt>Atendido por</dt><dd>{{ venta.usuario }}</dd></div>
      </dl>

      <table>
        <thead>
          <tr><th>Descripción</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Importe</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in venta.detalles" :key="d.idDetalle">
            <td>{{ d.prenda }} <span class="muted">{{ d.talla }}/{{ d.color }}</span></td>
            <td class="num">{{ d.cantidad }}</td>
            <td class="num">{{ moneda(d.precioUnitario) }}</td>
            <td class="num">{{ moneda(d.subtotal) }}</td>
          </tr>
        </tbody>
      </table>

      <p class="total"><span>Total</span><strong>{{ moneda(venta.total) }}</strong></p>
      <p class="gracias">¡Gracias por su compra!</p>
    </article>
  </div>
</template>

<style scoped>
.pantalla { max-width: 520px; margin: 0 auto; padding: 24px 16px; display: grid; gap: 14px; }
.barra { display: flex; flex-wrap: wrap; gap: 8px; }
.barra .btn-primario { margin-left: auto; }
.comprobante { background: #fff; color: #111; border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 24px; position: relative; }
header { text-align: center; border-bottom: 1px dashed #bbb; padding-bottom: 14px; margin-bottom: 14px; }
header h1 { font-size: 1.2rem; margin: 0; }
.numero { margin: 4px 0 0; color: #555; font-variant-numeric: tabular-nums; }
.sello { position: absolute; top: 18px; right: 18px; margin: 0; border: 2px solid var(--error); color: var(--error); font-weight: 700; padding: 2px 8px; border-radius: 4px; transform: rotate(8deg); }
dl { display: grid; gap: 4px; margin: 0 0 14px; font-size: 0.9rem; }
dl div { display: flex; justify-content: space-between; gap: 12px; }
dt { color: #555; }
dd { margin: 0; text-align: right; }
table { font-size: 0.88rem; }
th { background: none; padding: 6px 4px; border-bottom: 1px dashed #bbb; }
td { padding: 6px 4px; border-bottom: none; }
.total { display: flex; justify-content: space-between; border-top: 1px dashed #bbb; margin-top: 10px; padding-top: 12px; font-size: 1.15rem; }
.gracias { text-align: center; color: #555; margin: 16px 0 0; font-size: 0.9rem; }

@media print {
  .no-imprimir { display: none !important; }
  .pantalla { padding: 0; max-width: none; }
  .comprobante { border: none; padding: 0; }
}
</style>
