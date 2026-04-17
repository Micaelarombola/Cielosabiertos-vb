const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Archivos y carpetas
const productosFile = path.join(__dirname, "productos.json");
const uploadsDir = path.join(__dirname, "uploads");

// Crear carpeta uploads si no existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Crear productos.json si no existe
if (!fs.existsSync(productosFile)) {
  fs.writeFileSync(productosFile, "[]", "utf-8");
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");

    const uniqueName = `${Date.now()}-${baseName}${extension}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
  }
};

const upload = multer({
  storage,
  fileFilter
});

// Funciones auxiliares
function leerProductos() {
  try {
    const data = fs.readFileSync(productosFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo productos.json:", error);
    return [];
  }
}

function guardarProductos(productos) {
  fs.writeFileSync(productosFile, JSON.stringify(productos, null, 2), "utf-8");
}

function borrarImagenSiExiste(rutaImagen) {
  if (!rutaImagen) return;

  const nombreArchivo = rutaImagen.replace("/uploads/", "");
  const rutaCompleta = path.join(uploadsDir, nombreArchivo);

  if (fs.existsSync(rutaCompleta)) {
    fs.unlinkSync(rutaCompleta);
  }
}

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend de Cielos Abiertos VB funcionando");
});

// GET todos
app.get("/api/productos", (req, res) => {
  const productos = leerProductos();
  res.json(productos);
});

// GET uno
app.get("/api/productos/:id", (req, res) => {
  const productos = leerProductos();
  const producto = productos.find((p) => p.id === Number(req.params.id));

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(producto);
});

// POST crear
app.post("/api/productos", upload.single("imagen"), (req, res) => {
  try {
    const productos = leerProductos();

    const nuevoProducto = {
      id: Date.now(),
      nombre: req.body.nombre?.trim() || "",
      precio: Number(req.body.precio) || 0,
      descripcion: req.body.descripcion?.trim() || "",
      categoria: req.body.categoria?.trim().toLowerCase() || "",
      talles: req.body.talles?.trim() || "",
      colores: req.body.colores?.trim() || "",
      stock: Number(req.body.stock) || 0,
      imagen: req.file ? `/uploads/${req.file.filename}` : ""
    };

    productos.push(nuevoProducto);
    guardarProductos(productos);

    res.status(201).json({
      mensaje: "Producto creado correctamente",
      producto: nuevoProducto
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error interno al crear el producto" });
  }
});

// PUT editar
app.put("/api/productos/:id", upload.single("imagen"), (req, res) => {
  try {
    const productos = leerProductos();
    const index = productos.findIndex((p) => p.id === Number(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const actual = productos[index];

    // Si subieron nueva imagen, borra la vieja
    if (req.file && actual.imagen) {
      borrarImagenSiExiste(actual.imagen);
    }

    const actualizado = {
      ...actual,
      nombre: req.body.nombre !== undefined ? req.body.nombre.trim() : actual.nombre,
      precio: req.body.precio !== undefined ? Number(req.body.precio) : actual.precio,
      descripcion: req.body.descripcion !== undefined ? req.body.descripcion.trim() : actual.descripcion,
      categoria: req.body.categoria !== undefined ? req.body.categoria.trim().toLowerCase() : actual.categoria,
      talles: req.body.talles !== undefined ? req.body.talles.trim() : actual.talles,
      colores: req.body.colores !== undefined ? req.body.colores.trim() : actual.colores,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : actual.stock,
      imagen: req.file ? `/uploads/${req.file.filename}` : actual.imagen
    };

    productos[index] = actualizado;
    guardarProductos(productos);

    res.json({
      mensaje: "Producto actualizado correctamente",
      producto: actualizado
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error interno al actualizar el producto" });
  }
});

// DELETE eliminar
app.delete("/api/productos/:id", (req, res) => {
  try {
    const productos = leerProductos();
    const producto = productos.find((p) => p.id === Number(req.params.id));

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Borra imagen si existe
    if (producto.imagen) {
      borrarImagenSiExiste(producto.imagen);
    }

    const nuevos = productos.filter((p) => p.id !== Number(req.params.id));
    guardarProductos(nuevos);

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: "Error interno al eliminar el producto" });
  }
});

// Manejo de errores de multer y generales
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: "Error al subir la imagen" });
  }

  if (error) {
    return res.status(400).json({ error: error.message || "Ocurrió un error" });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});