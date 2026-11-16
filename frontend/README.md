# Frontend – Sistema Web de Gestión de Inventario Multiubicación y Ventas de Ropa

Interfaz en **Vue 3 + Vite + Vue Router** del sistema documentado con UWE (`UWE_documentacion.docx`).
Maneja tres ubicaciones: Tienda Mercado Campero, Tienda Super Feria y Almacén principal.

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173

- Catálogo público: `/`
- Administración: `/admin` (usuario de prueba `admin`, contraseña `admin123`)

## Estructura

```
src/
  router/index.js        rutas = modelo de navegación UWE (cliente y dueño)
  layouts/               MenuCliente (PublicLayout) y MenuAdmin (AdminLayout)
  views/public/          CatalogoView (CU12), DetallePrendaView (CU13)
  views/admin/
    LoginView            CU01 IniciarSesion
    MenuAdminView        MenuAdmin
    ListaPrendasView     CU05 BuscarPrenda / ListaPrendas
    FormularioPrendaView CU03 GestionarPrenda
    FormularioVarianteView CU04 RegistrarVariante
    ExistenciasPrendaView  CU08 ExistenciasPrenda
    FormularioTraspasoView CU09 RegistrarTraspaso
    ListaUbicacionesView CU06 ListaUbicaciones
    UbicacionView        Ubicacion
    AsignarStockView     CU07 AsignarStock
    ListaVentasView      CU15 ListaVentas
    RegistrarVentaView   CU14 RegistrarVenta
    DetalleVentaView     CU15 Venta + CU16 AnularVenta
    ComprobanteView      CU17 EmitirComprobante (imprimible)
    ReportesView         CU10 GenerarReporte + CU11 ExportarPDF
  services/api.js        acceso a datos (hoy simulado con localStorage)
  services/seed.js       datos de ejemplo según el modelo de contenido
  stores/auth.js         sesión del dueño (CU01, CU02)
```

## Reglas implementadas

- Solo las ubicaciones de tipo **tienda** registran ventas y aparecen en el catálogo; el almacén no.
- Los traspasos pueden ir del almacén a una tienda, entre tiendas o de una tienda al almacén.
- Registrar una venta valida y descuenta el stock de esa tienda; anularla lo devuelve.
- Las ventas anuladas no cuentan en los reportes de ventas, ganancias ni más vendidas.

## Datos simulados

Mientras no exista el backend, `services/api.js` guarda los datos en el `localStorage` del
navegador a partir de `seed.js`. Cada función devuelve una Promise y lanza `Error` con un mensaje,
igual que lo hará la API real. Para conectar el backend se reemplaza el cuerpo de esas funciones por
llamadas `fetch` sin tocar las vistas.

Para volver a los datos de ejemplo, borra la clave `ropa-db-v2` del localStorage
(DevTools → Application → Local Storage).

## Pendiente para el backend

- Contraseñas cifradas (RNF01) y sesión con token.
- Subida real de imágenes (hoy se guardan como data URL).
