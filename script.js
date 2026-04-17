const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

const WHATSAPP_NUMBER = "5491127283586";
const API_URL = "https://cielos-abiertos-vb-api.onrender.com/api/productos";
const BASE_URL = "https://cielos-abiertos-vb-api.onrender.com";

let productosBackend = [];
let categoriaActual = "todos";
const cart = [];

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

function normalizarCategoria(categoria) {
  return String(categoria || "").toLowerCase().trim();
}

function escaparHTML(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Productos backend
========================= */
async function cargarProductos() {
  const grid = $("#productGrid");
  const bestSellerGrid = $("#bestSellerGrid");

  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los productos");
    }

    productosBackend = await res.json();

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
  const categoria = p.categoria || "-";
  const colores = p.colores || "-";
  const talles = p.talles || "-";
const imagen = p.imagen
  ? (p.imagen.startsWith("http") ? p.imagen : `${BASE_URL}${p.imagen}`)
  : "";  const precioTransferencia = calcularPrecioTransferencia(precio);

  const card = document.createElement("article");
  card.className = "p-card";

  card.innerHTML = `
    <div class="product-thumb">
      ${
        imagen
          ? `<img src="${imagen}" alt="${escaparHTML(nombre)}">`
          : `<div class="no-image">Sin imagen</div>`
      }
    </div>

    <div class="product-info">
      <h3 class="product-name">${escaparHTML(nombre)}</h3>

      <div class="product-price">
        <span class="main-price">$ ${money(precio)}</span>
        <span class="transfer-price">o $ ${money(precioTransferencia)} por transferencia</span>
      </div>

      <div class="product-meta">
        ${descripcion ? `<p class="meta-line"><b>Descripción:</b> ${escaparHTML(descripcion)}</p>` : ""}
        <p class="meta-line"><b>Categoría:</b> ${escaparHTML(categoria)}</p>
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
      return normalizarCategoria(producto.categoria) === categoriaActual;
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
   Filtros categorías
========================= */
function initFiltrosCategorias() {
  const botones = $$(".cat-btn");
  if (!botones.length) return;

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriaActual = btn.dataset.cat || "todos";

      botones.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderProductos();
    });
  });
}

function activarCategoria(cat) {
  categoriaActual = cat;

  const botones = $$(".cat-btn");
  botones.forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === cat);
  });

  renderProductos();
}

function initFeaturedCategoryLinks() {
  const links = $$("[data-cat-link]");

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const categoria = link.dataset.catLink;

      if (categoria) {
        setTimeout(() => {
          activarCategoria(categoria);
        }, 100);
      }
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
cargarProductos();