/* ToTo Tools — Ferretería Los Hermanos! (Santiago de Cuba) */

let CATALOGO = null;
let PEDIDO = {};
let MONEDA_ACTUAL = "CUP";

document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  inicializarInterfaz();
  inicializarProgreso();
});

async function cargarCatalogo() {
  try {
    const res = await fetch("datos/catalogo.json?v=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    CATALOGO = await res.json();
    calcularFotosRepetidas();
    if (CATALOGO.monedas?.porDefecto) {
      MONEDA_ACTUAL = CATALOGO.monedas.porDefecto;
    }
  } catch (err) {
    console.error("Error cargando el catálogo:", err);
  }
}

function inicializarInterfaz() {
  if (!CATALOGO) return;

  const telWsp = CATALOGO.contacto?.whatsapp || "5356950485";
  document.querySelectorAll("[data-wa]").forEach(el => {
    el.href = `https://wa.me/${telWsp}?text=${encodeURIComponent("Hola, quisiera información sobre herramientas en ToTo Tools.")}`;
  });

  iniciarRotativa(CATALOGO.portada?.rotativas || ["talleres", "reparaciones", "construcción"]);
  iniciarFotosPortada(CATALOGO.portada?.fotos || []);
  renderizarBento();
  renderizarFiltros();
  renderizarProductos();
  inicializarMonedas();
  renderizarPasos();
  renderizarPreguntas();
  renderizarHorario();

  document.getElementById("buscar")?.addEventListener("input", renderizarProductos);
  document.getElementById("orden")?.addEventListener("change", renderizarProductos);

  document.getElementById("fOfertas")?.addEventListener("click", (e) => {
    const activo = e.target.getAttribute("aria-pressed") === "true";
    e.target.setAttribute("aria-pressed", !activo);
    renderizarProductos();
  });

  document.getElementById("fDisponibles")?.addEventListener("click", (e) => {
    const activo = e.target.getAttribute("aria-pressed") === "true";
    e.target.setAttribute("aria-pressed", !activo);
    renderizarProductos();
  });

  const dlgPedido = document.getElementById("pedido");
  document.getElementById("abrirPedido")?.addEventListener("click", () => dlgPedido?.showModal());
  document.getElementById("pedidoFlotante")?.addEventListener("click", () => dlgPedido?.showModal());

  document.querySelectorAll("[data-cerrar]").forEach(btn => {
    btn.addEventListener("click", () => btn.closest("dialog")?.close());
  });

  document.getElementById("pedidoForm")?.addEventListener("submit", enviarPedidoWhatsApp);
  document.getElementById("vaciar")?.addEventListener("click", () => {
    PEDIDO = {};
    actualizarPedidoUI();
  });

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


/* Foto de producto: si no tiene (o es una foto repetida en 5+ productos, o sea de relleno) se muestra un ícono de herramienta */
const ICONO_VACIO = "img/marca/icono.svg";
/* SVG inline de respaldo (por si el archivo aún no está en el repo) */
const ICONO_DATA = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#e8f1ff"/><g transform="translate(18 18) scale(3.5)" fill="none" stroke="#2f7cf6" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g></svg>');
let FOTOS_REPETIDAS = new Set();
function calcularFotosRepetidas() {
  const n = {};
  (CATALOGO.productos || []).forEach(p => { if (p.foto) n[p.foto] = (n[p.foto] || 0) + 1; });
  /* Solo marcar como relleno si se repite mucho (plantilla genérica) */
  FOTOS_REPETIDAS = new Set(Object.keys(n).filter(f => n[f] >= 8));
}
function fotoDe(p) {
  if (!p) return ICONO_VACIO;
  const f = p.foto || (p.fotos && p.fotos[0]) || "";
  if (f && !FOTOS_REPETIDAS.has(f)) return f;
  return ICONO_VACIO;
}
function esPlaceholder(src) {
  return !src || /icono\.svg$/.test(src) || src.indexOf("data:image/svg") === 0;
}
document.addEventListener("error", e => {
  const t = e.target;
  if (t && t.tagName === "IMG" && !t.dataset.fb) {
    t.dataset.fb = "1";
    t.classList.add("placeholder");
    t.src = ICONO_DATA;
  }
}, true);

function iniciarFotosPortada(fotos) {
  const contenedor = document.getElementById("escenaFotos");
  if (!contenedor || !fotos.length) return;
  contenedor.innerHTML = "";
  fotos.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "ToTo Tools";
    if (i === 0) img.classList.add("activa");
    contenedor.appendChild(img);
  });

  if (fotos.length > 1) {
    let idx = 0;
    const imgs = contenedor.querySelectorAll("img");
    setInterval(() => {
      imgs[idx].classList.remove("activa");
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add("activa");
    }, 4500);
  }
}

function renderizarBento() {
  const container = document.getElementById("bento");
  if (!container) return;
  container.innerHTML = `
    <div class="bloque grande">
      <div class="bloque-foto"><img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80" alt="Herramientas Eléctricas"></div>
      <div class="bloque-txt">
        <h3>Herramientas Eléctricas</h3>
        <p>Taladros, esmeriladoras y sierras de alta durabilidad para trabajo pesado.</p>
      </div>
    </div>
    <div class="bloque medio">
      <div class="bloque-foto"><img src="https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=600&q=80" alt="Herramientas Manuales"></div>
      <div class="bloque-txt">
        <h3>Herramientas Manuales</h3>
        <p>Juegos de llaves, alicates, destornilladores y martillos profesionales.</p>
      </div>
    </div>
    <div class="bloque">
      <div class="bloque-txt" style="padding-top:24px;">
        <h3>Discos y Brocas</h3>
        <p>Consumibles de corte y perforación para metal, concreto y madera.</p>
      </div>
    </div>
    <div class="bloque">
      <div class="bloque-txt" style="padding-top:24px;">
        <h3>Fontanería y Gasfitería</h3>
        <p>Cintas de teflón, uniones, válvulas y accesorios para tuberías.</p>
      </div>
    </div>
  `;
}

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

function formatearPrecio(precioBase) {
  const infoMoneda = CATALOGO.monedas?.lista?.find(m => m.codigo === MONEDA_ACTUAL);
  if (!infoMoneda) return `${precioBase} CUP`;

  let valor = precioBase;
  if (CATALOGO.monedas.base === "CUP" && MONEDA_ACTUAL === "USD") {
    valor = precioBase * infoMoneda.tasa;
  }
  const simbolo = infoMoneda.simbolo || "$";
  return `${simbolo}${valor.toLocaleString('es-CU', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ${MONEDA_ACTUAL}`;
}

function renderizarProductos() {
  const container = document.getElementById("catalogo");
  const vacio = document.getElementById("vacio");
  const resInfo = document.getElementById("resultadoInfo");
  if (!container || !CATALOGO.productos) return;

  let prods = [...CATALOGO.productos];
  if (CATEGORIA_SELECCIONADA !== "todas") {
    prods = prods.filter(p => p.categoria === CATEGORIA_SELECCIONADA);
  }

  const fOfertas = document.getElementById("fOfertas")?.getAttribute("aria-pressed") === "true";
  if (fOfertas) prods = prods.filter(p => p.precioOferta !== null && p.precioOferta < p.precio);

  const fDisponibles = document.getElementById("fDisponibles")?.getAttribute("aria-pressed") === "true";
  if (fDisponibles) prods = prods.filter(p => !p.agotado);

  const q = (document.getElementById("buscar")?.value || "").toLowerCase().trim();
  if (q) prods = prods.filter(p => p.nombre.toLowerCase().includes(q) || (p.resumen && p.resumen.toLowerCase().includes(q)));

  const ord = document.getElementById("orden")?.value || "rel";
  if (ord === "asc") prods.sort((a, b) => a.precio - b.precio);
  if (ord === "desc") prods.sort((a, b) => b.precio - a.precio);
  if (ord === "az") prods.sort((a, b) => a.nombre.localeCompare(b.nombre));

  container.innerHTML = "";
  if (resInfo) resInfo.innerText = `${prods.length} ${prods.length === 1 ? 'producto encontrado' : 'productos encontrados'}`;

  if (prods.length === 0) {
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;

  prods.forEach(p => {
    const card = document.createElement("article");
    card.className = `producto ${p.agotado ? "agotado" : ""}`;

    const precioHTML = p.precioOferta
      ? `<s>${formatearPrecio(p.precio)}</s> ${formatearPrecio(p.precioOferta)}`
      : `${formatearPrecio(p.precio)}`;

    let selloHTML = "";
    if (p.agotado) selloHTML = `<span class="sello agotado" style="background:#4c5566; color:#fff; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700;">Agotado</span>`;
    else if (p.precioOferta) selloHTML = `<span class="sello oferta" style="background:var(--rojo); color:#fff; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700;">Oferta</span>`;

    const fotoSrc = fotoDe(p);
    card.innerHTML = `
      <button type="button" class="producto-abrir" onclick="abrirFichaProducto('${p.id}')">
        <div class="producto-foto">
          <div class="sellos" style="position:absolute; left:10px; top:10px; z-index:2;">${selloHTML}</div>
          <img src="${fotoSrc}" alt="${p.nombre}" loading="lazy" class="${esPlaceholder(fotoSrc) ? 'placeholder' : ''}">
        </div>
        <div class="producto-txt">
          <span class="producto-cat">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p>${p.resumen || ""}</p>
        </div>
      </button>
      <div class="producto-pie">
        <div class="precio">${precioHTML}</div>
        <button type="button" class="agregar" ${p.agotado ? "disabled" : ""} onclick="agregarAlPedido('${p.id}')" aria-label="Agregar">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.abrirFichaProducto = function(id) {
  const p = CATALOGO.productos.find(item => item.id === id);
  if (!p) return;

  const dlg = document.getElementById("ficha");
  const cuerpo = document.getElementById("fichaCuerpo");
  if (!dlg || !cuerpo) return;

  const precioFinal = p.precioOferta ? p.precioOferta : p.precio;

  cuerpo.innerHTML = `
    <div class="ficha-foto">
      <img src="${fotoDe(p)}" alt="${p.nombre}" class="${esPlaceholder(fotoDe(p)) ? 'placeholder' : ''}">
    </div>
    <div class="ficha-info">
      <h2>${p.nombre}</h2>
      <div class="ficha-precio">${formatearPrecio(precioFinal)}</div>
      <p style="color:var(--tinta-2); font-size:15px;">${p.descripcion || p.resumen || "Herramienta de excelente calidad para taller y hogar."}</p>
      <button type="button" class="btn btn-tinta btn-ancho" ${p.agotado ? "disabled" : ""} onclick="agregarAlPedido('${p.id}'); document.getElementById('ficha').close();">
        ${p.agotado ? "Agotado" : "🛒 Agregar al pedido"}
      </button>
    </div>
  `;

  dlg.showModal();
};

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
    if (pfCantidad) pfCantidad.innerText = `${totalItems} ${totalItems === 1 ? 'prod.' : 'prods.'}`;
    if (pfTotal) pfTotal.innerText = formatearPrecio(totalMonto);
  }

  if (totalEl) totalEl.innerText = formatearPrecio(totalMonto);
  const notaEl = document.getElementById("pedidoNota");
  if (notaEl) notaEl.textContent = (CATALOGO.condiciones && CATALOGO.condiciones.entrega) || "";

  if (listaEl) {
    listaEl.innerHTML = "";
    if (totalItems === 0) {
      listaEl.innerHTML = `<div class="pedido-vacio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg><b>Tu pedido está vacío</b><span>Elige productos del catálogo</span></div>`;
    } else {
      Object.entries(PEDIDO).forEach(([id, item]) => {
        const precio = item.producto.precioOferta ? item.producto.precioOferta : item.producto.precio;
        const linea = document.createElement("div");
        linea.className = "linea";
        const sub = precio * item.cantidad;
        const src = fotoDe(item.producto);
        linea.innerHTML = `
          <img src="${src}" alt="${item.producto.nombre}" class="${esPlaceholder(src) ? 'placeholder' : ''}" loading="lazy">
          <div class="lin-info">
            <b>${item.producto.nombre}</b>
            <small>${formatearPrecio(precio)} c/u</small>
            ${item.cantidad > 1 ? `<span class="subtotal">${formatearPrecio(sub)}</span>` : ''}
          </div>
          <div class="cantidad">
            <button type="button" onclick="modificarCantidad('${id}', -1)" aria-label="Quitar">−</button>
            <output>${item.cantidad}</output>
            <button type="button" onclick="modificarCantidad('${id}', 1)" aria-label="Añadir">+</button>
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
  if (PEDIDO[id].cantidad <= 0) delete PEDIDO[id];
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
    msj += `• *${p.nombre}* x${i.cantidad} = ${formatearPrecio(sub)}\n`;
  });

  if (direccion) msj += `\n📍 *Ubicación / Notas:* ${direccion}`;
  msj += `\n\n*Total Estimado:* ${formatearPrecio(total)}`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msj)}`, "_blank");
}

function renderizarPasos() {
  const container = document.getElementById("pasosLista");
  if (!container || !CATALOGO.pasos) return;
  container.innerHTML = "";
  CATALOGO.pasos.forEach((p, i) => {
    container.innerHTML += `
      <li style="background:var(--blanco); border:1px solid var(--borde); padding:24px; border-radius:var(--radio-s);">
        <span style="font:700 13px var(--f-mono); color:var(--azul);">0${i+1}</span>
        <h3 style="font-size:18px; margin:8px 0 6px;">${p.titulo}</h3>
        <p style="color:var(--tinta-2); font-size:14px;">${p.texto}</p>
      </li>
    `;
  });
}

function renderizarPreguntas() {
  const container = document.getElementById("acordeon");
  if (!container || !CATALOGO.preguntas) return;
  container.innerHTML = "";
  CATALOGO.preguntas.forEach((p, i) => {
    container.innerHTML += `
      <details class="pregunta" ${i === 0 ? "open" : ""}>
        <summary>
          <span>${p.pregunta}</span>
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <p>${p.respuesta}</p>
      </details>
    `;
  });
}

function renderizarHorario() {
  const container = document.getElementById("horario");
  if (!container) return;
  container.innerHTML = `
    <h3>Horario de atención</h3>
    <div style="background:#1b263b; color:#22c55e; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:700; display:inline-block; margin-bottom:16px;">Abierto hoy</div>
    <ul class="horario-lista">
      <li><span>Lunes</span><b>09:00 – 17:00</b></li>
      <li><span>Martes</span><b>09:00 – 17:00</b></li>
      <li><span>Miércoles</span><b>09:00 – 17:00</b></li>
      <li><span>Jueves</span><b>09:00 – 17:00</b></li>
      <li><span>Viernes</span><b>09:00 – 17:00</b></li>
      <li><span>Sábado</span><b>09:00 – 17:00</b></li>
      <li><span>Domingo</span><b style="color:var(--luz-3)">Cerrado</b></li>
    </ul>
  `;
}

function inicializarMonedas() {
  const sel = document.getElementById("moneda");
  if (!sel || !CATALOGO.monedas?.lista) return;
  sel.innerHTML = "";
  CATALOGO.monedas.lista.forEach(m => {
    sel.innerHTML += `<option value="${m.codigo}" ${m.codigo === MONEDA_ACTUAL ? 'selected' : ''}>${m.codigo}</option>`;
  });
  sel.addEventListener("change", (e) => {
    MONEDA_ACTUAL = e.target.value;
    renderizarProductos();
    actualizarPedidoUI();
  });
}

function mostrarTostada(txt) {
  const t = document.getElementById("tostada");
  if (!t) return;
  t.innerText = txt;
  t.classList.add("ver");
  setTimeout(() => t.classList.remove("ver"), 2200);
}

function inicializarProgreso() {
  window.addEventListener("scroll", () => {
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progreso = window.scrollY / total;
    document.getElementById("barraProgreso")?.style.setProperty("--p", progreso);
  });
}
