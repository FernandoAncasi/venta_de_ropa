export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única']

export const COLORES = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Marrón', 'Naranja', 'Rosado']

export function moneda(valor) {
  return 'Bs ' + Number(valor || 0).toFixed(2)
}

export function fecha(valor) {
  if (!valor) return ''
  const [a, m, d] = valor.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function hoy() {
  return new Date().toISOString().slice(0, 10)
}
