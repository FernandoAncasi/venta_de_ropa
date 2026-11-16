<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { reportes, ubicaciones } from '@/services/api'
import { fecha, moneda } from '@/utils/formato'

// CU10 – Generar reportes y CU11 – Exportar a PDF. «menu» MenuReportes → GenerarReporte → ExportarPDF.
const tipos = [
  { valor: 'inventario', nombre: 'Inventario', usaFechas: false },
  { valor: 'ventas', nombre: 'Ventas', usaFechas: true },
  { valor: 'ganancias', nombre: 'Ganancias', usaFechas: true },
  { valor: 'masVendidas', nombre: 'Más vendidas', usaFechas: true }
]

const listaUbicaciones = ref([])
const filtros = reactive({ tipo: 'inventario', idUbicacion: '', desde: '', hasta: '' })
const reporte = ref(null)
const error = ref('')
const generando = ref(false)
const exportando = ref(false)

const tipoActual = computed(() => tipos.find((t) => t.valor === filtros.tipo))
// El inventario se filtra por cualquier ubicación; los reportes de ventas, solo por tienda.
const opcionesUbicacion = computed(() =>
  tipoActual.value.usaFechas ? listaUbicaciones.value.filter((u) => u.tipo === 'tienda') : listaUbicaciones.value
)
const nombreUbicacion = computed(
  () =>
    listaUbicaciones.value.find((u) => u.idUbicacion === Number(filtros.idUbicacion))?.nombre ??
    (tipoActual.value.usaFechas ? 'Todas las tiendas' : 'Todas las ubicaciones')
)
const descripcionFiltros = computed(() => {
  const partes = [nombreUbicacion.value]
  if (tipoActual.value.usaFechas) {
    if (filtros.desde || filtros.hasta) partes.push(`${filtros.desde ? fecha(filtros.desde) : 'inicio'} – ${filtros.hasta ? fecha(filtros.hasta) : 'hoy'}`)
    else partes.push('todas las fechas')
  }
  return partes.join(' · ')
})

function formatear(r, valor, columna) {
  if (r.monedas?.includes(columna)) return moneda(valor)
  if (r.fechas?.includes(columna)) return fecha(valor)
  return valor
}

function formatearTotal(nombre, valor) {
  return /unidades|ventas$/i.test(nombre) ? valor : moneda(valor)
}

function cambiarTipo() {
  if (!opcionesUbicacion.value.some((u) => u.idUbicacion === Number(filtros.idUbicacion))) filtros.idUbicacion = ''
  generar()
}

async function generar() {
  error.value = ''
  generando.value = true
  try {
    const params = { ...filtros }
    if (!tipoActual.value.usaFechas) Object.assign(params, { desde: '', hasta: '' })
    reporte.value = { ...(await reportes.generar(params)), filtros: descripcionFiltros.value }
  } catch (e) {
    error.value = e.message
    reporte.value = null
  } finally {
    generando.value = false
  }
}

// CU11 – Exportar reporte a PDF (RF19)
async function exportarPDF() {
  exportando.value = true
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const r = reporte.value
    const doc = new jsPDF({ orientation: r.columnas.length > 5 ? 'landscape' : 'portrait' })
    doc.setFontSize(16)
    doc.text(r.titulo, 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(`${r.filtros} · generado el ${fecha(new Date().toISOString())}`, 14, 25)

    autoTable(doc, {
      startY: 31,
      head: [r.columnas],
      body: r.filas.map((f) => f.map((v, i) => String(formatear(r, v, i)))),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 29, 26] },
      columnStyles: Object.fromEntries([...(r.monedas ?? [])].map((i) => [i, { halign: 'right' }]))
    })

    let y = doc.lastAutoTable.finalY + 10
    doc.setTextColor(30)
    for (const [nombre, valor] of Object.entries(r.totales)) {
      doc.text(`${nombre}: ${formatearTotal(nombre, valor)}`, 14, y)
      y += 6
    }
    doc.save(`${r.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  } finally {
    exportando.value = false
  }
}

onMounted(async () => {
  listaUbicaciones.value = await ubicaciones.listar()
  generar()
})
</script>

<template>
  <section class="cabecera">
    <div>
      <h1>Reportes</h1>
      <p class="muted">Elige el tipo de reporte y los filtros.</p>
    </div>
  </section>

  <form class="tarjeta filtros" @submit.prevent="generar">
    <div class="campo">
      <label for="tipo">Tipo de reporte</label>
      <select id="tipo" v-model="filtros.tipo" @change="cambiarTipo">
        <option v-for="t in tipos" :key="t.valor" :value="t.valor">{{ t.nombre }}</option>
      </select>
    </div>
    <div class="campo">
      <label for="ubicacion">{{ tipoActual.usaFechas ? 'Tienda' : 'Ubicación' }}</label>
      <select id="ubicacion" v-model="filtros.idUbicacion">
        <option value="">Todas</option>
        <option v-for="u in opcionesUbicacion" :key="u.idUbicacion" :value="u.idUbicacion">{{ u.nombre }}</option>
      </select>
    </div>
    <div class="campo">
      <label for="desde">Desde</label>
      <input id="desde" v-model="filtros.desde" type="date" :disabled="!tipoActual.usaFechas" />
    </div>
    <div class="campo">
      <label for="hasta">Hasta</label>
      <input id="hasta" v-model="filtros.hasta" type="date" :disabled="!tipoActual.usaFechas" />
    </div>
    <div class="acciones">
      <button class="btn btn-primario" type="submit" :disabled="generando">Generar</button>
      <button class="btn" type="button" :disabled="!reporte || !reporte.filas.length || exportando" @click="exportarPDF">
        {{ exportando ? 'Exportando…' : 'Exportar PDF' }}
      </button>
    </div>
  </form>

  <div v-if="error" class="aviso aviso-error" style="margin-top: 16px">{{ error }}</div>

  <div v-if="reporte" class="tarjeta" style="margin-top: 16px">
    <div class="titulo-reporte">
      <div>
        <h2>{{ reporte.titulo }}</h2>
        <p class="muted pequeno">{{ reporte.filtros }}</p>
      </div>
      <div class="totales">
        <div v-for="(valor, nombre) in reporte.totales" :key="nombre">
          <span class="muted pequeno">{{ nombre }}</span>
          <strong>{{ formatearTotal(nombre, valor) }}</strong>
        </div>
      </div>
    </div>

    <p v-if="!reporte.filas.length" class="vacio">No hay datos para los filtros elegidos.</p>
    <div v-else class="tabla-envoltura">
      <table>
        <thead>
          <tr>
            <th v-for="(c, i) in reporte.columnas" :key="c" :class="{ num: reporte.monedas?.includes(i) || typeof reporte.filas[0][i] === 'number' }">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, n) in reporte.filas" :key="n">
            <td v-for="(valor, i) in fila" :key="i" :class="{ num: typeof valor === 'number' }">{{ formatear(reporte, valor, i) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.filtros { display: grid; gap: 14px; grid-template-columns: repeat(4, 1fr) auto; align-items: end; }
.titulo-reporte { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.totales { display: flex; flex-wrap: wrap; gap: 24px; }
.totales div { display: grid; text-align: right; }
.totales strong { font-size: 1.15rem; }

@media (max-width: 900px) {
  .filtros { grid-template-columns: 1fr 1fr; }
  .filtros .acciones { grid-column: 1 / -1; }
  .totales div { text-align: left; }
}
</style>
