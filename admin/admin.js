// ===============================
// SUPABASE CONFIG
// ===============================
const SUPABASE_URL = "https://wqptuekapjcfgslapylm.supabase.co";
const SUPABASE_KEY = "TU_KEY_AQUI";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// VARIABLES
// ===============================
const form = document.getElementById("productoForm");
const lista = document.getElementById("listaProductos");

let productos = [];

// ===============================
// CARGAR PRODUCTOS
// ===============================
async function cargarProductos() {
  const { data, error } = await supabaseClient
    .from("productos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error cargando productos:", error);
    return;
  }

  productos = data;
  renderProductos();
}

// ===============================
// SUBIR IMAGEN
// ===============================
async function subirImagen(file) {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { data, error } = await supabaseClient.storage
    .from("productos")
    .upload(nombreArchivo, file);

  if (error) {
    console.error("Error subiendo imagen:", error);
    return null;
  }

  const { data: urlData } = supabaseClient.storage
    .from("productos")
    .getPublicUrl(nombreArchivo);

  return urlData.publicUrl;
}

// ===============================
// GUARDAR PRODUCTO
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const precio = document.getElementById("precio").value;
  const descripcion = document.getElementById("descripcion").value;
  const categoria = document.getElementById("categoria").value;
  const subcategoria = document.getElementById("subcategoria").value;
  const talles = document.getElementById("talles").value;
  const colores = document.getElementById("colores").value;
  const stock = document.getElementById("stock").value;
  const imagenFile = document.getElementById("imagen").files[0];

  let imagenURL = null;

  if (imagenFile) {
    imagenURL = await subirImagen(imagenFile);
  }

  const { error } = await supabaseClient.from("productos").insert([
    {
      nombre,
      precio,
      descripcion,
      categoria,
      subcategoria,
      talles,
      colores,
      stock,
      imagen: imagenURL,
    },
  ]);

  if (error) {
    console.error("Error al guardar:", error);
    alert("Error al guardar el producto");
    return;
  }

  form.reset();
  cargarProductos();
});

// ===============================
// RENDER PRODUCTOS
// ===============================
function renderProductos() {
  lista.innerHTML = "";

  if (productos.length === 0) {
    lista.innerHTML = "<p>No hay productos cargados</p>";
    return;
  }

  productos.forEach((p) => {
    const div = document.createElement("div");
    div.classList.add("producto-admin");

    div.innerHTML = `
      <img src="${p.imagen || ""}" />
      <div class="contenido">
        <h3>${p.nombre}</h3>
        <p><strong>Precio:</strong> $${p.precio}</p>
        <p><strong>Categoría:</strong> ${p.categoria}</p>
        <p><strong>Subcategoría:</strong> ${p.subcategoria}</p>
        <p><strong>Talles:</strong> ${p.talles || "-"}</p>
        <p><strong>Colores:</strong> ${p.colores || "-"}</p>
      </div>
      <div class="acciones">
        <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </div>
    `;

    lista.appendChild(div);
  });
}

// ===============================
// ELIMINAR PRODUCTO
// ===============================
async function eliminarProducto(id) {
  const { error } = await supabaseClient
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando:", error);
    return;
  }

  cargarProductos();
}

// ===============================
// INICIO
// ===============================
cargarProductos();