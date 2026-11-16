// Datos de ejemplo para trabajar sin backend. Siguen el modelo de contenido UWE (sección 4).

function imagenSvg(fondo, prenda) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${fondo}"/>
    <path d="M72 38 L48 50 L24 78 L44 98 L60 88 L60 168 L140 168 L140 88 L156 98 L176 78 L152 50 L128 38 Q100 58 72 38 Z"
      fill="${prenda}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

function fechaHace(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export function crearSeed() {
  const usuarios = [
    // RNF01: en el backend real la contraseña se guardará cifrada; aquí es solo un dato de prueba.
    { idUsuario: 1, nombre: 'Dueño', usuario: 'admin', contrasena: 'admin123', rol: 'dueno' }
  ]

  const categorias = [
    { idCategoria: 1, nombre: 'Chaquetas' },
    { idCategoria: 2, nombre: 'Polos' },
    { idCategoria: 3, nombre: 'Otros' }
  ]

  // tipo distingue las tiendas (venden) del almacén (solo guarda y distribuye)
  const ubicaciones = [
    { idUbicacion: 1, nombre: 'Tienda Mercado Campero', tipo: 'tienda', direccion: 'Mercado Campero' },
    { idUbicacion: 2, nombre: 'Tienda Super Feria', tipo: 'tienda', direccion: 'Super Feria (feria ambulante)' },
    { idUbicacion: 3, nombre: 'Almacén principal', tipo: 'almacen', direccion: 'Depósito del negocio' }
  ]

  const prendas = [
    { idPrenda: 1, codigo: 'CHA-001', nombre: 'Chaqueta de cuero sintético', descripcion: 'Chaqueta con cierre metálico y forro interior.', idCategoria: 1, precioCompra: 180, precioVenta: 320, imagen: imagenSvg('#f7f7f5', '#1a1a1a'), activo: true },
    { idPrenda: 2, codigo: 'CHA-002', nombre: 'Chaqueta jean clásica', descripcion: 'Chaqueta de mezclilla con botones y bolsillos al pecho.', idCategoria: 1, precioCompra: 120, precioVenta: 220, imagen: imagenSvg('#ebf4ff', '#2b6cb0'), activo: true },
    { idPrenda: 3, codigo: 'CHA-003', nombre: 'Chaqueta polar', descripcion: 'Chaqueta abrigada de tela polar, ideal para el frío.', idCategoria: 1, precioCompra: 90, precioVenta: 170, imagen: imagenSvg('#f0fff4', '#2f855a'), activo: true },
    { idPrenda: 4, codigo: 'POL-001', nombre: 'Polo básico algodón', descripcion: 'Polo de algodón peinado, corte recto y cuello redondo.', idCategoria: 2, precioCompra: 35, precioVenta: 60, imagen: imagenSvg('#eef2f7', '#2d3748'), activo: true },
    { idPrenda: 5, codigo: 'POL-002', nombre: 'Polo oversize estampado', descripcion: 'Polo holgado con estampado frontal.', idCategoria: 2, precioCompra: 45, precioVenta: 85, imagen: imagenSvg('#fdf2f2', '#c53030'), activo: true },
    { idPrenda: 6, codigo: 'OTR-001', nombre: 'Jean slim azul', descripcion: 'Pantalón jean de mezclilla elástica, corte slim.', idCategoria: 3, precioCompra: 90, precioVenta: 160, imagen: imagenSvg('#e6effa', '#2a4365'), activo: true },
    { idPrenda: 7, codigo: 'CHA-004', nombre: 'Chaqueta rompevientos', descripcion: 'Modelo de temporada pasada.', idCategoria: 1, precioCompra: 120, precioVenta: 200, imagen: imagenSvg('#fffaf0', '#c05621'), activo: false }
  ]

  const variantes = [
    { idVariante: 1, idPrenda: 1, talla: 'M', color: 'Negro' },
    { idVariante: 2, idPrenda: 1, talla: 'L', color: 'Negro' },
    { idVariante: 3, idPrenda: 1, talla: 'L', color: 'Marrón' },
    { idVariante: 4, idPrenda: 2, talla: 'S', color: 'Azul' },
    { idVariante: 5, idPrenda: 2, talla: 'M', color: 'Azul' },
    { idVariante: 6, idPrenda: 2, talla: 'L', color: 'Azul' },
    { idVariante: 7, idPrenda: 3, talla: 'M', color: 'Verde' },
    { idVariante: 8, idPrenda: 3, talla: 'L', color: 'Gris' },
    { idVariante: 9, idPrenda: 4, talla: 'S', color: 'Negro' },
    { idVariante: 10, idPrenda: 4, talla: 'M', color: 'Negro' },
    { idVariante: 11, idPrenda: 4, talla: 'M', color: 'Blanco' },
    { idVariante: 12, idPrenda: 4, talla: 'L', color: 'Blanco' },
    { idVariante: 13, idPrenda: 5, talla: 'M', color: 'Rojo' },
    { idVariante: 14, idPrenda: 5, talla: 'L', color: 'Rojo' },
    { idVariante: 15, idPrenda: 6, talla: 'M', color: 'Azul' },
    { idVariante: 16, idPrenda: 6, talla: 'L', color: 'Azul' },
    { idVariante: 17, idPrenda: 7, talla: 'M', color: 'Naranja' }
  ]

  // [idVariante, idUbicacion, cantidad] — 1 Mercado Campero, 2 Super Feria, 3 Almacén
  const cantidades = [
    [1, 1, 2], [1, 3, 6], [2, 2, 3], [2, 3, 4], [3, 1, 1],
    [4, 1, 3], [5, 1, 4], [5, 2, 2], [5, 3, 8], [6, 2, 3],
    [7, 1, 2], [7, 3, 5], [8, 2, 2],
    [9, 1, 8], [9, 3, 20], [10, 1, 6], [10, 2, 5], [10, 3, 15], [11, 2, 6], [12, 1, 4], [12, 3, 10],
    [13, 1, 5], [13, 2, 4], [14, 2, 3], [14, 3, 6],
    [15, 1, 4], [15, 2, 3], [16, 3, 8],
    [17, 3, 2]
  ]
  const stock = cantidades.map(([idVariante, idUbicacion, cantidad], i) => ({ idStock: i + 1, idVariante, idUbicacion, cantidad }))

  const traspasos = [
    { idTraspaso: 1, idVariante: 10, idOrigen: 3, idDestino: 1, cantidad: 6, fecha: fechaHace(20) },
    { idTraspaso: 2, idVariante: 5, idOrigen: 3, idDestino: 2, cantidad: 2, fecha: fechaHace(12) },
    { idTraspaso: 3, idVariante: 13, idOrigen: 1, idDestino: 2, cantidad: 2, fecha: fechaHace(5) }
  ]

  const precio = Object.fromEntries(variantes.map((v) => [v.idVariante, prendas.find((p) => p.idPrenda === v.idPrenda).precioVenta]))
  // [idUbicacion (solo tiendas), hace cuántos días, ítems [idVariante, cantidad], estado]
  const ventasBase = [
    [1, 40, [[9, 2], [15, 1]], 'vigente'], [2, 35, [[13, 1]], 'vigente'], [1, 28, [[1, 1], [10, 1]], 'vigente'],
    [1, 21, [[12, 2]], 'vigente'], [2, 18, [[14, 1], [6, 1]], 'vigente'], [2, 12, [[11, 1], [5, 1]], 'vigente'],
    [1, 9, [[9, 3]], 'vigente'], [2, 6, [[2, 1]], 'anulada'], [1, 4, [[4, 1], [10, 1]], 'vigente'],
    [2, 2, [[15, 1], [10, 2]], 'vigente'], [1, 1, [[7, 1]], 'vigente']
  ]
  const ventas = []
  const detallesVenta = []
  ventasBase.forEach(([idUbicacion, dias, items, estado], i) => {
    const idVenta = i + 1
    let total = 0
    for (const [idVariante, cantidad] of items) {
      const subtotal = precio[idVariante] * cantidad
      total += subtotal
      detallesVenta.push({ idDetalle: detallesVenta.length + 1, idVenta, idVariante, cantidad, precioUnitario: precio[idVariante], subtotal })
    }
    ventas.push({ idVenta, idUbicacion, idUsuario: 1, fecha: fechaHace(dias), total, estado })
  })

  return { usuarios, categorias, ubicaciones, prendas, variantes, stock, traspasos, ventas, detallesVenta }
}
