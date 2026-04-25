const SUPABASE_URL = "https://wqptuekapjcfgslapylm.supabase.co";
const SUPABASE_KEY = "sb_publishable_YWyUgFMGDVoR_Wuv0jRqLg_oYPygF9r";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SUBCATEGORIAS = {
  "partes-de-arriba": ["Buzo", "Campera", "Saco", "Remera", "Sweters", "Remerones", "Camisacos", "Tapado", "Vestido"],
  "partes-de-abajo": ["Jean", "Pantalon", "Short", "Pollera"],
  "linea-deportiva": ["Top", "Chupines", "Biker", "Short", "Pollera short", "Remera deportiva", "Sudadera"],
  "calzados": ["Botas", "Zapatillas", "Sandalias", "Texanas", "Mocasines"],
  "accesorios": ["Carteras", "Cintos", "Bijou", "Pañuelos", "Gorras"],
  "ofertas-imperdibles": ["Ofertas imperdibles"]
};

const form = document.getElementById("productoForm");
const productoId = document.getElementById("productoId");
const nombre = document.getElementById("nombre");
const precio = document.getElementById("precio");
const descripcion = document.getElementById("descripcion");
const categoria = document.getElementById("categoria");
const subcategoria = document.getElementById("subcategoria");
const talles = document.getElementById("talles");
const colores = document.getElementById("colores");
const stock = document.getElementById("stock");
const imagen = document.getElementById("imagen");
const listaProductos = document.getElementById("listaProductos");
const submitBtn = document.getElementById("submitBtn");

function cargarSubcategorias(valorCategoria, subSeleccionada = "") {
  subcategoria.innerHTML = `<option value="">Seleccionar subcategoría</option>`;

  const opciones = SUBCATEGORIAS[valorCategoria] || [];

  opciones.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;

    if (item === subSeleccionada) option.selected = true;

    subcategoria.appendChild(option);
  });
}

categoria.addEventListener("change", () => {
  cargarSubcategorias(categoria.value);
});

function formatearCategoria(categoriaValor) {
  const mapa = {
    "partes-de-arriba": "Partes de arriba",
    "partes-de-abajo": "Partes de abajo",
    "linea-deportiva": "Línea deportiva",
    "calzados": "Calzados",
    "accesorios": "Accesorios",
    "ofertas-imperdibles": "Ofertas imperdibles"
  };

  return mapa[categoriaValor] || categoriaValor || "-";
}

function resetFormulario() {
  form.reset();
  productoId.value = "";
  cargarSubcategorias("");

  if (submitBtn) submitBtn.textContent = "Guardar producto";

  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) btnCancelar.remove();
}

function mostrarBotonCancelar() {
  let btnCancelar = document.getElementById("btnCancelar");

  if (!btnCancelar) {
    btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.id = "btnCancelar";
    btnCancelar.textContent = "Cancelar edición";
    btnCancelar.className = "btn-cancelar";
    btnCancelar.addEventListener("click", resetFormulario);
    form.appendChild(btnCancelar);
  }
}

async function subirImagen(file) {
  if (!file) return "";

  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabaseClient.storage
    .from("productos")
    .upload(nombreArchivo, file);

  if (error) {
    console.error("Error subiendo imagen:", error);
    throw new Error("No se pudo subir la imagen");
  }

  const { data } = supabaseClient.storage
    .from("productos")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

async function cargarProductosAdmin() {
  try {
    const { data: productos, error } = await supabaseClient
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    listaProductos.innerHTML = "";

    if (!productos || !productos.length) {
      listaProductos.innerHTML = `<div class="empty-admin">No hay productos cargados todavía.</div>`;
      return;
    }

    productos.forEach((producto) => {
      const div = document.createElement("div");
      div.className = "producto-admin";

      div.innerHTML = `
        ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}">` : ""}

        <div class="contenido">
          <h3>${producto.nombre}</h3>
          <p><strong>Precio:</strong> $${Number(producto.precio || 0).toLocaleString("es-AR")}</p>
          <p><strong>Descripción:</strong> ${producto.descripcion || "-"}</p>
          <p><strong>Categoría:</strong> ${formatearCategoria(producto.categoria)}</p>
          <p><strong>Subcategoría:</strong> ${producto.subcategoria || "-"}</p>
          <p><strong>Talles:</strong> ${producto.talles || "-"}</p>
          <p><strong>Colores:</strong> ${producto.colores || "-"}</p>
          <p><strong>Stock:</strong> ${producto.stock ?? 0}</p>
        </div>

        <div class="acciones">
          <button class="btn-editar" data-id="${producto.id}">Editar</button>
          <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
        </div>
      `;

      listaProductos.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    listaProductos.innerHTML = `<div class="empty-admin">Error al cargar productos.</div>`;
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!nombre.value.trim()) return alert("Por favor ingresá el nombre del producto.");
  if (!precio.value || Number(precio.value) <= 0) return alert("Por favor ingresá un precio válido.");
  if (!categoria.value) return alert("Seleccioná una categoría.");
  if (!subcategoria.value) return alert("Seleccioná una subcategoría.");

  try {
    let imagenUrl = "";

    if (imagen.files[0]) {
      imagenUrl = await subirImagen(imagen.files[0]);
    }

    const productoData = {
      nombre: nombre.value.trim(),
      precio: Number(precio.value),
      descripcion: descripcion.value.trim(),
      categoria: categoria.value,
      subcategoria: subcategoria.value,
      talles: talles.value.trim(),
      colores: colores.value.trim(),
      stock: Number(stock.value || 0)
    };

    if (imagenUrl) {
      productoData.imagen = imagenUrl;
    }

    let error;

    if (productoId.value) {
      const response = await supabaseClient
        .from("productos")
        .update(productoData)
        .eq("id", productoId.value);

      error = response.error;
    } else {
      const response = await supabaseClient
        .from("productos")
        .insert([productoData]);

      error = response.error;
    }

    if (error) throw error;

    alert(productoId.value ? "Producto actualizado correctamente." : "Producto guardado correctamente.");

    resetFormulario();
    cargarProductosAdmin();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Hubo un error al guardar el producto.");
  }
});

async function editarProducto(id) {
  try {
    const { data: producto, error } = await supabaseClient
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    productoId.value = producto.id;
    nombre.value = producto.nombre || "";
    precio.value = producto.precio || "";
    descripcion.value = producto.descripcion || "";
    categoria.value = producto.categoria || "";
    cargarSubcategorias(producto.categoria || "", producto.subcategoria || "");
    talles.value = producto.talles || "";
    colores.value = producto.colores || "";
    stock.value = producto.stock ?? 0;

    if (submitBtn) submitBtn.textContent = "Actualizar producto";

    mostrarBotonCancelar();

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    alert("No se pudo cargar el producto para editar.");
  }
}

async function eliminarProducto(id) {
  const confirmar = confirm("¿Seguro que querés eliminar este producto?");
  if (!confirmar) return;

  try {
    const { error } = await supabaseClient
      .from("productos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    alert("Producto eliminado correctamente.");
    cargarProductosAdmin();

    if (productoId.value === String(id)) resetFormulario();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Hubo un error al eliminar el producto.");
  }
}

document.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".btn-editar");
  if (btnEditar) {
    editarProducto(btnEditar.dataset.id);
    return;
  }

  const btnEliminar = e.target.closest(".btn-eliminar");
  if (btnEliminar) {
    eliminarProducto(btnEliminar.dataset.id);
  }
});

cargarSubcategorias("");
cargarProductosAdmin();