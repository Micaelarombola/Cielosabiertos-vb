const API_URL = "https://cielos-abiertos-vb-api.onrender.com/api/productos";
const BASE_URL = "https://cielos-abiertos-vb-api.onrender.com";

const SUBCATEGORIAS = {
  "partes-de-arriba": [
    "Buzos",
    "Camperas",
    "Sacos",
    "Remeras",
    "Sweters",
    "Remerones",
    "Camisacos",
    "Tapados",
    "Vestidos"
  ],
  "partes-de-abajo": [
    "Jeans",
    "Pantalones",
    "Shorts",
    "Pollera"
  ],
  "linea-deportiva": [
    "Tops",
    "Chupines",
    "Bikers",
    "Shorts",
    "Polleras shorts",
    "Remeras deportivas",
    "Sudaderas"
  ],
  "calzados": [
    "Botas",
    "Zapatillas",
    "Sandalias",
    "Texanas",
    "Mocasines"
  ],
  "accesorios": [
    "Carteras",
    "Cintos",
    "Bijou",
    "Pañuelos",
    "Gorras"
  ],
  "ofertas-imperdibles": [
    "Ofertas imperdibles"
  ]
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

    if (item === subSeleccionada) {
      option.selected = true;
    }

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

  if (submitBtn) {
    submitBtn.textContent = "Guardar producto";
  }

  const btnCancelar = document.getElementById("btnCancelar");
  if (btnCancelar) {
    btnCancelar.remove();
  }
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

async function cargarProductosAdmin() {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("No se pudieron obtener los productos");
    }

    const productos = await res.json();

    listaProductos.innerHTML = "";

    if (!productos.length) {
      listaProductos.innerHTML = `<div class="empty-admin">No hay productos cargados todavía.</div>`;
      return;
    }

    productos.forEach((producto) => {
      const div = document.createElement("div");
      div.className = "producto-admin";

      const imagenSrc = producto.imagen
        ? (producto.imagen.startsWith("http") ? producto.imagen : `${BASE_URL}${producto.imagen}`)
        : "";

      div.innerHTML = `
        ${imagenSrc ? `<img src="${imagenSrc}" alt="${producto.nombre}">` : ""}

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

  if (!nombre.value.trim()) {
    alert("Por favor ingresá el nombre del producto.");
    return;
  }

  if (!precio.value || Number(precio.value) <= 0) {
    alert("Por favor ingresá un precio válido.");
    return;
  }

  if (!categoria.value) {
    alert("Seleccioná una categoría.");
    return;
  }

  if (!subcategoria.value) {
    alert("Seleccioná una subcategoría.");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", nombre.value.trim());
  formData.append("precio", precio.value);
  formData.append("descripcion", descripcion.value.trim());
  formData.append("categoria", categoria.value);
  formData.append("subcategoria", subcategoria.value);
  formData.append("talles", talles.value.trim());
  formData.append("colores", colores.value.trim());
  formData.append("stock", stock.value || 0);

  if (imagen.files[0]) {
    formData.append("imagen", imagen.files[0]);
  }

  try {
    let res;

    if (productoId.value) {
      res = await fetch(`${API_URL}/${productoId.value}`, {
        method: "PUT",
        body: formData
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        body: formData
      });
    }

    if (!res.ok) {
      throw new Error("No se pudo guardar el producto");
    }

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
    const res = await fetch(`${API_URL}/${id}`);

    if (!res.ok) {
      throw new Error("No se pudo cargar el producto");
    }

    const producto = await res.json();

    productoId.value = producto.id;
    nombre.value = producto.nombre || "";
    precio.value = producto.precio || "";
    descripcion.value = producto.descripcion || "";
    categoria.value = producto.categoria || "";
    cargarSubcategorias(producto.categoria || "", producto.subcategoria || "");
    talles.value = producto.talles || "";
    colores.value = producto.colores || "";
    stock.value = producto.stock ?? 0;

    if (submitBtn) {
      submitBtn.textContent = "Actualizar producto";
    }

    mostrarBotonCancelar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    alert("No se pudo cargar el producto para editar.");
  }
}

async function eliminarProducto(id) {
  const confirmar = confirm("¿Seguro que querés eliminar este producto?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("No se pudo eliminar el producto");
    }

    alert("Producto eliminado correctamente.");
    cargarProductosAdmin();

    if (productoId.value === String(id)) {
      resetFormulario();
    }
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