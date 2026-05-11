export function jsonToXml(empleados) {
  const escalar = str => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lineas = ['<?xml version="1.0" encoding="UTF-8"?>', '<empleados>']

  empleados.forEach(emp => {
    lineas.push('  <empleado>')
    lineas.push(`    <id>${emp.id}</id>`)
    lineas.push(`    <nombre>${escalar(emp.nombre)}</nombre>`)
    lineas.push(`    <cargo>${escalar(emp.cargo)}</cargo>`)
    lineas.push(`    <departamento>${escalar(emp.departamento)}</departamento>`)
    lineas.push(`    <salario>${emp.salario}</salario>`)
    lineas.push(`    <activo>${emp.activo}</activo>`)
    lineas.push('  </empleado>')
  })

  lineas.push('</empleados>')
  return lineas.join('\n')
}

export function calcularEstadisticas(empleados) {
  const total = empleados.length
  const masaSalarial = empleados.reduce((a, e) => a + Number(e.salario), 0)
  const activos = empleados.filter(e => e.activo).length

  const porDepartamento = {}
  empleados.forEach(e => {
    if (!porDepartamento[e.departamento]) {
      porDepartamento[e.departamento] = { cantidad: 0, salarioTotal: 0 }
    }
    porDepartamento[e.departamento].cantidad++
    porDepartamento[e.departamento].salarioTotal += Number(e.salario)
  })

  return { total, masaSalarial, activos, porDepartamento }
}