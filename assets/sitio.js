/* ToTo Tools — Ferretería Los Hermanos!
   Lógica interactiva completa: catálogo, modal de ficha de producto,
   carrito de pedido por WhatsApp, cambio de moneda y animaciones. */

let CATALOGO = null;
let PEDIDO = {};
let MONEDA_ACTUAL = "CUP";

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
    if (CATALOGO.monedas?.porDefecto) {
      MONEDA_ACTUAL = CATALOGO.monedas.porDefecto;
    }
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

  // 7. Renderizar secciones de Pasos, Preguntas y Horario
  renderizarPasos();
  renderizarPreguntas();
  renderizarHorario();

  // 8. Eventos de búsqueda y orden
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

  // 9. Eventos de Modal de Pedido
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

  // 10. Control del menú hamburguesa en móviles
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
  if (!container) return;

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

/* CONVERSIÓN DE PRECIOS SEGÚN MONEDA */
function formatearPrecio(precioBaseUSD) {
  const infoMoneda = CATALOGO.monedas?.lista?.find(m => m.codigo === MONEDA_ACTUAL);
  if (!infoMoneda) return `${precioBaseUSD.toFixed(2)} CUP`;

  // Si la base en el JSON es CUP y la tasa es respecto a CUP
  let valorFinal = precioBaseUSD;
  if (CATALOGO.monedas.base === "CUP" && MONEDA_ACTUAL === "USD") {
    valorFinal = precioBaseUSD * infoMoneda.tasa; // Tasa USD respecto a CUP
  } else if (CATALOGO.monedas.base === "USD" && MONEDA_ACTUAL === "CUP") {
    valorFinal = precioBaseUSD * infoMoneda.tasa;
  }

  const simbolo = infoMoneda.simbolo || "$";
  return `${simbolo}${valorFinal.toLocaleString('es-CU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${MONEDA_ACTUAL}`;
}

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

    const precioHTML = p.precioOferta
      ? `<s>${formatearPrecio(p.precio)}</s> ${formatearPrecio(p.precioOferta)}`
      : `${formatearPrecio(p.precio)}`;

    let selloHTML = "";
    if (p.agotado) selloHTML
