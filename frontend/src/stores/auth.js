import { reactive } from 'vue'
import { auth } from '@/services/api'

const CLAVE = 'ropa-sesion'

function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE)) || null
  } catch {
    return null
  }
}

export const sesion = reactive({
  usuario: leerSesion()
})

// CU01 – Iniciar sesión
export async function iniciarSesion(usuario, contrasena) {
  const datos = await auth.iniciarSesion(usuario, contrasena)
  sesion.usuario = datos
  sessionStorage.setItem(CLAVE, JSON.stringify(datos))
}

// CU02 – Cerrar sesión
export function cerrarSesion() {
  sesion.usuario = null
  sessionStorage.removeItem(CLAVE)
}
