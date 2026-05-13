const BASE = 'https://crud-empleados-backend.onrender.com/api'
import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE = 'http://localhost:3001/api'

function UsuariosPanel({ onVolver, usuarioActual }) {
  const [usuarios, setUsuarios] = useState([])
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const res = await axios.get(`${BASE}/usuarios`)
    setUsuarios(res.data)
  }

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 2500)
  }

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'admin' ? 'usuario' : 'admin'
    const nombre = usuarios.find(u => u.id === id)?.nombre
    if (!window.confirm(`¿Cambiar el rol de ${nombre} a ${nuevoRol === 'admin' ? 'Administrador' : 'Usuario'}?`)) return
    try {
      await axios.put(`${BASE}/usuarios/${id}/rol`, { rol: nuevoRol })
      mostrarMensaje(`Rol de ${nombre} actualizado correctamente`)
      cargar()
    } catch {
      mostrarMensaje('Error al actualizar el rol', 'error')
    }
  }

  return (
    <div style={s.pagina}>
      {mensaje && (
        <div style={{ ...s.toast, background: mensaje.tipo === 'error' ? '#A32D2D' : '#0F6E56' }}>
          {mensaje.texto}
        </div>
      )}

      <div style={s.contenedor}>
        <div style={s.header}>
          <div>
            <h1 style={s.titulo}>Gestión de Usuarios</h1>
            <p style={s.subtitulo}>Administra los roles y permisos del sistema</p>
          </div>
          <button style={s.btnVolver} onClick={onVolver}>← Volver</button>
        </div>

        <div style={s.tablaWrap}>
          <table style={s.tabla}>
            <thead>
              <tr style={s.theadRow}>
                {['Nombre', 'Correo', 'Rol actual', 'Acción'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#999' }}>Sin usuarios</td></tr>
              )}
              {usuarios.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.avatar}>{u.nombre.split(' ').slice(0,2).map(x => x[0]).join('').toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{u.nombre}</span>
                      {u.email === usuarioActual && (
                        <span style={{ fontSize: 10, background: '#E6F1FB', color: '#0C447C', padding: '2px 6px', borderRadius: 8 }}>Tú</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...s.td, color: '#666' }}>{u.email}</td>
                  <td style={s.td}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600,
                      background: u.rol === 'admin' ? '#E1F5EE' : '#E6F1FB',
                      color: u.rol === 'admin' ? '#085041' : '#0C447C'
                    }}>
                      {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {u.email === usuarioActual ? (
                      <span style={{ fontSize: 12, color: '#aaa' }}>Tu cuenta</span>
                    ) : (
                      <button
                        onClick={() => cambiarRol(u.id, u.rol)}
                        style={{
                          fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                          border: u.rol === 'admin' ? '1px solid #F09595' : '1px solid #1D9E75',
                          background: 'transparent',
                          color: u.rol === 'admin' ? '#A32D2D' : '#0F6E56'
                        }}
                      >
                        {u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const s = {
  pagina: { minHeight: '100vh', background: '#f5f5f5', padding: '2rem 1rem' },
  toast: { position: 'fixed', top: 20, right: 20, color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, zIndex: 9999 },
  contenedor: { maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  titulo: { fontSize: 24, fontWeight: 700 },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 4 },
  btnVolver: { padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' },
  tablaWrap: { background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888' },
  td: { padding: '12px 16px', fontSize: 13 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#085041', flexShrink: 0 },
}

export default UsuariosPanel