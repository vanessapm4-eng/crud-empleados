import { useState, useEffect } from 'react'
import axios from 'axios'
import EmpleadoForm from './components/EmpleadoForm'
import Informes from './components/Informes'
import Login from './components/Login'
import UsuariosPanel from './components/UsuariosPanel'

const API = 'https://crud-empleados-backend.onrender.com/api/empleados'
const formVacio = { nombre: '', cargo: '', departamento: '', salario: '', activo: true }
const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const iniciales = n => n.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase()

function App() {
  const [empleados, setEmpleados] = useState([])
  const [form, setForm] = useState(formVacio)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [vistaInformes, setVistaInformes] = useState(false)
  const [vistaUsuarios, setVistaUsuarios] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [rol, setRol] = useState(null)
  const [email, setEmail] = useState(null)

  useEffect(() => { if (usuario) cargar() }, [usuario])

  const cargar = async () => {
    const res = await axios.get(API)
    setEmpleados(res.data)
  }

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 2500)
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleGuardar = async () => {
    setErrorServidor(null)
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, form)
        mostrarMensaje('Empleado actualizado correctamente')
      } else {
        await axios.post(API, form)
        mostrarMensaje('Empleado creado correctamente')
      }
      setShowForm(false)
      setEditId(null)
      setForm(formVacio)
      cargar()
    } catch (error) {
      const errores = error.response?.data?.errores
      if (errores) setErrorServidor(errores.join(', '))
      else setErrorServidor('Ocurrió un error inesperado')
    }
  }

  const handleEditar = emp => {
    setForm({ nombre: emp.nombre, cargo: emp.cargo, departamento: emp.departamento, salario: emp.salario, activo: emp.activo })
    setEditId(emp.id)
    setShowForm(true)
  }

  const handleEliminar = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este empleado?')) return
    await axios.delete(`${API}/${id}`)
    mostrarMensaje('Empleado eliminado', 'info')
    cargar()
  }

  const cerrarSesion = () => {
    setUsuario(null)
    setRol(null)
    setEmail(null)
    setEmpleados([])
  }

  const filtrados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.cargo.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.departamento.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Sin sesión → Login
  if (!usuario) {
    return <Login onLogin={(nombre, rolUsuario, emailUsuario) => {
      setUsuario(nombre)
      setRol(rolUsuario)
      setEmail(emailUsuario)
    }} />
  }

  // Vista usuarios
  if (vistaUsuarios) {
    return <UsuariosPanel onVolver={() => setVistaUsuarios(false)} usuarioActual={email} />
  }

  // Vista informes
  if (vistaInformes) {
    return <Informes empleados={empleados} onVolver={() => setVistaInformes(false)} />
  }

  return (
    <div style={s.pagina}>
      {mensaje && (
        <div style={{ ...s.toast, background: mensaje.tipo === 'error' ? '#A32D2D' : mensaje.tipo === 'info' ? '#185FA5' : '#0F6E56' }}>
          {mensaje.texto}
        </div>
      )}

      {showForm && rol === 'admin' && (
        <EmpleadoForm
          form={form}
          onChange={handleChange}
          onSubmit={handleGuardar}
          onCancel={() => { setShowForm(false); setEditId(null); setForm(formVacio); setErrorServidor(null) }}
          editando={!!editId}
          errorServidor={errorServidor}
        />
      )}

      <div style={s.contenedor}>
        <div style={s.header}>
          <div>
            <h1 style={s.titulo}>Gestión de Empleados</h1>
            <p style={s.subtitulo}>
              Bienvenido, <strong>{usuario}</strong> ·{' '}
              <span style={{
                background: rol === 'admin' ? '#E1F5EE' : '#E6F1FB',
                color: rol === 'admin' ? '#085041' : '#0C447C',
                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600
              }}>
                {rol === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.btnInformes} onClick={() => setVistaInformes(true)}>Informes XML</button>
            {rol === 'admin' && (
              <>
                <button style={s.btnUsuarios} onClick={() => setVistaUsuarios(true)}>Usuarios</button>
                <button style={s.btnNuevo} onClick={() => setShowForm(true)}>+ Nuevo empleado</button>
              </>
            )}
            <button style={s.btnCerrar} onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </div>

        <div style={s.metricas}>
          {[
            ['Total empleados', empleados.length],
            ['Activos', empleados.filter(e => e.activo).length],
            ['Masa salarial', fmt(empleados.reduce((a, e) => a + Number(e.salario), 0))],
          ].map(([label, valor]) => (
            <div key={label} style={s.metrica}>
              <p style={s.metricaLabel}>{label}</p>
              <p style={s.metricaValor}>{valor}</p>
            </div>
          ))}
        </div>

        <input
          style={s.buscador}
          placeholder="Buscar por nombre, cargo o departamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        <div style={s.tablaWrap}>
          <table style={s.tabla}>
            <thead>
              <tr style={s.theadRow}>
                {['Nombre', 'Cargo', 'Departamento', 'Salario', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#999' }}>Sin resultados</td></tr>
              )}
              {filtrados.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.avatar}>{iniciales(emp.nombre)}</div>
                      <span style={{ fontWeight: 500 }}>{emp.nombre}</span>
                    </div>
                  </td>
                  <td style={{ ...s.td, color: '#666' }}>{emp.cargo}</td>
                  <td style={{ ...s.td, color: '#666' }}>{emp.departamento}</td>
                  <td style={s.td}>{fmt(emp.salario)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: emp.activo ? '#E1F5EE' : '#F1EFE8', color: emp.activo ? '#085041' : '#444' }}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {rol === 'admin' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={s.btnEditar} onClick={() => handleEditar(emp)}>Editar</button>
                        <button style={s.btnEliminar} onClick={() => handleEliminar(emp.id)}>Eliminar</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#aaa' }}>Solo lectura</span>
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
  contenedor: { maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  titulo: { fontSize: 24, fontWeight: 700 },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 4 },
  btnNuevo: { background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnInformes: { background: '#fff', color: '#0F6E56', border: '1px solid #0F6E56', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnUsuarios: { background: '#fff', color: '#854F0B', border: '1px solid #BA7517', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnCerrar: { background: '#fff', color: '#A32D2D', border: '1px solid #F09595', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' },
  metrica: { background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', border: '1px solid #eee' },
  metricaLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  metricaValor: { fontSize: 22, fontWeight: 700 },
  buscador: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginBottom: '1rem', boxSizing: 'border-box' },
  tablaWrap: { background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888' },
  td: { padding: '12px 16px', fontSize: 13 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#085041', flexShrink: 0 },
  badge: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  btnEditar: { fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' },
  btnEliminar: { fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #ffb3b3', background: 'transparent', color: '#A32D2D', cursor: 'pointer' },
}

export default App