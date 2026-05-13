import { useState } from 'react'
import { jsonToXml, calcularEstadisticas } from '../utils/xmlGenerator'

const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

function ArbolXml({ xml }) {
  const lineas = xml.split('\n')

  const colorLinea = (linea) => {
    if (linea.includes('<?xml')) return '#888'
    if (linea.trim().startsWith('</')) return '#0F6E56'
    if (linea.trim().startsWith('<empleados')) return '#185FA5'
    if (linea.trim().startsWith('<empleado>')) return '#854F0B'
    return '#b8adad'
  } 

  const pesoLinea = (linea) => {
    if (linea.trim() === '<empleado>' || linea.trim() === '</empleado>') return 600
    if (linea.trim().startsWith('<empleados')) return 700
    return 400
  }

  return (
    <div style={s.xmlBox}>
      {lineas.map((linea, i) => (
        <div key={i} style={{ ...s.xmlLinea, color: colorLinea(linea), fontWeight: pesoLinea(linea) }}>
          <span style={s.lineaNum}>{i + 1}</span>
          <span>{linea}</span>
        </div>
      ))}
    </div>
  )
}

function Informes({ empleados, onVolver }) {
  const [copiado, setCopiado] = useState(false)
  const xml = jsonToXml(empleados)
  const stats = calcularEstadisticas(empleados)

  const copiarXml = () => {
    navigator.clipboard.writeText(xml)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const descargarXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'empleados.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.pagina}>
      <div style={s.contenedor}>

        {/* Encabezado */}
        <div style={s.header}>
          <div>
            <h1 style={s.titulo}>Informes y XML</h1>
            <p style={s.subtitulo}>Visualización de datos · Estadísticas · Exportación XML</p>
          </div>
          <button style={s.btnVolver} onClick={onVolver}>← Volver</button>
        </div>

        {/* Tarjetas de resumen */}
        <div style={s.metricas}>
          {[
            ['Total empleados', stats.total, '100%'],
            ['Empleados activos', stats.activos, `${stats.total ? Math.round((stats.activos / stats.total) * 100) : 0}%`],
            ['Empleados inactivos', stats.total - stats.activos, `${stats.total ? Math.round(((stats.total - stats.activos) / stats.total) * 100) : 0}%`],
            ['Masa salarial total', fmt(stats.masaSalarial), 'total'],
          ].map(([label, valor, pct]) => (
            <div key={label} style={s.metrica}>
              <p style={s.metricaLabel}>{label}</p>
              <p style={s.metricaValor}>{valor}</p>
              <p style={s.metricaPct}>{pct}</p>
            </div>
          ))}
        </div>

        {/* Tabla por departamento */}
        <div style={s.seccion}>
          <h2 style={s.seccionTitulo}>Distribución por departamento</h2>
          <table style={s.tabla}>
            <thead>
              <tr style={s.theadRow}>
                {['Departamento', 'Empleados', '% del total', 'Salario promedio', 'Salario total'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.porDepartamento).map(([depto, datos], i, arr) => (
                <tr key={depto} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={s.td}>
                    <span style={s.badge}>{depto}</span>
                  </td>
                  <td style={s.td}>{datos.cantidad}</td>
                  <td style={s.td}>
                    <div style={s.barraWrap}>
                      <div style={{ ...s.barra, width: `${Math.round((datos.cantidad / stats.total) * 100)}%` }} />
                      <span style={s.barraPct}>{Math.round((datos.cantidad / stats.total) * 100)}%</span>
                    </div>
                  </td>
                  <td style={s.td}>{fmt(Math.round(datos.salarioTotal / datos.cantidad))}</td>
                  <td style={s.td}>{fmt(datos.salarioTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Árbol XML */}
        <div style={s.seccion}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={s.seccionTitulo}>Árbol XML generado desde JSON</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.btnAccion} onClick={copiarXml}>
                {copiado ? '✓ Copiado' : 'Copiar XML'}
              </button>
              <button style={{ ...s.btnAccion, background: '#0F6E56', color: '#fff', border: 'none' }} onClick={descargarXml}>
                Descargar .xml
              </button>
            </div>
          </div>
          <ArbolXml xml={xml} />
        </div>

      </div>
    </div>
  )
}

const s = {
  pagina: { minHeight: '100vh', background: '#f5f5f5', padding: '2rem 1rem' },
  contenedor: { maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  titulo: { fontSize: 24, fontWeight: 700 },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 4 },
  btnVolver: { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.5rem' },
  metrica: { background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', border: '1px solid #eee' },
  metricaLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  metricaValor: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  metricaPct: { fontSize: 12, color: '#0F6E56', fontWeight: 600 },
  seccion: { background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #eee', marginBottom: '1.5rem' },
  seccionTitulo: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888' },
  td: { padding: '12px 14px', fontSize: 13 },
  badge: { background: '#E1F5EE', color: '#085041', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  barraWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  barra: { height: 8, borderRadius: 4, background: '#0F6E56', minWidth: 4, maxWidth: '60%' },
  barraPct: { fontSize: 12, color: '#555', fontWeight: 600 },
  xmlBox: { background: '#1e1e1e', borderRadius: 8, padding: '1rem', overflowX: 'auto', fontFamily: 'Consolas, monospace', fontSize: 13, lineHeight: 1.7 },
  xmlLinea: { display: 'flex', gap: 16, whiteSpace: 'pre' },
  lineaNum: { color: '#555', minWidth: 28, textAlign: 'right', userSelect: 'none' },
  btnAccion: { padding: '6px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' },
}

export default Informes