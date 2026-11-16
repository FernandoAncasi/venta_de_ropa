<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { stock, ubicaciones, ventas } from '@/services/api'
import { sesion } from '@/stores/auth'
import { moneda } from '@/utils/formato'

// CU14 – Registrar venta. «process class» RegistrarVenta / página RegistrarVenta.
const router = useRouter()

const tiendas = ref([])
const idUbicacion = ref('')
const disponibles = ref([])
const nuevo = reactive({ idVariante: '', cantidad: 1 })
const items = ref([])
const aviso = ref('')
const error = ref('')
const enviando = ref(false)

onMounted(async () => {
  tiendas.value = await ubicaciones.listar({ tipo: 'tienda' })
  if (tiendas.value.length === 1) idUbicacion.value = tiendas.value[0].idUbicacion
})

// Al cambiar de tienda se cargan sus existencias y se vacía la venta
watch(idUbicacion, async (id) => {
  items.value = []
  nuevo.idVariante = ''
  aviso.value = ''
  disponibles.value = id
    ? (await stock.porUbicacion(id))
        .filter((s) => s.activo && s.cantidad > 0)
        .sort((a, b) => a.codigo.localeCompare(b.codigo) || a.talla.localeCompare(b.talla))
    : []
})

const enVenta = (idVariante) => items.value.find((i) => i.idVariante === Number(idVariante))?.cantidad ?? 0
const restante = (s) => s.cantidad - enVenta(s.idVariante)
const seleccionada = computed(() => disponibles.value.find((s) => s.idVariante === Number(nuevo.idVariante)))
const total = computed(() => items.value.reduce((n, i) => n + i.subtotal, 0))

// agregarItem() + validarStock()
function agregar() {
  aviso.value = ''
  const s = seleccionada.value
  const n = Number(nuevo.cantidad)
  if (!s) return
  if (!Number.isInteger(n) || n <= 0) {
    aviso.value = 'La cantidad debe ser un número entero mayor a 0.'
    return
  }
  if (n > restante(s)) {
    aviso.value = `No hay stock suficiente de ${s.prenda} ${s.talla}/${s.color} en esta tienda: quedan ${restante(s)} unidad(es).`
    return
  }
  const existente = items.value.find((i) => i.idVariante === s.idVariante)
  if (existente) {
    existente.cantidad += n
    existente.subtotal = existente.cantidad * existente.precioUnitario
  } else {
    items.value.push({
      idVariante: s.idVariante,
      codigo: s.codigo,
      prenda: s.prenda,
      talla: s.talla,
      color: s.color,
      cantidad: n,
      precioUnitario: s.precioVenta,
      subtotal: n * s.precioVenta
    })
  }
  nuevo.idVariante = ''
  nuevo.cantidad = 1
}

function quitar(item) {
  items.value = items.value.filter((i) => i !== item)
}

// confirmarVenta() → EmitirComprobante
async function confirmar() {
  error.value = ''
  if (!confirm(`¿Confirmar la venta por ${moneda(total.value)}?`)) return
  enviando.value = true
  try {
    const venta = await ventas.registrar({
      idUbicacion: idUbicacion.value,
      idUsuario: sesion.usuario?.idUsuario,
      items: items.value.map(({ idVariante, cantidad }) => ({ idVariante, cantidad }))
    })
    router.push({ name: 'comprobante', params: { id: venta.idVenta }, query: { nueva: 1 } })
  } catch (e) {
    error.value = e.message
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  if (items.value.length && !confirm('¿Descartar esta venta? No se guardará nada.')) return
  router.push({ name: 'lista-ventas' })
}
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-ventas' }">Ventas</RouterLink> / Nueva</p>
      <h1>Nueva venta</h1>
      <p class="muted">Solo se muestran las prendas con stock en la tienda elegida.</p>
    </div>
  </section>

  <div v-if="error" class="aviso aviso-error" style="margin-bottom: 14px">{{ error }}</div>

  <div class="columnas">
    <div class="tarjeta formulario">
      <div class="campo">
        <label for="tienda">Tienda</label>
        <select id="tienda" v-model="idUbicacion">
          <option value="" disabled>Elige la tienda</option>
          <option v-for="t in tiendas" :key="t.idUbicacion" :value="t.idUbicacion">{{ t.nombre }}</option>
        </select>
      </div>

      <form class="formulario" @submit.prevent="agregar">
        <div class="campo">
          <label for="variante">Prenda (talla / color)</label>
          <select id="variante" v-model="nuevo.idVariante" :disabled="!idUbicacion" required>
            <option value="" disabled>{{ idUbicacion ? 'Elige una prenda' : 'Primero elige la tienda' }}</option>
            <option v-for="s in disponibles" :key="s.idVariante" :value="s.idVariante" :disabled="restante(s) <= 0">
              {{ s.codigo }} · {{ s.prenda }} · {{ s.talla }}/{{ s.color }} — {{ moneda(s.precioVenta) }} ({{ restante(s) }} disp.)
            </option>
          </select>
          <span v-if="idUbicacion && !disponibles.length" class="ayuda">Esta tienda no tiene prendas con stock.</span>
        </div>
        <div class="campo">
          <label for="cantidad">Cantidad</label>
          <input id="cantidad" v-model.number="nuevo.cantidad" type="number" min="1" step="1" required :disabled="!idUbicacion" />
          <span v-if="seleccionada" class="ayuda">Disponible: {{ restante(seleccionada) }} · Subtotal: {{ moneda(seleccionada.precioVenta * (nuevo.cantidad || 0)) }}</span>
        </div>
        <div v-if="aviso" class="aviso aviso-error">{{ aviso }}</div>
        <button class="btn" type="submit" :disabled="!nuevo.idVariante">Agregar</button>
      </form>
    </div>

    <div class="tarjeta">
      <h2>Ítems de la venta</h2>
      <p v-if="!items.length" class="vacio">Todavía no agregaste prendas.</p>
      <div v-else class="tabla-envoltura">
        <table>
          <thead>
            <tr><th>Prenda</th><th>Variante</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Subtotal</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="i in items" :key="i.idVariante">
              <td>{{ i.prenda }}<div class="muted pequeno">{{ i.codigo }}</div></td>
              <td>{{ i.talla }} / {{ i.color }}</td>
              <td class="num">{{ i.cantidad }}</td>
              <td class="num">{{ moneda(i.precioUnitario) }}</td>
              <td class="num">{{ moneda(i.subtotal) }}</td>
              <td class="num"><button class="btn btn-chico btn-peligro" @click="quitar(i)" aria-label="Quitar">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pie-venta">
        <div>
          <span class="muted pequeno">Total</span>
          <strong class="total">{{ moneda(total) }}</strong>
        </div>
        <div class="acciones">
          <button class="btn" type="button" @click="cancelar">Cancelar</button>
          <button class="btn btn-primario" type="button" :disabled="!items.length || enviando" @click="confirmar">
            {{ enviando ? 'Guardando…' : 'Confirmar venta' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.columnas { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 16px; align-items: start; }
.columnas .tarjeta { margin: 0; }
.pie-venta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
.pie-venta > div:first-child { display: grid; }
.total { font-size: 1.6rem; }
@media (max-width: 860px) {
  .columnas { grid-template-columns: 1fr; }
}
</style>
