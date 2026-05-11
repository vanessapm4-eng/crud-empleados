import { useState } from 'react'

function EmpleadoForm({ form, onChange, onSubmit, onCancel, editando, errorServidor }) {
  const [errores, setErrores] = useState({})

  const validar = () => {
    const nuevosErrores = {}

    if (!form.nombre || form.nombre.trim().length < 3)
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres'

    if (!form.cargo || form.cargo === '')
      nuevosErrores.cargo = 'Selecciona un cargo'

    if (!form.departamento || form.departamento === '')
      nuevosErrores.departamento = 'Selecciona un departamento'

    if (!form.salario || isNaN(form.salario))
      nuevosErrores.salario = 'Ingresa un salario válido'
    else if (Number(form.salario) < 1000000)
      nuevosErrores.salario = 'El salario debe ser mayor a $1.000.000'

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = () => {
    if (validar()) onSubmit()
  }

  const campo = (nombre) => ({
    border: `1px solid ${errores[nombre] ? '#E24B4A' : '#ddd'}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  })

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h2 style={s.titulo}>{editando ? 'Editar empleado' : 'Nuevo empleado'}</h2>

        {/* Error del servidor (nombre duplicado, etc) */}
        {errorServidor && (
          <div style={s.errorBanner}>{errorServidor}</div>
        )}

        {/* Nombre */}
        <label style={s.label}>Nombre completo</label>
        <input
          style={campo('nombre')}
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          placeholder="Ej: María López"
        />
        {errores.nombre && <span style={s.errorTexto}>{errores.nombre}</span>}

        {/* Cargo */}
        <label style={s.label}>Cargo</label>
        <select style={campo('cargo')} name="cargo" value={form.cargo} onChange={onChange}>
          <option value="">Seleccionar</option>
          <option>Desarrolladora Senior</option>
          <option>Desarrollador Junior</option>
          <option>Diseñador UX</option>
          <option>Project Manager</option>
          <option>Analista de Datos</option>
          <option>DevOps Engineer</option>
          <option>Director de Área</option>
        </select>
        {errores.cargo && <span style={s.errorTexto}>{errores.cargo}</span>}

        {/* Departamento */}
        <label style={s.label}>Departamento</label>
        <select style={campo('departamento')} name="departamento" value={form.departamento} onChange={onChange}>
          <option value="">Seleccionar</option>
          <option>Tecnología</option>
          <option>Producto</option>
          <option>Operaciones</option>
          <option>Finanzas</option>
          <option>Recursos Humanos</option>
          <option>Marketing</option>
        </select>
        {errores.departamento && <span style={s.errorTexto}>{errores.departamento}</span>}

        {/* Salario */}
        <label style={s.label}>Salario (COP)</label>
        <input
          style={campo('salario')}
          name="salario"
          type="number"
          value={form.salario}
          onChange={onChange}
          placeholder="Mínimo $1.000.000"
        />
        {errores.salario && <span style={s.errorTexto}>{errores.salario}</span>}

        {/* Activo */}
        <div style={s.checkRow}>
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={onChange}
            id="activo"
          />
          <label htmlFor="activo" style={{ fontSize: 14 }}>Empleado activo</label>
        </div>

        {/* Botones */}
        <div style={s.botones}>
          <button style={s.btnCancelar} onClick={onCancel}>Cancelar</button>
          <button style={s.btnGuardar} onClick={handleSubmit}>
            {editando ? 'Guardar cambios' : 'Crear empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12,
    padding: '1.5rem', width: 420,
    display: 'flex', flexDirection: 'column', gap: 6,
    maxHeight: '90vh', overflowY: 'auto',
  },
  titulo: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  label: { fontSize: 12, color: '#666', marginTop: 6 },
  errorTexto: { fontSize: 11, color: '#E24B4A', marginTop: 2 },
  errorBanner: {
    background: '#FCEBEB', border: '1px solid #F09595',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#A32D2D', marginBottom: 8,
  },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  botones: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 },
  btnCancelar: {
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    border: '1px solid #ddd', background: 'transparent', cursor: 'pointer',
  },
  btnGuardar: {
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    border: 'none', background: '#0F6E56', color: '#fff',
    fontWeight: 600, cursor: 'pointer',
  },
}

export default EmpleadoForm