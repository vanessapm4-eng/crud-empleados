const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const db = new Database('empleados.db')

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    departamento TEXT NOT NULL,
    salario REAL NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario'
  );
`)

// Datos iniciales de empleados
const count = db.prepare('SELECT COUNT(*) as total FROM empleados').get()
if (count.total === 0) {
  const ins = db.prepare(`INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)`)
  ins.run('Ana García', 'Desarrolladora Senior', 'Tecnología', 5800000, 1)
  ins.run('Carlos Mejía', 'Diseñador UX', 'Producto', 4200000, 1)
  ins.run('Lucía Torres', 'Project Manager', 'Operaciones', 6100000, 0)
}

// Crear admin por defecto si no existe
const adminExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get('admin@empresa.com')
if (!adminExiste) {
  const hashAdmin = require('bcryptjs').hashSync('Admin1234', 10)
  db.prepare("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)").run('Administrador', 'admin@empresa.com', hashAdmin, 'admin')
  console.log(' Admin creado: admin@empresa.com / Admin1234')
}

const formatear = emp => ({ ...emp, activo: emp.activo === 1 })

// ── VALIDACIONES EMPLEADO ─────────────────────────────────
function validar(body) {
  const errores = []
  const { nombre, cargo, departamento, salario } = body
  if (!nombre || nombre.trim().length < 3)
    errores.push('El nombre debe tener al menos 3 caracteres')
  if (!cargo || cargo.trim() === '')
    errores.push('El cargo es obligatorio')
  if (!departamento || departamento.trim() === '')
    errores.push('El departamento es obligatorio')
  if (!salario || isNaN(salario))
    errores.push('El salario debe ser un número válido')
  else if (Number(salario) < 1000000)
    errores.push('El salario debe ser mayor a $1.000.000')
  return errores
}

// ── AUTH ──────────────────────────────────────────────────

// POST - Registro
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body
  const errores = []

  if (!nombre || nombre.trim().length < 3)
    errores.push('El nombre debe tener al menos 3 caracteres')
  if (!email || !email.includes('@'))
    errores.push('El correo no es válido')
  if (!password || password.length < 6)
    errores.push('La contraseña debe tener al menos 6 caracteres')

  if (errores.length > 0) return res.status(400).json({ errores })

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.trim())
  if (existe) return res.status(400).json({ errores: ['Ya existe una cuenta con ese correo'] })

  const hash = await bcrypt.hash(password, 10)
  db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)').run(nombre.trim(), email.trim(), hash, 'usuario')

  res.status(201).json({ mensaje: 'Cuenta creada correctamente' })
})

// POST - Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ mensaje: 'Ingresa correo y contraseña' })

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.trim())
  if (!usuario) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })

  const valido = await bcrypt.compare(password, usuario.password)
  if (!valido) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })

  res.json({ ok: true, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
})

// ── RUTAS EMPLEADOS ───────────────────────────────────────

app.get('/api/empleados', (req, res) => {
  res.json(db.prepare('SELECT * FROM empleados').all().map(formatear))
})

app.get('/api/empleados/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  if (!emp) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  res.json(formatear(emp))
})

app.post('/api/empleados', (req, res) => {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const { nombre, cargo, departamento, salario, activo } = req.body
  const existe = db.prepare('SELECT id FROM empleados WHERE LOWER(nombre) = LOWER(?)').get(nombre.trim())
  if (existe) return res.status(400).json({ errores: ['Ya existe un empleado con ese nombre'] })
  const r = db.prepare(`INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)`).run(nombre.trim(), cargo.trim(), departamento.trim(), Number(salario), activo ? 1 : 0)
  res.status(201).json(formatear(db.prepare('SELECT * FROM empleados WHERE id = ?').get(r.lastInsertRowid)))
})

app.put('/api/empleados/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  if (!emp) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const { nombre, cargo, departamento, salario, activo } = req.body
  const existe = db.prepare('SELECT id FROM empleados WHERE LOWER(nombre) = LOWER(?) AND id != ?').get(nombre.trim(), req.params.id)
  if (existe) return res.status(400).json({ errores: ['Ya existe un empleado con ese nombre'] })
  db.prepare(`UPDATE empleados SET nombre=?, cargo=?, departamento=?, salario=?, activo=? WHERE id=?`).run(nombre.trim(), cargo.trim(), departamento.trim(), Number(salario), activo ? 1 : 0, req.params.id)
  res.json(formatear(db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)))
})

app.delete('/api/empleados/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id)
  if (!emp) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  db.prepare('DELETE FROM empleados WHERE id = ?').run(req.params.id)
  res.json({ mensaje: 'Empleado eliminado correctamente' })
})
// GET - Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT id, nombre, email, rol FROM usuarios').all()
  res.json(usuarios)
})

// PUT - Cambiar rol de un usuario (solo admin)
app.put('/api/usuarios/:id/rol', (req, res) => {
  const { rol } = req.body
  if (!['admin', 'usuario'].includes(rol))
    return res.status(400).json({ mensaje: 'Rol no válido' })
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(req.params.id)
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
  db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, req.params.id)
  res.json({ mensaje: 'Rol actualizado correctamente' })
})

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`))