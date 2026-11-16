<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { iniciarSesion } from '@/stores/auth'

// CU01 – Iniciar sesión. «process class» IniciarSesion.
const router = useRouter()
const route = useRoute()

const usuario = ref('')
const contrasena = ref('')
const error = ref('')
const enviando = ref(false)

async function ingresar() {
  error.value = ''
  enviando.value = true
  try {
    await iniciarSesion(usuario.value.trim(), contrasena.value)
    router.replace(route.query.redirect || { name: 'menu-admin' })
  } catch (e) {
    error.value = e.message
    contrasena.value = ''
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="pantalla">
    <form class="tarjeta formulario caja" @submit.prevent="ingresar">
      <div>
        <h1>Iniciar sesión</h1>
        <p class="muted">Acceso exclusivo para el dueño del negocio.</p>
      </div>

      <div v-if="error" class="aviso aviso-error">{{ error }}</div>

      <div class="campo">
        <label for="usuario">Usuario</label>
        <input id="usuario" v-model="usuario" autocomplete="username" required autofocus />
      </div>
      <div class="campo">
        <label for="contrasena">Contraseña</label>
        <input id="contrasena" v-model="contrasena" type="password" autocomplete="current-password" required />
      </div>

      <button class="btn btn-primario" type="submit" :disabled="enviando">
        {{ enviando ? 'Validando…' : 'Ingresar' }}
      </button>
      <RouterLink to="/" class="muted pequeno volver">← Volver al catálogo</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.pantalla { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.caja { width: 100%; max-width: 380px; }
.volver { text-align: center; text-decoration: none; }
</style>
