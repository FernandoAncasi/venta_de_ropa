<script setup>
// «menu» MenuCliente: navegación pública, sin iniciar sesión.
</script>

<template>
  <header class="barra">
    <div class="contenedor barra-interior">
      <RouterLink to="/" class="marca">Venta de <span>Ropa</span></RouterLink>
      <nav class="menu">
        <RouterLink to="/">Catálogo</RouterLink>
        <RouterLink :to="{ name: 'login' }" class="acceso">Administración</RouterLink>
      </nav>
    </div>
  </header>

  <main class="contenedor">
    <RouterView />
  </main>

  <footer class="pie">
    <div class="contenedor muted pequeno">Catálogo informativo: las compras se realizan en nuestras tiendas del Mercado Campero y la Super Feria.</div>
  </footer>
</template>

<style scoped>
.barra { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
.barra-interior { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.marca { font-weight: 700; font-size: 1.1rem; text-decoration: none; letter-spacing: -0.01em; }
.marca span { color: var(--accent); }
.menu { display: flex; gap: 18px; align-items: center; font-size: 0.92rem; }
.menu a { text-decoration: none; color: var(--muted); }
.menu a.router-link-exact-active { color: var(--text); font-weight: 600; }
.acceso { border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; }
.pie { margin-top: 48px; padding: 24px 0; border-top: 1px solid var(--border); }
</style>
