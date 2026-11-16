// Capa de acceso a datos del frontend.
// Mientras no exista el backend, los datos viven en localStorage. Cada función devuelve una
// Promise y lanza Error con un mensaje para el usuario, igual que lo hará la API REST, así que
// para conectar el backend basta con reemplazar el cuerpo de cada función por un fetch().

import { crearSeed } from './seed'

const CLAVE = 'ropa-db-v2'

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE))
    if (guardado) return guardado
  } catch {
    // datos corruptos o almacenamiento bloqueado: se usa la semilla
  }
  return crearSeed()
}

let db = cargar()

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(db))
  } catch {
    // sin almacenamiento disponible los cambios duran solo esta sesión
  }
}

function responder(valor) {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(valor)), 120))
}

function fallar(mensaje) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(mensaje)), 120))
}

function siguienteId(lista, campo) {
  return lista.reduce((max, x) => Math.max(max, x[campo]), 0) + 1
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

const prendaPorId = (id) => db.prendas.find((p) => p.idPrenda === Number(id))
const ubicacionPorId = (id) => db.ubicaciones.find((u) => u.idUbicacion === Number(id))
const variantePorId = (id) => db.variantes.find((v) => v.idVariante === Number(id))
const categoriaNombre = (id) => db.categorias.find((c) => c.idCategoria === Number(id))?.nombre ?? '—'
const variantesDe = (idPrenda) => db.variantes.filter((v) => v.idPrenda === Number(idPrenda))
const esTienda = (id) => ubicacionPorId(id)?.tipo === 'tienda'
const stockDe = (idVariante, idUbicacion) =>
  db.stock.find((s) => s.idVariante === Number(idVariante) && s.idUbicacion === Number(idUbicacion))

function unidadesDePrenda(idPrenda) {
  const ids = variantesDe(idPrenda).map((v) => v.idVariante)
  return db.stock.filter((s) => ids.includes(s.idVariante)).reduce((n, s) => n + s.cantidad, 0)
}

function coincideFiltros(prenda, { q, idCategoria, talla, color }) {
  if (idCategoria && prenda.idCategoria !== Number(idCategoria)) return false
  const vars = variantesDe(prenda.idPrenda)
  if (talla && !vars.some((v) => v.talla === talla)) return false
  if (color && !vars.some((v) => v.color === color)) return false
  if (q) {
    const t = q.trim().toLowerCase()
    const texto = [prenda.codigo, prenda.nombre, categoriaNombre(prenda.idCategoria), ...vars.flatMap((v) => [v.talla, v.color])]
      .join(' ')
      .toLowerCase()
    if (!texto.includes(t)) return false
  }
  return true
}

/* ---------- Autenticación (CU01, CU02) ---------- */

export const auth = {
  iniciarSesion(usuario, contrasena) {
    const u = db.usuarios.find((x) => x.usuario === usuario && x.contrasena === contrasena)
    if (!u) return fallar('Usuario o contraseña incorrectos.')
    return responder({ idUsuario: u.idUsuario, nombre: u.nombre, usuario: u.usuario, rol: u.rol })
  }
}

/* ---------- Categorías ---------- */

export const categorias = {
  listar: () => responder(db.categorias)
}

/* ---------- Prendas (CU03, CU05) ---------- */

export const prendas = {
  // CU05 – Buscar prendas por código, nombre, categoría, talla o color (RF08)
  listar(filtros = {}) {
    const lista = db.prendas
      .filter((p) => coincideFiltros(p, filtros))
      .map((p) => ({
        ...p,
        categoria: categoriaNombre(p.idCategoria),
        variantes: variantesDe(p.idPrenda).length,
        unidades: unidadesDePrenda(p.idPrenda)
      }))
    return responder(lista)
  },

  obtener(id) {
    const p = prendaPorId(id)
    if (!p) return fallar('La prenda no existe.')
    return responder({ ...p, categoria: categoriaNombre(p.idCategoria), variantes: variantesDe(id) })
  },

  // CU03: el código de la prenda es único
  crear(datos) {
    const codigo = datos.codigo.trim().toUpperCase()
    if (db.prendas.some((p) => p.codigo === codigo)) {
      return fallar(`Ya existe una prenda con el código ${codigo}.`)
    }
    const nueva = { ...datos, codigo, idPrenda: siguienteId(db.prendas, 'idPrenda'), activo: true }
    db.prendas.push(nueva)
    guardar()
    return responder(nueva)
  },

  actualizar(id, datos) {
    const p = prendaPorId(id)
    if (!p) return fallar('La prenda no existe.')
    const codigo = datos.codigo.trim().toUpperCase()
    if (db.prendas.some((x) => x.codigo === codigo && x.idPrenda !== p.idPrenda)) {
      return fallar(`Ya existe otra prenda con el código ${codigo}.`)
    }
    Object.assign(p, datos, { codigo })
    guardar()
    return responder(p)
  },

  // RF07: dar de baja sin borrar
  cambiarEstado(id, activo) {
    const p = prendaPorId(id)
    if (!p) return fallar('La prenda no existe.')
    p.activo = activo
    guardar()
    return responder(p)
  }
}

/* ---------- Variantes (CU04) ---------- */

export const variantes = {
  crear({ idPrenda, talla, color }) {
    if (!prendaPorId(idPrenda)) return fallar('La prenda no existe.')
    if (variantesDe(idPrenda).some((v) => v.talla === talla && v.color === color)) {
      return fallar(`La variante ${talla} / ${color} ya está registrada.`)
    }
    const nueva = { idVariante: siguienteId(db.variantes, 'idVariante'), idPrenda: Number(idPrenda), talla, color }
    db.variantes.push(nueva)
    guardar()
    return responder(nueva)
  },

  eliminar(idVariante) {
    const id = Number(idVariante)
    const conStock = db.stock.some((s) => s.idVariante === id && s.cantidad > 0)
    const vendida = db.detallesVenta.some((d) => d.idVariante === id)
    if (conStock || vendida) return fallar('No se puede quitar una variante con stock o ventas registradas.')
    db.variantes = db.variantes.filter((v) => v.idVariante !== id)
    db.stock = db.stock.filter((s) => s.idVariante !== id)
    guardar()
    return responder(true)
  }
}

/* ---------- Ubicaciones (CU06) ---------- */

export const TIPOS_UBICACION = { tienda: 'Tienda', almacen: 'Almacén' }

export const ubicaciones = {
  // tipo opcional: 'tienda' para elegir dónde se vende
  listar({ tipo } = {}) {
    return responder(
      db.ubicaciones
        .filter((u) => !tipo || u.tipo === tipo)
        .map((u) => ({
          ...u,
          unidades: db.stock.filter((s) => s.idUbicacion === u.idUbicacion).reduce((n, s) => n + s.cantidad, 0)
        }))
    )
  },

  obtener(id) {
    const u = ubicacionPorId(id)
    if (!u) return fallar('La ubicación no existe.')
    return responder(u)
  },

  crear({ nombre, direccion, tipo }) {
    if (!TIPOS_UBICACION[tipo]) return fallar('Elige si la ubicación es tienda o almacén.')
    const nueva = { idUbicacion: siguienteId(db.ubicaciones, 'idUbicacion'), nombre: nombre.trim(), direccion: direccion.trim(), tipo }
    db.ubicaciones.push(nueva)
    guardar()
    return responder(nueva)
  },

  actualizar(id, { nombre, direccion, tipo }) {
    const u = ubicacionPorId(id)
    if (!u) return fallar('La ubicación no existe.')
    if (!TIPOS_UBICACION[tipo]) return fallar('Elige si la ubicación es tienda o almacén.')
    if (u.tipo === 'tienda' && tipo === 'almacen' && db.ventas.some((v) => v.idUbicacion === u.idUbicacion)) {
      return fallar('Esta tienda ya tiene ventas registradas; no puede pasar a ser almacén.')
    }
    Object.assign(u, { nombre: nombre.trim(), direccion: direccion.trim(), tipo })
    guardar()
    return responder(u)
  }
}

/* ---------- Stock (CU07, CU08) ---------- */

function filaStock(s) {
  const v = variantePorId(s.idVariante)
  const p = prendaPorId(v.idPrenda)
  const u = ubicacionPorId(s.idUbicacion)
  return {
    idStock: s.idStock,
    idVariante: v.idVariante,
    idUbicacion: s.idUbicacion,
    ubicacion: u?.nombre,
    tipo: u?.tipo,
    idPrenda: p.idPrenda,
    codigo: p.codigo,
    prenda: p.nombre,
    activo: p.activo,
    precioVenta: p.precioVenta,
    talla: v.talla,
    color: v.color,
    cantidad: s.cantidad
  }
}

export const stock = {
  // CU08 – Consultar existencias (RF11)
  porPrenda(idPrenda) {
    const ids = variantesDe(idPrenda).map((v) => v.idVariante)
    return responder(db.stock.filter((s) => ids.includes(s.idVariante)).map(filaStock))
  },

  porUbicacion(idUbicacion) {
    return responder(db.stock.filter((s) => s.idUbicacion === Number(idUbicacion)).map(filaStock))
  },

  // CU07 – Asignar stock a ubicación (RF10)
  asignar({ idVariante, idUbicacion, cantidad }) {
    const n = Number(cantidad)
    if (cantidad === '' || cantidad === null || !Number.isInteger(n) || n < 0) {
      return fallar('La cantidad debe ser un número entero mayor o igual a 0.')
    }
    if (!variantePorId(idVariante) || !ubicacionPorId(idUbicacion)) return fallar('Variante o ubicación no válida.')
    const existente = stockDe(idVariante, idUbicacion)
    if (existente) existente.cantidad = n
    else db.stock.push({ idStock: siguienteId(db.stock, 'idStock'), idVariante: Number(idVariante), idUbicacion: Number(idUbicacion), cantidad: n })
    guardar()
    return responder(true)
  }
}

/* ---------- Traspasos (CU09) ---------- */

export const traspasos = {
  listarPorPrenda(idPrenda) {
    const ids = variantesDe(idPrenda).map((v) => v.idVariante)
    const lista = db.traspasos
      .filter((t) => ids.includes(t.idVariante))
      .map((t) => {
        const v = variantePorId(t.idVariante)
        return { ...t, talla: v.talla, color: v.color, origen: ubicacionPorId(t.idOrigen)?.nombre, destino: ubicacionPorId(t.idDestino)?.nombre }
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.idTraspaso - a.idTraspaso)
    return responder(lista)
  },

  // Almacén → tienda, entre tiendas o tienda → almacén
  registrar({ idVariante, idOrigen, idDestino, cantidad }) {
    if (Number(idOrigen) === Number(idDestino)) return fallar('La ubicación de origen y la de destino deben ser distintas.')
    const n = Number(cantidad)
    if (!Number.isInteger(n) || n <= 0) return fallar('La cantidad debe ser un número entero mayor a 0.')
    const origen = stockDe(idVariante, idOrigen)
    const disponible = origen?.cantidad ?? 0
    if (n > disponible) return fallar(`Stock insuficiente en el origen: hay ${disponible} unidad(es).`)

    origen.cantidad -= n
    const destino = stockDe(idVariante, idDestino)
    if (destino) destino.cantidad += n
    else db.stock.push({ idStock: siguienteId(db.stock, 'idStock'), idVariante: Number(idVariante), idUbicacion: Number(idDestino), cantidad: n })

    const traspaso = {
      idTraspaso: siguienteId(db.traspasos, 'idTraspaso'),
      idVariante: Number(idVariante),
      idOrigen: Number(idOrigen),
      idDestino: Number(idDestino),
      cantidad: n,
      fecha: hoyISO()
    }
    db.traspasos.push(traspaso)
    guardar()
    return responder(traspaso)
  }
}

/* ---------- Ventas (CU14, CU15, CU16, CU17) ---------- */

function detallesDe(idVenta) {
  return db.detallesVenta
    .filter((d) => d.idVenta === Number(idVenta))
    .map((d) => {
      const v = variantePorId(d.idVariante)
      const p = prendaPorId(v.idPrenda)
      return { ...d, codigo: p.codigo, prenda: p.nombre, talla: v.talla, color: v.color }
    })
}

export const ventas = {
  // CU15 – Historial filtrando por fecha y tienda (RF21)
  listar({ idUbicacion, desde, hasta, estado } = {}) {
    const lista = db.ventas
      .filter(
        (v) =>
          (!idUbicacion || v.idUbicacion === Number(idUbicacion)) &&
          (!desde || v.fecha >= desde) &&
          (!hasta || v.fecha <= hasta) &&
          (!estado || v.estado === estado)
      )
      .map((v) => ({
        ...v,
        tienda: ubicacionPorId(v.idUbicacion)?.nombre,
        unidades: db.detallesVenta.filter((d) => d.idVenta === v.idVenta).reduce((n, d) => n + d.cantidad, 0)
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.idVenta - a.idVenta)
    return responder(lista)
  },

  // CU15 – Detalle de una venta (RF22)
  obtener(id) {
    const v = db.ventas.find((x) => x.idVenta === Number(id))
    if (!v) return fallar('La venta no existe.')
    const u = ubicacionPorId(v.idUbicacion)
    return responder({
      ...v,
      tienda: u?.nombre,
      direccion: u?.direccion,
      usuario: db.usuarios.find((x) => x.idUsuario === v.idUsuario)?.nombre,
      detalles: detallesDe(v.idVenta)
    })
  },

  // CU14 – Registrar venta (RF20): valida stock de la tienda, calcula total y descuenta stock
  registrar({ idUbicacion, idUsuario, items }) {
    if (!esTienda(idUbicacion)) return fallar('Las ventas solo se registran en una tienda.')
    if (!items?.length) return fallar('Agrega al menos una prenda a la venta.')

    const porVariante = new Map()
    for (const it of items) {
      const n = Number(it.cantidad)
      if (!Number.isInteger(n) || n <= 0) return fallar('Las cantidades deben ser enteros mayores a 0.')
      porVariante.set(Number(it.idVariante), (porVariante.get(Number(it.idVariante)) ?? 0) + n)
    }
    for (const [idVariante, cantidad] of porVariante) {
      const v = variantePorId(idVariante)
      if (!v) return fallar('Hay una prenda que ya no existe.')
      const disponible = stockDe(idVariante, idUbicacion)?.cantidad ?? 0
      if (cantidad > disponible) {
        const p = prendaPorId(v.idPrenda)
        return fallar(`Stock insuficiente de ${p.nombre} ${v.talla}/${v.color}: hay ${disponible} unidad(es).`)
      }
    }

    const idVenta = siguienteId(db.ventas, 'idVenta')
    let total = 0
    let idDetalle = siguienteId(db.detallesVenta, 'idDetalle')
    for (const [idVariante, cantidad] of porVariante) {
      const precioUnitario = prendaPorId(variantePorId(idVariante).idPrenda).precioVenta
      const subtotal = precioUnitario * cantidad
      total += subtotal
      db.detallesVenta.push({ idDetalle: idDetalle++, idVenta, idVariante, cantidad, precioUnitario, subtotal })
      stockDe(idVariante, idUbicacion).cantidad -= cantidad
    }
    const venta = { idVenta, idUbicacion: Number(idUbicacion), idUsuario: idUsuario ?? 1, fecha: hoyISO(), total, estado: 'vigente' }
    db.ventas.push(venta)
    guardar()
    return responder(venta)
  },

  // CU16 – Anular venta (RF23): devuelve las unidades al stock de la tienda
  anular(id) {
    const v = db.ventas.find((x) => x.idVenta === Number(id))
    if (!v) return fallar('La venta no existe.')
    if (v.estado === 'anulada') return fallar('La venta ya está anulada.')
    for (const d of db.detallesVenta.filter((x) => x.idVenta === v.idVenta)) {
      const s = stockDe(d.idVariante, v.idUbicacion)
      if (s) s.cantidad += d.cantidad
      else db.stock.push({ idStock: siguienteId(db.stock, 'idStock'), idVariante: d.idVariante, idUbicacion: v.idUbicacion, cantidad: d.cantidad })
    }
    v.estado = 'anulada'
    guardar()
    return responder(v)
  }
}

/* ---------- Catálogo público (CU12, CU13) ---------- */
// Nunca expone precio de compra ni datos internos; el almacén no se muestra al cliente.

function vistaPublica(p) {
  const vars = variantesDe(p.idPrenda)
  return {
    idPrenda: p.idPrenda,
    nombre: p.nombre,
    descripcion: p.descripcion,
    categoria: categoriaNombre(p.idCategoria),
    precioVenta: p.precioVenta,
    imagen: p.imagen,
    tallas: [...new Set(vars.map((v) => v.talla))],
    colores: [...new Set(vars.map((v) => v.color))]
  }
}

export const catalogo = {
  // Filtro por categoría, talla y color
  listar(filtros = {}) {
    return responder(db.prendas.filter((p) => p.activo && coincideFiltros(p, filtros)).map(vistaPublica))
  },

  detalle(id) {
    const p = prendaPorId(id)
    if (!p || !p.activo) return fallar('La prenda no está disponible.')
    const disponibilidad = db.ubicaciones
      .filter((u) => u.tipo === 'tienda')
      .map((u) => {
        const variantesConStock = variantesDe(p.idPrenda)
          .filter((v) => (stockDe(v.idVariante, u.idUbicacion)?.cantidad ?? 0) > 0)
          .map((v) => ({ talla: v.talla, color: v.color }))
        return { idUbicacion: u.idUbicacion, nombre: u.nombre, direccion: u.direccion, variantes: variantesConStock }
      })
      .filter((u) => u.variantes.length > 0)
    return responder({ ...vistaPublica(p), disponibilidad })
  },

  filtros() {
    const activas = new Set(db.prendas.filter((p) => p.activo).map((p) => p.idPrenda))
    const vars = db.variantes.filter((v) => activas.has(v.idPrenda))
    return responder({
      categorias: db.categorias,
      tallas: [...new Set(vars.map((v) => v.talla))],
      colores: [...new Set(vars.map((v) => v.color))]
    })
  }
}

/* ---------- Reportes (CU10) ---------- */
// Las ventas anuladas no cuentan en ventas, ganancias ni más vendidas.

function detallesFiltrados({ idUbicacion, desde, hasta }) {
  const lista = db.ventas.filter(
    (v) =>
      v.estado === 'vigente' &&
      (!idUbicacion || v.idUbicacion === Number(idUbicacion)) &&
      (!desde || v.fecha >= desde) &&
      (!hasta || v.fecha <= hasta)
  )
  const ids = new Set(lista.map((v) => v.idVenta))
  return { ventas: lista, detalles: db.detallesVenta.filter((d) => ids.has(d.idVenta)) }
}

function agruparPorPrenda(detalles) {
  const mapa = new Map()
  for (const d of detalles) {
    const p = prendaPorId(variantePorId(d.idVariante).idPrenda)
    const fila = mapa.get(p.idPrenda) ?? { codigo: p.codigo, prenda: p.nombre, unidades: 0, ingreso: 0, costo: 0 }
    fila.unidades += d.cantidad
    fila.ingreso += d.subtotal
    fila.costo += p.precioCompra * d.cantidad
    mapa.set(p.idPrenda, fila)
  }
  return [...mapa.values()]
}

const generadores = {
  // RF15: general y por ubicación (incluye el almacén)
  inventario({ idUbicacion }) {
    const filas = db.stock
      .filter((s) => !idUbicacion || s.idUbicacion === Number(idUbicacion))
      .map(filaStock)
      .sort((a, b) => a.codigo.localeCompare(b.codigo) || a.ubicacion.localeCompare(b.ubicacion))
      .map((s) => {
        const p = prendaPorId(s.idPrenda)
        return [s.codigo, s.prenda, s.talla, s.color, s.ubicacion, s.cantidad, p.precioCompra * s.cantidad]
      })
    return {
      titulo: 'Reporte de inventario',
      columnas: ['Código', 'Prenda', 'Talla', 'Color', 'Ubicación', 'Unidades', 'Valor (costo)'],
      monedas: [6],
      filas,
      totales: { Unidades: filas.reduce((n, f) => n + f[5], 0), 'Valor total': filas.reduce((n, f) => n + f[6], 0) }
    }
  },

  // RF16: por rango de fechas y por tienda
  ventas(filtros) {
    const { ventas: lista, detalles } = detallesFiltrados(filtros)
    const filas = lista
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((v) => [
        v.fecha,
        `#${v.idVenta}`,
        ubicacionPorId(v.idUbicacion)?.nombre,
        detalles.filter((d) => d.idVenta === v.idVenta).reduce((n, d) => n + d.cantidad, 0),
        v.total
      ])
    return {
      titulo: 'Reporte de ventas',
      columnas: ['Fecha', 'Venta', 'Tienda', 'Unidades', 'Total'],
      fechas: [0],
      monedas: [4],
      filas,
      totales: { Ventas: filas.length, 'Total vendido': filas.reduce((n, f) => n + f[4], 0) }
    }
  },

  // RF17
  ganancias(filtros) {
    const filas = agruparPorPrenda(detallesFiltrados(filtros).detalles)
      .sort((a, b) => b.ingreso - b.costo - (a.ingreso - a.costo))
      .map((f) => [f.codigo, f.prenda, f.unidades, f.ingreso, f.costo, f.ingreso - f.costo])
    return {
      titulo: 'Reporte de ganancias',
      columnas: ['Código', 'Prenda', 'Unidades', 'Ingreso', 'Costo', 'Ganancia'],
      monedas: [3, 4, 5],
      filas,
      totales: {
        Ingreso: filas.reduce((n, f) => n + f[3], 0),
        Costo: filas.reduce((n, f) => n + f[4], 0),
        Ganancia: filas.reduce((n, f) => n + f[5], 0)
      }
    }
  },

  // RF18
  masVendidas(filtros) {
    const filas = agruparPorPrenda(detallesFiltrados(filtros).detalles)
      .sort((a, b) => b.unidades - a.unidades || b.ingreso - a.ingreso)
      .slice(0, 10)
      .map((f, i) => [i + 1, f.codigo, f.prenda, f.unidades, f.ingreso])
    return {
      titulo: 'Prendas más vendidas',
      columnas: ['#', 'Código', 'Prenda', 'Unidades vendidas', 'Ingreso'],
      monedas: [4],
      filas,
      totales: { 'Unidades vendidas': filas.reduce((n, f) => n + f[3], 0) }
    }
  }
}

export const reportes = {
  generar({ tipo, idUbicacion, desde, hasta }) {
    const generador = generadores[tipo]
    if (!generador) return fallar('Tipo de reporte no válido.')
    if (desde && hasta && desde > hasta) return fallar('La fecha de inicio no puede ser posterior a la fecha fin.')
    return responder(generador({ idUbicacion, desde, hasta }))
  }
}

// Utilidad para desarrollo: vuelve a los datos de ejemplo.
export function reiniciarDatos() {
  db = crearSeed()
  guardar()
}
