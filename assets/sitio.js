/* ToTo Tools — Ferretería Los Hermanos!
   Lógica interactiva completa: catálogo, modal de ficha de producto,
   carrito de pedido por WhatsApp, cambio de moneda y animaciones. */

let CATALOGO = null;
let PEDIDO = {};
let MONEDA_ACTUAL = "USD";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  inicializarInterfaz();
  inicializarAnimaciones();
});

async function cargarCatalogo() {
  try {
    const res = await fetch("datos/catalogo.json?v=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    CATALOGO = await res.json();
  } catch (err) {
    console.error("Error cargando el catálogo:", err);
    mostrarErrorCarga();
  }
}

function mostrarErrorCarga() {
  const catEl = document.getElementById("catalogo");
  if (catEl) {
    catEl.innerHTML = `
      <div class="vacio" style="grid-column: 1/-1;">
        <b>No se pudo cargar el catálogo.</b>
        <span>Por favor, recarga la página o contáctanos directamente por WhatsApp al <strong>+53 56950485</strong>.</span>
        <button type="button" class="btn btn-tinta" onclick="location.reload()">Reintentar</button>
      </div>`;
  }
}

function inicializarInterfaz() {
  if (!CATALOGO) return;

  // 1. Configurar datos de contacto y WhatsApp
  const telWsp = CATALOGO.contacto?.whatsapp || "5356950485";
  document.querySelectorAll("[data-wa]").forEach(el => {
    el.href = `https://wa.me/${telWsp}?text=${encodeURIComponent("Hola, quisiera información sobre sus productos de ferretería.")}`;
  });

  // 2. Textos dinámicos en la portada
  const txtEtiqueta = document.querySelector('[data-t="portada.etiqueta"]');
  if (txtEtiqueta) txtEtiqueta.innerText = CATALOGO.portada?.etiqueta || "Ferretería Los Hermanos!";

  const txtTitulo = document.querySelector('[data-t="portada.titulo"]');
  if (txtTitulo) txtTitulo.innerText = CATALOGO.portada?.titulo || "Herramientas y ferretería de calidad en Santiago de Cuba";

  const txtTexto = document.querySelector('[data-t="portada.texto"]');
  if (txtTexto) txtTexto.innerText = CATALOGO.portada?.texto || "Herramientas eléctricas, manuales, accesorios y suministros de ferretería.";

  // 3. Rotador de palabras en la portada
  iniciarRotativa(CATALOGO.portada?.rotativas || ["talleres", "reparaciones", "construcción", "plomería"]);

  // 4. Renderizar Bento Grid / Especialidades
  renderizarBento();

  // 5. Renderizar Filtros y Productos
  renderizarFiltros();
  renderizarProductos();

  // 6. Monedas
  inicializarMonedas();

  // 7. Eventos de búsqueda y orden
  const inpBuscar = document.getElementById("buscar");
  if (inpBuscar) inpBuscar.addEventListener("input", renderizarProductos);

  const selOrden = document.getElementById("orden");
  if (selOrden) selOrden.addEventListener("change", renderizarProductos);

  const btnOfertas = document.getElementById("fOfertas");
  if (btnOfertas) {
    btnOfertas.addEventListener("click", () => {
      const activo = btnOfertas.getAttribute("aria-pressed") === "true";
      btnOfertas.setAttribute("aria-pressed", !activo);
      renderizarProductos();
    });
  }

  const btnDisponibles = document.getElementById("fDisponibles");
  if (btnDisponibles) {
    btnDisponibles.addEventListener("click", () => {
      const activo = btnDisponibles.getAttribute("aria-pressed") === "true";
      btnDisponibles.setAttribute("aria-pressed", !activo);
      renderizarProductos();
    });
  }

  // 8. Eventos de Modal de Pedido
  const btnAbrirPedido = document.getElementById("abrirPedido");
  const btnPedidoFlotante = document.getElementById("pedidoFlotante");
  const dlgPedido = document.getElementById("pedido");

  const abrirPedido = () => { if (dlgPedido) dlgPedido.showModal(); };
  if (btnAbrirPedido) btnAbrirPedido.addEventListener("click", abrirPedido);
  if (btnPedidoFlotante) btnPedidoFlotante.addEventListener("click", abrirPedido);

  document.querySelectorAll("[data-cerrar]").forEach(btn => {
    btn.addEventListener("click", () => {
      const diag = btn.closest("dialog");
      if (diag) diag.close();
    });
  });

  const formPedido = document.getElementById("pedidoForm");
  if (formPedido) formPedido.addEventListener("submit", enviarPedidoWhatsApp);

  const btnVaciar = document.getElementById("vaciar");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      PEDIDO = {};
      actualizarPedidoUI();
    });
  }

  // 9. Control del menú hamburguesa en móviles
  const btnMenu = document.getElementById("btnMenu");
  const navMenu = document.getElementById("menu");

  if (btnMenu && navMenu) {
    btnMenu.addEventListener("click", () => {
      const abierto = btnMenu.getAttribute("aria-expanded") === "true";
      btnMenu.setAttribute("aria-expanded", !abierto);
      navMenu.classList.toggle("abierto", !abierto);
    });

    navMenu.querySelectorAll("a").forEach(enlace => {
      enlace.addEventListener("click", () => {
        btnMenu.setAttribute("aria-expanded", "false");
        navMenu.classList.remove("abierto");
      });
    });
  }
}

/* ROTATIVA DE PALABRAS */
function iniciarRotativa(lista) {
  const el = document.getElementById("rotativa");
  if (!el || !lista.length) return;
  let idx = 0;
  el.innerText = lista[0];

  setInterval(() => {
    idx = (idx + 1) % lista.length;
    el.style.opacity = "0";
    setTimeout(() => {
      el.innerText = lista[idx];
      el.style.opacity = "1";
    }, 300);
  }, 2800);
}

/* BENTO GRID */
function renderizarBento() {
  const container = document.getElementById("bento");
  if (!container || !CATALOGO.soluciones) return;

  container.innerHTML = `
    <div class="bloque grande">
      <div class="bloque-txt">
        <h3>Herramientas Eléctricas</h3>
        <p>Taladros, esmeriladoras y sierras de alta durabilidad para trabajo pesado.</p>
      </div>
    </div>
    <div class="bloque medio">
      <div class="bloque-txt">
        <h3>Herramientas Manuales</h3>
        <p>Juegos de llaves, alicates, destornilladores y martillos profesionales.</p>
      </div>
    </div>
    <div class="bloque">
      <div class="bloque-txt">
        <h3>Discos y Brocas</h3>
        <p>Consumibles de corte y perforación para metal, concreto y madera.</p>
      </div>
    </div>
    <div class="bloque">
      <div class="bloque-txt">
        <h3>Fontanería y Gasfitería</h3>
        <p>Cintas de teflón, uniones, válvulas y accesorios para tuberías.</p>
      </div>
    </div>
  `;
}

/* FILTROS Y CATEGORÍAS */
let CATEGORIA_SELECCIONADA = "todas";

function renderizarFiltros() {
  const container = document.getElementById("chips");
  if (!container || !CATALOGO.categorias) return;

  const prods = CATALOGO.productos || [];
  container.innerHTML = `<button type="button" class="chip" aria-selected="true" onclick="seleccionarCategoria('todas', this)">Todas <small>${prods.length}</small></button>`;

  CATALOGO.categorias.forEach(cat => {
    const cant = prods.filter(p => p.categoria === cat.id).length;
    container.innerHTML += `<button type="button" class="chip" aria-selected="false" onclick="seleccionarCategoria('${cat.id}', this)">${cat.nombre} <small>${cant}</small></button>`;
  });
}

window.seleccionarCategoria = function(catId, btn) {
  CATEGORIA_SELECCIONADA = catId;
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-selected", "false"));
  btn.setAttribute("aria-selected", "true");
  renderizarProductos();
};

/* RENDERIZADO DE PRODUCTOS */
function renderizarProductos() {
  const container = document.getElementById("catalogo");
  const vacio = document.getElementById("vacio");
  if (!container || !CATALOGO.productos) return;

  let prods = [...CATALOGO.productos];

  if (CATEGORIA_SELECCIONADA !== "todas") {
    prods = prods.filter(p => p.categoria === CATEGORIA_SELECCIONADA);
  }

  const fOfertas = document.getElementById("fOfertas");
  if (fOfertas && fOfertas.getAttribute("aria-pressed") === "true") {
    prods = prods.filter(p => p.precioOferta !== null && p.precioOferta < p.precio);
  }

  const fDisponibles = document.getElementById("fDisponibles");
  if (fDisponibles && fDisponibles.getAttribute("aria-pressed") === "true") {
    prods = prods.filter(p => !p.agotado);
  }

  const q = (document.getElementById("buscar")?.value || "").toLowerCase().trim();
  if (q) {
    prods = prods.filter(p => p.nombre.toLowerCase().includes(q) || (p.resumen && p.resumen.toLowerCase().includes(q)));
  }

  const ord = document.getElementById("orden")?.value || "rel";
  if (ord === "asc") prods.sort((a, b) => a.precio - b.precio);
  if (ord === "desc") prods.sort((a, b) => b.precio - a.precio);
  if (ord === "az") prods.sort((a, b) => a.nombre.localeCompare(b.nombre));

  container.innerHTML = "";

  if (prods.length === 0) {
    if (vacio) vacio.hidden = false;
    return;
  }
  if (vacio) vacio.hidden = true;

  prods.forEach(p => {
    const card = document.createElement("article");
    card.className = `producto rv in ${p.agotado ? "agotado" : ""}`;

    const precioMostrar = p.precioOferta ? p.precioOferta : p.precio;
    const precioHTML = p.precioOferta
      ? `<s>$${p.precio.toFixed(2)}</s> $${p.precioOferta.toFixed(2)}`
      : `$${p.precio.toFixed(2)}`;

    let selloHTML = "";
    if (p.agotado) selloHTML = `<span class="sello agotado">Agotado</span>`;
    else if (p.precioOferta) selloHTML = `<span class="sello oferta">Oferta</span>`;
    else if (p.nuevo) selloHTML = `<span class="sello nuevo">Nuevo</span>`;

    card.innerHTML = `
      <button type="button" class="producto-abrir" onclick="abrirFichaProducto('${p.id}')">
        <div class="producto-foto">
          <div class="sellos">${selloHTML}</div>
          <img src="${p.foto || 'img/marca/icono.svg'}" alt="${p.nombre}" loading="lazy" onerror="this.onerror=null;this.src='img/marca/icono.svg';">
        </div>
        <div class="producto-txt">
          <span class="producto-cat">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p>${p.resumen || p.descripcion || ""}</p>
        </div>
      </button>
      <div class="producto-pie">
        <div class="precio">${precioHTML}</div>
        <button type="button" class="agregar" ${p.agotado ? "disabled" : ""} onclick="agregarAlPedido('${p.id}')" aria-label="Agregar a pedido">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* FICHA COMPLETA DE PRODUCTO (MODAL) */
window.abrirFichaProducto = function(id) {
  const p = CATALOGO.productos.find(item => item.id === id);
  if (!p) return;

  const dlg = document.getElementById("ficha");
  const cuerpo = document.getElementById("fichaCuerpo");
  if (!dlg || !cuerpo) return;

  cuerpo.innerHTML = `
    <div class="ficha-foto">
      <img src="${p.foto || 'img/marca/icono.svg'}" alt="${p.nombre}" onerror="this.onerror=null;this.src='img/marca/icono.svg';">
    </div>
    <div class="ficha-info">
      <h2 id="fichaNombre">${p.nombre}</h2>
      <div class="ficha-precio">
        ${p.precioOferta ? `<s>$${p.precio.toFixed(2)} USD</s> <span>$${p.precioOferta.toFixed(2)} USD</span> <span class="ahorro">Oferta</span>` : `<span>$${p.precio.toFixed(2)} USD</span>`}
      </div>
      <div class="ficha-desc">
        <p>${p.descripcion || p.resumen || "Artículo de excelente calidad para ferretería y taller."}</p>
      </div>
      <div class="ficha-comprar">
        <button type="button" class="btn btn-tinta btn-ancho" ${p.agotado ? "disabled" : ""} onclick="agregarAlPedido('${p.id}'); document.getElementById('ficha').close();">
          ${p.agotado ? "Agotado" : "🛒 Agregar al pedido"}
        </button>
      </div>
    </div>
  `;

  dlg.showModal();
};

/* GESTIÓN DE CARRITO / PEDIDO */
window.agregarAlPedido = function(id) {
  const p = CATALOGO.productos.find(item => item.id === id);
  if (!p || p.agotado) return;

  if (PEDIDO[id]) {
    PEDIDO[id].cantidad++;
  } else {
    PEDIDO[id] = { producto: p, cantidad: 1 };
  }

  actualizarPedidoUI();
  mostrarTostada(`Añadido: ${p.nombre}`);
};

function actualizarPedidoUI() {
  const contador = document.getElementById("contador");
  const pfCantidad = document.getElementById("pfCantidad");
  const pfTotal = document.getElementById("pfTotal");
  const btnFlotante = document.getElementById("pedidoFlotante");
  const listaEl = document.getElementById("pedidoLista");
  const totalEl = document.getElementById("pedidoTotal");

  let totalItems = 0;
  let totalMonto = 0;

  Object.values(PEDIDO).forEach(item => {
    totalItems += item.cantidad;
    const precio = item.producto.precioOferta ? item.producto.precioOferta : item.producto.precio;
    totalMonto += precio * item.cantidad;
  });

  if (contador) {
    contador.innerText = totalItems;
    contador.hidden = totalItems === 0;
  }

  if (btnFlotante) {
    btnFlotante.hidden = totalItems === 0;
    if (pfCantidad) pfCantidad.innerText = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`;
    if (pfTotal) pfTotal.innerText = `$${totalMonto.toFixed(2)}`;
  }

  if (totalEl) totalEl.innerText = `$${totalMonto.toFixed(2)} USD`;

  if (listaEl) {
    listaEl.innerHTML = "";
    if (totalItems === 0) {
      listaEl.innerHTML = `<div class="pedido-vacio"><b>Tu pedido está vacío</b><span>Elige productos del catálogo para agregarlos aquí.</span></div>`;
    } else {
      Object.entries(PEDIDO).forEach(([id, item]) => {
        const precio = item.producto.precioOferta ? item.producto.precioOferta : item.producto.precio;
        const linea = document.createElement("div");
        linea.className = "linea";
        linea.innerHTML = `
          <img src="${item.producto.foto || 'img/marca/icono.svg'}" alt="${item.producto.nombre}">
          <div>
            <b>${item.producto.nombre}</b>
            <small>$${precio.toFixed(2)} x ${item.cantidad}</small>
          </div>
          <div class="cantidad">
            <button type="button" onclick="modificarCantidad('${id}', -1)">-</button>
            <output>${item.cantidad}</output>
            <button type="button" onclick="modificarCantidad('${id}', 1)">+</button>
          </div>
        `;
        listaEl.appendChild(linea);
      });
    }
  }
}

window.modificarCantidad = function(id, delta) {
  if (!PEDIDO[id]) return;
  PEDIDO[id].cantidad += delta;
  if (PEDIDO[id].cantidad <= 0) {
    delete PEDIDO[id];
  }
  actualizarPedidoUI();
};

function enviarPedidoWhatsApp(e) {
  e.preventDefault();
  if (Object.keys(PEDIDO).length === 0) return;

  const tel = CATALOGO.contacto?.whatsapp || "5356950485";
  const cliente = document.getElementById("pNombre")?.value || "Cliente";
  const direccion = document.getElementById("pNegocio")?.value || "";

  let msj = `Hola, mi nombre es *${cliente}* y deseo realizar el siguiente pedido en *ToTo Tools*:\n\n`;
  let total = 0;

  Object.values(PEDIDO).forEach(i => {
    const p = i.producto;
    const precio = p.precioOferta ? p.precioOferta : p.precio;
    const sub = precio * i.cantidad;
    total += sub;
    msj += `• *${p.nombre}* x${i.cantidad} = $${sub.toFixed(2)} USD\n`;
  });

  if (direccion) msj += `\n📍 *Ubicación / Notas:* ${direccion}`;
  msj += `\n\n*Total Estimado:* $${total.toFixed(2)} USD`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msj)}`, "_blank");
}

/* MONEDAS Y TOSTADAS */
function inicializarMonedas() {
  const sel = document.getElementById("moneda");
  const caja = document.getElementById("monedaCaja");
  if (!sel || !CATALOGO.monedas?.lista) return;

  sel.innerHTML = "";
  CATALOGO.monedas.lista.forEach(m => {
    sel.innerHTML += `<option value="${m.codigo}">${m.codigo}</option>`;
  });

  if (caja) caja.hidden = false;
}

function mostrarTostada(txt) {
  const t = document.getElementById("tostada");
  if (!t) return;
  t.innerText = txt;
  t.classList.add("ver");
  setTimeout(() => t.classList.remove("ver"), 2200);
}

function inicializarAnimaciones() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".rv").forEach(el => observer.observe(el));
}
