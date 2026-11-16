<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sesion, cerrarSesion } from '@/stores/auth'

// «menu» MenuAdmin: cinco ramas (búsqueda, prendas, ubicaciones, ventas, reportes) y cerrar sesión.
const router = useRouter()
const route = useRoute()
const abierto = ref(false)

watch(() => route.fullPath, () => (abierto.value = false))

function salir() {
  cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="barra">
    <div class="contenedor barra-interior">
      <RouterLink :to="{ name: 'menu-admin' }" class="marca">Venta de Ropa <span>Admin</span></RouterLink>
      <button class="btn btn-chico hamburguesa" @click="abierto = !abierto" aria-label="Menú">☰</button>
      <nav class="menu" :class="{ abierto }">
        <RouterLink :to="{ name: 'menu-admin' }" exact-active-class="activo">Inicio</RouterLink>
        <RouterLink :to="{ name: 'lista-prendas' }" :class="{ activo: route.path.startsWith('/admin/prendas') }">Prendas</RouterLink>
        <RouterLink :to="{ name: 'lista-ubicaciones' }" :class="{ activo: route.path.startsWith('/admin/ubicaciones') }">Ubicaciones</RouterLink>
        <RouterLink :to="{ name: 'lista-ventas' }" :class="{ activo: route.path.startsWith('/admin/ventas') }">Ventas</RouterLink>
        <RouterLink :to="{ name: 'reportes' }" active-class="activo">Reportes</RouterLink>
        <RouterLink to="/" target="_blank" class="muted">Ver catálogo ↗</RouterLink>
        <span class="usuario muted pequeno">{{ sesion.usuario?.nombre }}</span>
        <button class="btn btn-chico" @click="salir">Cerrar sesión</button>
      </nav>
    </div>
  </header>

  <main class="contenedor">
    <RouterView />
  </main>
</template>

<style scoped>
.barra { background: var(--primary); color: var(--primary-text); position: sticky; top: 0; z-index: 10; }
.barra-interior { display: flex; align-items: center; justify-content: space-between; height: 60px; position: relative; }
.marca { font-weight: 700; font-size: 1.1rem; text-decoration: none; }
.marca span { color: #f0a47e; }
.menu { display: flex; gap: 18px; align-items: center; font-size: 0.92rem; }
.menu a { text-decoration: none; color: rgba(255, 255, 255, 0.72); }
.menu a.activo, .menu a:hover { color: #fff; }
.menu .muted { color: rgba(255, 255, 255, 0.55); }
.usuario { padding-left: 10px; border-left: 1px solid rgba(255, 255, 255, 0.2); }
.hamburguesa { display: none; }

@media (max-width: 820px) {
  .hamburguesa { display: inline-flex; }
  .menu {
    display: none; position: absolute; top: 60px; left: 0; right: 0;
    flex-direction: column; align-items: stretch; gap: 0;
    background: var(--primary); padding: 8px 16px 16px;
  }
  .menu.abierto { display: flex; }
  .menu a { padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .usuario { border: none; padding: 10px 0; }
}
</style>
