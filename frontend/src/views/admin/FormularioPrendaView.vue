<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { categorias as apiCategorias, prendas } from '@/services/api'

// CU03 – Gestionar prendas. «process class» GestionarPrenda / página FormularioPrenda.
const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const esEdicion = computed(() => Boolean(id.value))

const categorias = ref([])
const datos = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  idCategoria: '',
  precioCompra: '',
  precioVenta: '',
  imagen: ''
})
const error = ref('')
const guardando = ref(false)

onMounted(async () => {
  categorias.value = await apiCategorias.listar()
  if (esEdicion.value) {
    try {
      const p = await prendas.obtener(id.value)
      Object.assign(datos, {
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        idCategoria: p.idCategoria,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        imagen: p.imagen
      })
    } catch (e) {
      error.value = e.message
    }
  }
})

// «file upload» Imagen
function elegirImagen(evento) {
  const archivo = evento.target.files[0]
  if (!archivo) return
  if (archivo.size > 2 * 1024 * 1024) {
    error.value = 'La imagen no debe superar los 2 MB.'
    evento.target.value = ''
    return
  }
  const lector = new FileReader()
  lector.onload = () => (datos.imagen = lector.result)
  lector.readAsDataURL(archivo)
}

async function guardar() {
  error.value = ''
  if (Number(datos.precioVenta) < Number(datos.precioCompra)) {
    if (!confirm('El precio de venta es menor al de compra. ¿Guardar de todos modos?')) return
  }
  guardando.value = true
  const payload = {
    ...datos,
    idCategoria: Number(datos.idCategoria),
    precioCompra: Number(datos.precioCompra),
    precioVenta: Number(datos.precioVenta)
  }
  try {
    if (esEdicion.value) {
      await prendas.actualizar(id.value, payload)
      router.push({ name: 'lista-prendas' })
    } else {
      // Postcondición CU03: la prenda queda lista para agregar variantes
      const nueva = await prendas.crear(payload)
      router.push({ name: 'variantes', params: { id: nueva.idPrenda }, query: { nueva: 1 } })
    }
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section class="cabecera">
    <div>
      <p class="migas"><RouterLink :to="{ name: 'lista-prendas' }">Prendas</RouterLink> / {{ esEdicion ? 'Editar' : 'Nueva' }}</p>
      <h1>{{ esEdicion ? 'Editar prenda' : 'Nueva prenda' }}</h1>
    </div>
  </section>

  <!-- «input form» DatosPrenda -->
  <form class="tarjeta formulario" @submit.prevent="guardar">
    <div v-if="error" class="aviso aviso-error">{{ error }}</div>

    <div class="disposicion">
      <div class="formulario">
        <div class="fila-campos">
          <div class="campo">
            <label for="codigo">Código</label>
            <input id="codigo" v-model="datos.codigo" required maxlength="20" placeholder="POL-003" style="text-transform: uppercase" />
            <span class="ayuda">Único para cada prenda.</span>
          </div>
          <div class="campo">
            <label for="categoria">Categoría</label>
            <select id="categoria" v-model="datos.idCategoria" required>
              <option value="" disabled>Elige una categoría</option>
              <option v-for="c in categorias" :key="c.idCategoria" :value="c.idCategoria">{{ c.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="campo">
          <label for="nombre">Nombre</label>
          <input id="nombre" v-model="datos.nombre" required maxlength="80" />
        </div>

        <div class="campo">
          <label for="descripcion">Descripción</label>
          <textarea id="descripcion" v-model="datos.descripcion" maxlength="500"></textarea>
        </div>

        <div class="fila-campos">
          <div class="campo">
            <label for="compra">Precio de compra (Bs)</label>
            <input id="compra" v-model="datos.precioCompra" type="number" min="0" step="0.01" required />
          </div>
          <div class="campo">
            <label for="venta">Precio de venta (Bs)</label>
            <input id="venta" v-model="datos.precioVenta" type="number" min="0" step="0.01" required />
          </div>
        </div>
      </div>

      <div class="campo">
        <label for="imagen">Imagen</label>
        <div class="vista-previa">
          <img v-if="datos.imagen" :src="datos.imagen" alt="Vista previa" />
          <span v-else class="muted pequeno">Sin imagen</span>
        </div>
        <input id="imagen" type="file" accept="image/*" @change="elegirImagen" />
        <span class="ayuda">JPG o PNG, máximo 2 MB.</span>
      </div>
    </div>

    <div class="acciones">
      <button class="btn btn-primario" type="submit" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      <RouterLink :to="{ name: 'lista-prendas' }" class="btn">Cancelar</RouterLink>
      <RouterLink v-if="esEdicion" :to="{ name: 'variantes', params: { id } }" class="btn" style="margin-left: auto">Agregar variantes →</RouterLink>
    </div>
  </form>
</template>

<style scoped>
.disposicion { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 24px; align-items: start; }
.vista-previa {
  aspect-ratio: 1; border: 1px dashed var(--border); border-radius: var(--radius);
  display: grid; place-items: center; overflow: hidden; background: var(--surface-2);
}
.vista-previa img { width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 760px) {
  .disposicion { grid-template-columns: 1fr; }
  .vista-previa { max-width: 240px; }
}
</style>
