import { createRouter, createWebHistory } from 'vue-router'
import { sesion } from '@/stores/auth'

// Rutas derivadas del modelo de navegación UWE (sección 5 de la documentación).
const routes = [
  // Navegación del cliente: MenuCliente → CatalogoPrendas / FiltrarCatalogo → Prenda → DisponibilidadTiendas
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'catalogo', component: () => import('@/views/public/CatalogoView.vue') },
      { path: 'prenda/:id', name: 'detalle-prenda', component: () => import('@/views/public/DetallePrendaView.vue') }
    ]
  },

  // IniciarSesion «process class»
  { path: '/admin/login', name: 'login', component: () => import('@/views/admin/LoginView.vue') },

  // EmitirComprobante «process class»: página sin menú, lista para imprimir
  {
    path: '/admin/ventas/:id/comprobante',
    name: 'comprobante',
    component: () => import('@/views/admin/ComprobanteView.vue'),
    meta: { requiereSesion: true }
  },

  // Navegación del dueño: todo parte de MenuAdmin y requiere sesión (RF03)
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiereSesion: true },
    children: [
      { path: '', name: 'menu-admin', component: () => import('@/views/admin/MenuAdminView.vue') },

      // BuscarPrenda → ListaPrendas → Prenda → GestionarPrenda / ExistenciasPrenda
      { path: 'prendas', name: 'lista-prendas', component: () => import('@/views/admin/ListaPrendasView.vue') },
      { path: 'prendas/nueva', name: 'prenda-nueva', component: () => import('@/views/admin/FormularioPrendaView.vue') },
      { path: 'prendas/:id/editar', name: 'prenda-editar', component: () => import('@/views/admin/FormularioPrendaView.vue') },
      { path: 'prendas/:id/variantes', name: 'variantes', component: () => import('@/views/admin/FormularioVarianteView.vue') },
      { path: 'prendas/:id/existencias', name: 'existencias-prenda', component: () => import('@/views/admin/ExistenciasPrendaView.vue') },
      { path: 'prendas/:id/traspaso', name: 'traspaso', component: () => import('@/views/admin/FormularioTraspasoView.vue') },

      // ListaUbicaciones → Ubicacion → AsignarStock
      { path: 'ubicaciones', name: 'lista-ubicaciones', component: () => import('@/views/admin/ListaUbicacionesView.vue') },
      { path: 'ubicaciones/:id', name: 'ubicacion', component: () => import('@/views/admin/UbicacionView.vue') },
      { path: 'ubicaciones/:id/stock', name: 'asignar-stock', component: () => import('@/views/admin/AsignarStockView.vue') },

      // ListaVentas → Venta → AnularVenta; ListaVentas → RegistrarVenta → EmitirComprobante
      { path: 'ventas', name: 'lista-ventas', component: () => import('@/views/admin/ListaVentasView.vue') },
      { path: 'ventas/nueva', name: 'venta-nueva', component: () => import('@/views/admin/RegistrarVentaView.vue') },
      { path: 'ventas/:id', name: 'venta', component: () => import('@/views/admin/DetalleVentaView.vue') },

      // MenuReportes → GenerarReporte → ExportarPDF
      { path: 'reportes', name: 'reportes', component: () => import('@/views/admin/ReportesView.vue') }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.matched.some((r) => r.meta.requiereSesion) && !sesion.usuario) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && sesion.usuario) {
    return { name: 'menu-admin' }
  }
})

export default router
