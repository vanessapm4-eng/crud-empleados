import { useState } from 'react'
import axios from 'axios'

const BASE = 'https://crud-empleados-backend.onrender.com/api'
function Login({ onLogin }) {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [errores, setErrores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(null)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrores([])
  }

  const handleSubmit = async () => {
    setErrores([])
    setExito(null)

    if (modo === 'registro' && form.password !== form.confirmar) {
      setErrores(['Las contraseñas no coinciden'])
      return
    }

    setCargando(true)
    try {
      if (modo === 'registro') {
        await axios.post(`${BASE}/registro`, form)
        setExito('¡Cuenta creada! Ahora inicia sesión.')
        setModo('login')
        setForm({ nombre: '', email: '', password: '', confirmar: '' })
      } else {
        const res = await axios.post(`${BASE}/login`, form)
        onLogin(res.data.nombre, res.data.rol, res.data.email)
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.errores) setErrores(data.errores)
      else if (data?.mensaje) setErrores([data.mensaje])
      else setErrores(['Ocurrió un error inesperado'])
    } finally {
      setCargando(false)
    }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSubmit() }

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo)
    setErrores([])
    setExito(null)
    setForm({ nombre: '', email: '', password: '', confirmar: '' })
  }

  return (
    <div style={s.pagina}>
      <div style={s.card}>
        <h1 style={s.titulo}>Gestión de Empleados</h1>
        <p style={s.subtitulo}>{modo === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(modo === 'login' ? s.tabActivo : {}) }} onClick={() => cambiarModo('login')}>
            Iniciar sesión
          </button>
          <button style={{ ...s.tab, ...(modo === 'registro' ? s.tabActivo : {}) }} onClick={() => cambiarModo('registro')}>
            Registrarse
          </button>
        </div>

        {/* Éxito */}
        {exito && <div style={s.exitoBanner}>{exito}</div>}

        {/* Errores */}
        {errores.length > 0 && (
          <div style={s.errorBanner}>
            {errores.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}

        {/* Nombre — solo registro */}
        {modo === 'registro' && (
          <>
            <label style={s.label}>Nombre completo</label>
            <input
              style={s.input}
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Ej: María López"
            />
          </>
        )}

        {/* Email */}
        <label style={s.label}>Correo electrónico</label>
        <input
          style={s.input}
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ej: maria@empresa.com"
        />

        {/* Contraseña */}
        <label style={s.label}>
          Contraseña {modo === 'registro' && <span style={{ color: '#aaa' }}>(mínimo 6 caracteres)</span>}
        </label>
        <input
          style={s.input}
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="••••••••"
        />

        {/* Confirmar contraseña — solo registro */}
        {modo === 'registro' && (
          <>
            <label style={s.label}>Confirmar contraseña</label>
            <input
              style={s.input}
              name="confirmar"
              type="password"
              value={form.confirmar}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
            />
          </>
        )}

        {/* Botón */}
        <button style={s.btnSubmit} onClick={handleSubmit} disabled={cargando}>
          {cargando ? 'Procesando...' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>

        {/* Nota solo en registro */}
        {modo === 'registro' && (
          <p style={s.nota}>Crea una cuenta para acceder a la plataforma.</p>
        )}
      </div>
    </div>
  )
}

const s = {
  pagina: { minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', borderRadius: 16, padding: '2rem', width: 380, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 8 },
  icono: { fontSize: 36, textAlign: 'center' },
  titulo: { fontSize: 20, fontWeight: 700, textAlign: 'center', margin: 0 },
  subtitulo: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 4 },
  tabs: { display: 'flex', background: '#f5f5f5', borderRadius: 8, padding: 3, gap: 3, marginBottom: 4 },
  tab: { flex: 1, padding: '7px', borderRadius: 6, border: 'none', background: 'transparent', fontSize: 13, cursor: 'pointer', color: '#888', fontWeight: 500 },
  tabActivo: { background: '#fff', color: '#0F6E56', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  exitoBanner: { background: '#E1F5EE', border: '1px solid #1D9E75', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#085041' },
  errorBanner: { background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: 12, color: '#666', marginTop: 4 },
  input: { padding: '10px 14px', borderRadius: 8, fontSize: 14, border: '1px solid #ddd', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnSubmit: { marginTop: 10, padding: '11px', borderRadius: 8, fontSize: 14, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, cursor: 'pointer', width: '100%' },
  nota: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4, lineHeight: 1.5 },
}

export default Login