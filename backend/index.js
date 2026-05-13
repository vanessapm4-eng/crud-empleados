const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ── CONEXIÓN MYSQL ────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'empleados-elpoli-20ea.h.aivencloud.com',
  port: process.env.DB_PORT || 19476,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_f_9Fzu-tVs51T_8v1wd',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
})

// ── INICIALIZAR TABLAS ────────────────────────────────────
const init = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      cargo VARCHAR(100) NOT NULL,
      departamento VARCHAR(100) NOT NULL,
      salario DECIMAL(12,2) NOT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario'
    )
  `)

  const [rows] = await pool.execute('SELECT COUNT(*) as total FROM empleados')
  if (rows[0].total === 0) {
    await pool.execute(`INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)`, ['Ana García', 'Desarrolladora Senior', 'Tecnología', 5800000, 1])
    await pool.execute(`INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)`, ['Carlos Mejía', 'Diseñador UX', 'Producto', 4200000, 1])
    await pool.execute(`INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)`, ['Lucía Torres', 'Project Manager', 'Operaciones', 6100000, 0])
  }

  const [admins] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', ['admin@empresa.com'])
  if (admins.length === 0) {
    const hash = bcrypt.hashSync('Admin1234', 10)
    await pool.execute('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', ['Administrador', 'admin@empresa.com', hash, 'admin'])
    console.log('✅ Admin creado: admin@empresa.com / Admin1234')
  }

  console.log('✅ Base de datos MySQL conectada y lista')
}

// ── VALIDACIONES ──────────────────────────────────────────
function validar(body) {
  const errores = []
  const { nombre, cargo, departamento, salario } = body
  if (!nombre || nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres')
  if (!cargo || cargo.trim() === '') errores.push('El cargo es obligatorio')
  if (!departamento || departamento.trim() === '') errores.push('El departamento es obligatorio')
  if (!salario || isNaN(salario)) errores.push('El salario debe ser un número válido')
  else if (Number(salario) < 1000000) errores.push('El salario debe ser mayor a $1.000.000')
  return errores
}

const fmt = emp => ({ ...emp, activo: emp.activo === 1 })

// ── AUTH ──────────────────────────────────────────────────
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body
  const errores = []
  if (!nombre || nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres')
  if (!email || !email.includes('@')) errores.push('El correo no es válido')
  if (!password || password.length < 6) errores.push('La contraseña debe tener al menos 6 caracteres')
  if (errores.length > 0) return res.status(400).json({ errores })
  const [existe] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email.trim()])
  if (existe.length > 0) return res.status(400).json({ errores: ['Ya existe una cuenta con ese correo'] })
  const hash = await bcrypt.hash(password, 10)
  await pool.execute('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', [nombre.trim(), email.trim(), hash, 'usuario'])
  res.status(201).json({ mensaje: 'Cuenta creada correctamente' })
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ mensaje: 'Ingresa correo y contraseña' })
  const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email.trim()])
  if (rows.length === 0) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })
  const usuario = rows[0]
  const valido = await bcrypt.compare(password, usuario.password)
  if (!valido) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })
  res.json({ ok: true, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
})

// ── EMPLEADOS ─────────────────────────────────────────────
app.get('/api/empleados', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM empleados')
  res.json(rows.map(fmt))
})

app.get('/api/empleados/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM empleados WHERE id = ?', [req.params.id])
  if (rows.length === 0) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  res.json(fmt(rows[0]))
})

app.post('/api/empleados', async (req, res) => {
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const { nombre, cargo, departamento, salario, activo } = req.body
  const [existe] = await pool.execute('SELECT id FROM empleados WHERE LOWER(nombre) = LOWER(?)', [nombre.trim()])
  if (existe.length > 0) return res.status(400).json({ errores: ['Ya existe un empleado con ese nombre'] })
  const [r] = await pool.execute('INSERT INTO empleados (nombre, cargo, departamento, salario, activo) VALUES (?, ?, ?, ?, ?)', [nombre.trim(), cargo.trim(), departamento.trim(), Number(salario), activo ? 1 : 0])
  const [nuevo] = await pool.execute('SELECT * FROM empleados WHERE id = ?', [r.insertId])
  res.status(201).json(fmt(nuevo[0]))
})

app.put('/api/empleados/:id', async (req, res) => {
  const [emp] = await pool.execute('SELECT * FROM empleados WHERE id = ?', [req.params.id])
  if (emp.length === 0) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  const errores = validar(req.body)
  if (errores.length > 0) return res.status(400).json({ errores })
  const { nombre, cargo, departamento, salario, activo } = req.body
  const [existe] = await pool.execute('SELECT id FROM empleados WHERE LOWER(nombre) = LOWER(?) AND id != ?', [nombre.trim(), req.params.id])
  if (existe.length > 0) return res.status(400).json({ errores: ['Ya existe un empleado con ese nombre'] })
  await pool.execute('UPDATE empleados SET nombre=?, cargo=?, departamento=?, salario=?, activo=? WHERE id=?', [nombre.trim(), cargo.trim(), departamento.trim(), Number(salario), activo ? 1 : 0, req.params.id])
  const [actualizado] = await pool.execute('SELECT * FROM empleados WHERE id = ?', [req.params.id])
  res.json(fmt(actualizado[0]))
})

app.delete('/api/empleados/:id', async (req, res) => {
  const [emp] = await pool.execute('SELECT * FROM empleados WHERE id = ?', [req.params.id])
  if (emp.length === 0) return res.status(404).json({ mensaje: 'Empleado no encontrado' })
  await pool.execute('DELETE FROM empleados WHERE id = ?', [req.params.id])
  res.json({ mensaje: 'Empleado eliminado correctamente' })
})

// ── USUARIOS ──────────────────────────────────────────────
app.get('/api/usuarios', async (req, res) => {
  const [rows] = await pool.execute('SELECT id, nombre, email, rol FROM usuarios')
  res.json(rows)
})

app.put('/api/usuarios/:id/rol', async (req, res) => {
  const { rol } = req.body
  if (!['admin', 'usuario'].includes(rol)) return res.status(400).json({ mensaje: 'Rol no válido' })
  const [usuario] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [req.params.id])
  if (usuario.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' })
  await pool.execute('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, req.params.id])
  res.json({ mensaje: 'Rol actualizado correctamente' })
})

init().then(() => {
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`))
}).catch(err => {
  console.error('Error conectando a MySQL:', err)
})