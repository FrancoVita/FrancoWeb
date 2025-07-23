import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// === Rutas absolutas ===
const ROOT_PATH = path.resolve(__dirname, '../..');
const DATA_PATH = path.join(ROOT_PATH, 'data', 'proyectos.json');
const UPLOADS_PATH = path.join(ROOT_PATH, 'uploads');

// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));
app.use(express.static(ROOT_PATH)); // ✅ sirve archivos desde la raíz (index.html, proyecto.html, etc.)

// === Configuración de multer ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_PATH);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === RUTAS API ===

app.get('/api/proyectos', (req, res) => {
  const data = fs.readFileSync(DATA_PATH);
  res.json(JSON.parse(data));
});

app.get('/proyecto.html', (req, res) => {
  res.sendFile(path.join(ROOT_PATH, 'proyecto.html'));
});

app.post('/api/proyectos', (req, res) => {
  const { descripcion, descripcionLarga, imagenes } = req.body;

  if (!descripcion || !descripcionLarga || !imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  const proyectos = JSON.parse(fs.readFileSync(DATA_PATH));
  const nuevo = {
    id: Date.now(),
    descripcion,
    descripcionLarga,
    imagenes
  };

  proyectos.push(nuevo);
  fs.writeFileSync(DATA_PATH, JSON.stringify(proyectos, null, 2));
  res.status(201).json(nuevo);
});

app.delete('/api/proyectos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { password } = req.query;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  let proyectos = JSON.parse(fs.readFileSync(DATA_PATH));
  const proyecto = proyectos.find(p => p.id === id);

  if (!proyecto) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  if (Array.isArray(proyecto.imagenes)) {
    proyecto.imagenes.forEach(imgUrl => {
      const filename = path.basename(imgUrl);
      const filepath = path.join(UPLOADS_PATH, filename);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
          console.log(`🗑️ Eliminado: ${filepath}`);
        } catch (err) {
          console.error(`❌ Error al eliminar ${filepath}:`, err);
        }
      }
    });
  }

  proyectos = proyectos.filter(p => p.id !== id);
  fs.writeFileSync(DATA_PATH, JSON.stringify(proyectos, null, 2));
  res.status(204).send();
});

app.post('/api/login', express.json(), (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }
});

app.post('/api/upload', upload.array('imagenes', 10), (req, res) => {
  const urls = req.files.map(f => `uploads/${f.filename}`);
  res.json({ urls });
});

app.put('/api/proyectos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { descripcion, descripcionLarga, imagenes } = req.body;
  let proyectos = JSON.parse(fs.readFileSync(DATA_PATH));
  const idx = proyectos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Proyecto no encontrado' });
  if (descripcion) proyectos[idx].descripcion = descripcion;
  if (descripcionLarga !== undefined) proyectos[idx].descripcionLarga = descripcionLarga;
  if (imagenes) proyectos[idx].imagenes = imagenes;
  fs.writeFileSync(DATA_PATH, JSON.stringify(proyectos, null, 2));
  res.json(proyectos[idx]);
});

// ✅ Catch-all para frontend SPA o recarga de rutas no definidas (index.html en raíz)
app.use((req, res) => {
  const indexPath = path.join(ROOT_PATH, 'index.html');
  console.log('📄 Serviendo index desde:', indexPath);
  res.sendFile(indexPath);
});

// Inicio del servidor
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
