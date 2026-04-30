const SUPABASE_URL = "https://wqptuekapjcfgslapylm.supabase.co";
const SUPABASE_KEY = "sb_publishable_YWyUgFMGDVoR_Wuv0jRqLg_oYPygF9r";

const supabaseTienda = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

const WHATSAPP_NUMBER = "5491127020865";

let productosBackend = [];
let categoriaActual = "todos";
let subcategoriaActual = "todas";
const cart = [];

const SUBCATEGORIAS = {
  "partes-de-arriba": [
    "Buzo",
    "Campera",
    "Saco",
    "Remera",
    "Remera Manga Larga",
    "Sweters",
    "Remerones",
    "Camisacos",
    "Tapado",
    "Vestido"
  ],
  "partes-de-abajo": [
    "Jean",
    "Pantalon",
    "Short",
    "Pollera"
  ],
  "linea-deportiva": [
    "Top",
    "Chupines",
    "Biker",
    "Short",
    "Pollera short",
    "Remera deportiva",
    "Sudadera"
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


/* =========================
   Menú mobile
========================= */
(function initMobileMenu() {
  const toggle = $("#menuToggle");
  const menu = $("#mobileMenu");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
  });

  $$("a", menu).forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  });
})();

/* =========================
   Carrusel hero
========================= */
(function initHeroSlider() {
  const slider = $("#heroSlider");
  const dotsWrap = $("#heroDots");

  if (!slider || !dotsWrap) return;

  const imgs = $$("img", slider);
  if (!imgs.length) return;

  let current = 0;
  let timer = null;
  const delay = 4000;

  imgs.forEach((_, index) => {
    const dot = document.createElement("button");

    dot.addEventListener("click", () => {
      current = index;
      sync();
      restart();
    });

    dotsWrap.appendChild(dot);
  });

  const dots = $$("button", dotsWrap);

  function sync() {
    imgs.forEach((img, index) => {
      img.classList.toggle("active", index === current);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
    });
  }

  function next() {
    current = (current + 1) % imgs.length;
    sync();
  }

  function start() {
    timer = setInterval(next, delay);
  }

  function stop() {
    clearInterval(timer);
  }

  function restart() {
    stop();
    start();
  }

  sync();
  start();

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
})();

/* =========================
   Utilidades
========================= */
function money(value) {
  return Number(value || 0).toLocaleString("es-AR");
}

function calcularPrecioTransferencia(precio) {
  return Math.round(Number(precio) * 0.9);
}

function normalizarTexto(texto) {
  return String(texto || "").toLowerCase().trim();
}

function escaparHTML(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatearCategoria(categoria) {
  const mapa = {
    "partes-de-arriba": "Partes de arriba",
    "partes-de-abajo": "Partes de abajo",
    "linea-deportiva": "Línea deportiva",
    "calzados": "Calzados",
    "accesorios": "Accesorios",
    "ofertas-imperdibles": "Ofertas imperdibles"
  };

  return mapa[categoria] || categoria || "-";
}

/* =========================
   Productos backend
========================= */
async function cargarProductos() {
  const grid = $("#productGrid");
  const bestSellerGrid = $("#bestSellerGrid");

  try {
    const { data, error } = await supabaseTienda
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      throw new Error("No se pudieron cargar los productos");
    }

    productosBackend = data || [];

    renderSubcategorias();
    renderProductos();
    renderBestSellers();

  } catch (error) {
    console.error("Error al cargar productos:", error);

    if (grid) {
      grid.innerHTML = `<p class="empty-state">No se pudieron cargar los productos.</p>`;
    }

    if (bestSellerGrid) {
      bestSellerGrid.innerHTML = `<p class="empty-state">No se pudieron cargar los productos destacados.</p>`;
    }
  }
}
function crearCardProducto(p) {
  const nombre = p.nombre || "Producto";
  const precio = Number(p.precio) || 0;
  const descripcion = p.descripcion || "";
  const categoria = formatearCategoria(p.categoria);
  const subcategoria = p.subcategoria || "-";
  const colores = p.colores || "-";
  const talles = p.talles || "-";
  const estado = p.estado || "normal";

let estadoHTML = "";

if (estado === "por_agotarse") {
  estadoHTML = `<span class="estado-producto por-agotarse">Por agotarse</span>`;
}

if (estado === "agotada") {
  estadoHTML = `<span class="estado-producto agotada">Agotada</span>`;
}

if (estado === "sin_stock") {
  estadoHTML = `<span class="estado-producto sin-stock">Sin stock</span>`;
}
  const imagen = p.imagen || "";

  const card = document.createElement("article");
  card.className = "p-card";

  card.innerHTML = `
    <div class="product-thumb">
      ${imagen
      ? `<img src="${imagen}" alt="${escaparHTML(nombre)}">`
      ${estadoHTML}
      : `<div class="no-image">Sin imagen</div>`
    }
    </div>

    <div class="product-info">
      <h3 class="product-name">${escaparHTML(nombre)}</h3>

      <div class="product-price">
        <span class="main-price">$ ${money(precio)}</span>
      </div>

      <div class="product-meta">
        ${descripcion ? `<p class="meta-line"><b>Descripción:</b> ${escaparHTML(descripcion)}</p>` : ""}
        <p class="meta-line"><b>Categoría:</b> ${escaparHTML(categoria)}</p>
        <p class="meta-line"><b>Subcategoría:</b> ${escaparHTML(subcategoria)}</p>
        <p class="meta-line"><b>Colores:</b> ${escaparHTML(colores)}</p>
        <p class="meta-line"><b>Talles:</b> ${escaparHTML(talles)}</p>
      </div>

      <button
        class="add"
        data-name="${escaparHTML(nombre)}"
        data-price="${precio}">
        Agregar al carrito
      </button>
    </div>
  `;

  return card;
}

function renderProductos() {
  const grid = $("#productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  let productosFiltrados = [...productosBackend];
  if (categoriaActual !== "todos") {
    productosFiltrados = productosFiltrados.filter((producto) => {
      return normalizarTexto(producto.categoria) === categoriaActual;
    });
  }

  if (subcategoriaActual !== "todas") {
    productosFiltrados = productosFiltrados.filter((producto) => {
      if (!producto.subcategoria) return false;

      const subProducto = normalizarTexto(producto.subcategoria.trim());
      const subFiltro = normalizarTexto(subcategoriaActual.trim());

      return subProducto === subFiltro;
    });
  }

  if (!productosFiltrados.length) {
    grid.innerHTML = `<p class="empty-state">No hay productos cargados en esta categoría.</p>`;
    return;
  }

  productosFiltrados.forEach((producto) => {
    grid.appendChild(crearCardProducto(producto));
  });
}

function renderBestSellers() {
  const grid = $("#bestSellerGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const destacados = productosBackend.slice(0, 4);

  if (!destacados.length) {
    grid.innerHTML = `<p class="empty-state">Todavía no hay productos destacados.</p>`;
    return;
  }

  destacados.forEach((producto) => {
    grid.appendChild(crearCardProducto(producto));
  });
}

/* =========================
   Subcategorías
========================= */
function renderSubcategorias() {
  const box = $("#subFilters");
  if (!box) return;

  box.innerHTML = "";

  if (categoriaActual === "todos" || !SUBCATEGORIAS[categoriaActual]) {
    box.style.display = "none";
    return;
  }

  box.style.display = "flex";

  SUBCATEGORIAS[categoriaActual].forEach((sub) => {
    const btn = document.createElement("button");
    btn.className = "subcat-btn";
    btn.textContent = sub;
    btn.dataset.subcat = sub === "Todas" ? "todas" : normalizarTexto(sub);

    if (
      (sub === "Todas" && subcategoriaActual === "todas") ||
      normalizarTexto(sub) === subcategoriaActual
    ) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      subcategoriaActual = sub === "Todas" ? "todas" : normalizarTexto(sub);

      $$(".subcat-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderProductos();
    });

    box.appendChild(btn);
  });
}

/* =========================
   Filtros categorías
========================= */
function initFiltrosCategorias() {
  const botones = $$(".cat-btn");
  if (!botones.length) return;

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriaActual = btn.dataset.cat || "todos";
      subcategoriaActual = "todas";

      botones.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderSubcategorias();
      renderProductos();
    });
  });
}

function activarCategoria(cat) {
  categoriaActual = cat;
  subcategoriaActual = "todas";

  const botones = $$(".cat-btn");
  botones.forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === cat);
  });

  renderSubcategorias();
  renderProductos();
}

function initFeaturedCategoryLinks() {
  const links = document.querySelectorAll("[data-cat-link]");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const categoria = link.dataset.catLink;

      // 👉 Scroll suave al shop
      const target = document.querySelector("#coleccion");
      if (target) {
        const offset = 110;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
          top,
          behavior: "smooth"
        });
      }

      // 👉 Activar categoría
      setTimeout(() => {
        activarCategoria(categoria);
      }, 300);
    });
  });
}

/* =========================
   Carrito
========================= */
function renderCart() {
  const box = $("#cartItems");
  if (!box) return;

  box.innerHTML = "";

  if (!cart.length) {
    box.innerHTML = `<p class="empty-state">Tu carrito está vacío.</p>`;
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      row.innerHTML = `
        <div class="cart-item-left">
          <span class="cart-item-name">${escaparHTML(item.name)}</span>
          <span class="cart-item-meta">${item.qty} x $ ${money(item.price)}</span>
        </div>

        <div class="cart-item-right">
          <b>$ ${money(item.qty * item.price)}</b>
          <button class="remove-item" data-index="${index}">✕</button>
        </div>
      `;

      box.appendChild(row);
    });
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  $("#subtot").textContent = money(subtotal);
  $("#recargo").textContent = money(0);
  $("#total").textContent = money(subtotal);
  $("#cartCount").textContent = cart.reduce((acc, item) => acc + item.qty, 0);
}

function addToCart(name, price) {
  const existente = cart.find((item) => item.name === name && item.price === price);

  if (existente) {
    existente.qty += 1;
  } else {
    cart.push({
      name,
      price,
      qty: 1
    });
  }

  renderCart();
  toggleDrawer(true);
}

function removeFromCart(index) {
  if (!cart[index]) return;
  cart.splice(index, 1);
  renderCart();
}

function buildWhatsAppMessage() {
  if (!cart.length) {
    return encodeURIComponent("Hola! Quiero consultar por productos de Cielos Abiertos VB.");
  }

  let message = "Hola! Quiero hacer este pedido:\n\n";

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  cart.forEach((item) => {
    message += `• ${item.name} x${item.qty} - $ ${money(item.price * item.qty)}\n`;
  });

  message += `\nTotal: $ ${money(subtotal)}\n\n`;
  message += `Quedo a la espera para coordinar la compra 😊`;

  return encodeURIComponent(message);
}

function sendCartToWhatsApp() {
  if (!cart.length) {
    alert("El carrito está vacío.");
    return;
  }

  const message = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  window.open(url, "_blank");
}

/* =========================
   Drawer carrito
========================= */
const drawerEl = $("#drawer");

function toggleDrawer(open) {
  drawerEl?.classList.toggle("active", !!open);
  document.body.classList.toggle("no-scroll", !!open);
}

$("#openCart")?.addEventListener("click", () => toggleDrawer(true));
$("#closeCart")?.addEventListener("click", () => toggleDrawer(false));
$("#closeX")?.addEventListener("click", () => toggleDrawer(false));

/* =========================
   Delegación clicks
========================= */
document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add");
  if (addBtn) {
    const name = addBtn.dataset.name || "Producto";
    const price = Number(addBtn.dataset.price || 0);
    addToCart(name, price);
    return;
  }

  const removeBtn = e.target.closest(".remove-item");
  if (removeBtn) {
    const index = Number(removeBtn.dataset.index);
    removeFromCart(index);
  }
});

/* =========================
   Checkout
========================= */
$("#checkout")?.addEventListener("click", (e) => {
  e.preventDefault();
  sendCartToWhatsApp();
});

/* =========================
   Footer año
========================= */
const yearEl = $("#year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

/* =========================
   Scroll suave con offset
========================= */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (!id || id.length <= 1) return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    const offset = 110;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top,
      behavior: "smooth"
    });
  });
});

/* =========================
   Init
========================= */
renderCart();
initFiltrosCategorias();
initFeaturedCategoryLinks();
renderSubcategorias();
cargarProductos();