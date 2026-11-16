<script setup>
import { onMounted, reactive, ref } from 'vue'
import { TIPOS_UBICACION, ubicaciones } from '@/services/api'

// CU06 – Gestionar ubicaciones. «index» ListaUbicaciones.
const lista = ref([])
const formulario = reactive({ abierto: false, idUbicacion: null, nombre: '', direccion: '', tipo: 'tienda' })
const error = ref('')

async function cargar() {
  lista.value = await ubicaciones.listar()
}

function abrir(u = null) {
  error.value = ''
  Object.assign(formulario, {
    abierto: true,
    idUbicacion: u?.idUbicacion ?? null,
    nombre: u?.nombre ?? '',
    direccion: u?.direccion ?? '',
    tipo: u?.tipo ?? 'tienda'
  })
}

async function guardar() {
  error.value = ''
  try {
    if (formulario.idUbicacion) await ubicaciones.actualizar(formulario.idUbicacion, formulario)
    else await ubicaciones.crear(formulario)
    formulario.abierto = false
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
      <h1>Ubicaciones</h1>
      <p class="muted">Tiendas y almacén. Elige una para ver sus existencias o asignar stock.</p>
    </div>
    <button class="btn btn-primario" @click="abrir()">+ Nueva ubicación</button>
  </section>

  <form v-if="formulario.abierto" class="tarjeta formulario" style="margin-bottom: 16px" @submit.prevent="guardar">
    <h2>{{ formulario.idUbicacion ? 'Editar ubicación' : 'Nueva ubicación' }}</h2>
    <div v-if="error" class="aviso aviso-error">{{ error }}</div>
    <div class="fila-campos">
      <div class="campo">
        <label for="u-nombre">Nombre</label>
        <input id="u-nombre" v-model="formulario.nombre" required maxlength="60" />
      </div>
      <div class="campo">
        <label for="u-tipo">Tipo</label>
        <select id="u-tipo" v-model="formulario.tipo" required>
          <option v-for="(nombre, valor) in TIPOS_UBICACION" :key="valor" :value="valor">{{ nombre }}</option>
        </select>
        <span class="ayuda">Solo las tiendas registran ventas y aparecen en el catálogo.</span>
      </div>
      <div class="campo">
        <label for="u-direccion">Dirección</label>
        <input id="u-direccion" v-model="formulario.direccion" required maxlength="120" />
      </div>
    </div>
    <div class="acciones">
      <button class="btn btn-primario" type="submit">Guardar</button>
      <button class="btn" type="button" @click="formulario.abierto = false">Cancelar</button>
    </div>
  </form>

  <div class="tarjeta">
    <div class="tabla-envoltura">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Tipo</th><th class="ocultar-movil">Dirección</th><th class="num">Unidades</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in lista" :key="u.idUbicacion">
            <td><strong>{{ u.nombre }}</strong></td>
            <td><span class="chip" :class="{ 'chip-ok': u.tipo === 'tienda' }">{{ TIPOS_UBICACION[u.tipo] }}</span></td>
            <td class="ocultar-movil muted">{{ u.direccion }}</td>
            <td class="num">{{ u.unidades }}</td>
            <td>
              <div class="acciones">
                <RouterLink :to="{ name: 'ubicacion', params: { id: u.idUbicacion } }" class="btn btn-chico">Ver existencias</RouterLink>
                <RouterLink :to="{ name: 'asignar-stock', params: { id: u.idUbicacion } }" class="btn btn-chico">Asignar stock</RouterLink>
                <button class="btn btn-chico" @click="abrir(u)">Editar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
td .acciones { flex-wrap: nowrap; }
</style>
