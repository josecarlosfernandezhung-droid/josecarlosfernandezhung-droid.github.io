document.addEventListener("DOMContentLoaded", async () => {
  let datos = null;

  try {
    const respuesta = await fetch("datos/catalogo.json");
    if (!respuesta.ok) throw new Error("No se pudo conectar con el catálogo");
    datos = await respuesta.json();
  } catch (e) {
    console.error(e);
    mostrarErrorCatalogo();
    return;
  }

  // Configurar teléfono de WhatsApp globalmente
  const telefonoWsp = datos.contacto?.whatsapp || "5356950485";
  configurarWhatsApp(telefonoWsp);

  // Renderizar categorías y productos
  renderizarTienda(datos);
});

function configurarWap(tel) {
  document.querySelectorAll("[data-wa]").forEach(el => {
    el.href = `https://wa.me/${tel}`;
  });
}

function configurarWhatsApp(tel) {
  document.querySelectorAll("[data-wa]").forEach(el => {
    el.href = `https://wa.me/${tel}`;
  });
}

function mostrarErrorCatalogo() {
  const contenedor = document.getElementById("catalogo");
  if (contenedor) {
    contenedor.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1px solid var(--borde);">
        <b>No se pudo cargar el catálogo.</b>
        <p style="color: var(--tinta-2); margin-top: 8px;">Escríbenos directamente por WhatsApp al <strong>+53 56950485</strong>.</p>
      </div>
    `;
  }
}

function renderizarTienda(datos) {
  const contenedor = document.getElementById("catalogo");
  const chipsContainer = document.getElementById("chips");
  if (!contenedor) return;

  const productos = datos.productos || [];
  const categorias = datos.categorias || [];

  // Renderizar chips de categorías
  if (chipsContainer) {
    chipsContainer.innerHTML = `<button type="button" class="chip" aria-selected="true" onclick="filtrarCategoria('todos', this)">Todos <small>${productos.length}</small></button>`;
    categorias.forEach(cat => {
      const cant = productos.filter(p => p.categoria === cat.id).length;
      chipsContainer.innerHTML += `<button type="button" class="chip" aria-selected="false" onclick="filtrarCategoria('${cat.id}', this)">${cat.nombre} <small>${cant}</small></button>`;
    });
  }

  dibujarProductos(productos);

  // Buscador
  const inputBuscar = document.getElementById("buscar");
  if (inputBuscar) {
    inputBuscar.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(query) || p.resumen.toLowerCase().includes(query));
      dibujarProductos(filtrados);
    });
  }
}

let categoriaActual = "todos";

window.filtrarCategoria = function(catId, btn) {
  categoriaActual = catId;
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-selected", "false"));
  btn.setAttribute("aria-selected", "true");

  fetch("datos/catalogo.json")
    .then(res => res.json())
    .then(datos => {
      let prods = datos.productos || [];
      if (catId !== "todos") {
        prods = prods.filter(p => p.categoria === catId);
      }
      dibujarProductos(prods);
    });
};

function dibujarProductos(lista) {
  const contenedor = document.getElementById("catalogo");
  const vacio = document.getElementById("vacio");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    if (vacio) vacio.hidden = false;
    return;
  }
  if (vacio) vacio.hidden = true;

  lista.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto rv in";
    card.innerHTML = `
      <div class="producto-foto" style="background:#fff; display:grid; place-items:center; min-height:140px;">
        <span style="font-weight:700; color:var(--tinta-2); font-size:13px; padding:10px; text-align:center;">${p.nombre}</span>
      </div>
      <div class="producto-txt">
        <span class="producto-cat">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p>${p.resumen || p.descripcion || ""}</p>
      </div>
      <div class="producto-pie">
        <div class="precio">$${p.precio.toFixed(2)} USD</div>
        <button class="agregar" type="button" onclick="agregarAlPedido('${p.id}', '${p.nombre.replace(/'/g, "")}', ${p.precio})" aria-label="Agregar">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    `;
    contenedor.appendChild(card);
  });
}

let carrito = [];

window.agregarAlPedido = function(id, nombre, precio) {
  const existente = carrito.find(item => item.id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }
  actualizarCarritoUI();
  mostrarTostada(`Agregado: ${nombre}`);
};

function actualizarCarritoUI() {
  const contador = document.getElementById("contador");
  const pfCantidad = document.getElementById("pfCantidad");
  const pfTotal = document.getElementById("pfTotal");
  const pedidoFlotante = document.getElementById("pedidoFlotante");
  const pedidoLista = document.getElementById("pedidoLista");
  const pedidoTotal = document.getElementById("pedidoTotal");

  const totalItems = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrecio = carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

  if (contador) {
    contador.innerText = totalItems;
    contador.hidden = totalItems === 0;
  }

  if (pedidoFlotante) {
    pedidoFlotante.hidden = totalItems === 0;
    if (pfCantidad) pfCantidad.innerText = `${totalItems} productos`;
    if (pfTotal) pfTotal.innerText = `$${totalPrecio.toFixed(2)}`;
  }

  if (pedidoTotal) pedidoTotal.innerText = `$${totalPrecio.toFixed(2)}`;

  if (pedidoLista) {
    pedidoLista.innerHTML = "";
    if (carrito.length === 0) {
      pedidoLista.innerHTML = `<div class="pedido-vacio"><b>Tu pedido está vacío</b><span>Agrega artículos desde el catálogo.</span></div>`;
    } else {
      carrito.forEach(item => {
        const linea = document.createElement("div");
        linea.className = "linea";
        linea.innerHTML = `
          <div><b>${item.nombre}</b><small>$${item.precio.toFixed(2)} USD</small></div>
          <div class="cantidad">
            <button type="button" onclick="cambiarCant('${item.id}', -1)">-</button>
            <output>${item.cantidad}</output>
            <button type="button" onclick="cambiarCant('${item.id}', 1)">+</button>
          </div>
        `;
        pedidoLista.appendChild(linea);
      });
    }
  }
}

window.cambiarCant = function(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (item) {
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      carrito = carrito.filter(i => i.id !== id);
    }
  }
  actualizarCarritoUI();
};

function mostrarTostada(msg) {
  const t = document.getElementById("tostada");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("ver");
  setTimeout(() => t.classList.remove("ver"), 2500);
}

// Abrir/Cerrar diálogo de pedido
document.addEventListener("DOMContentLoaded", () => {
  const btnAbrir = document.getElementById("abrirPedido");
  const btnFlotante = document.getElementById("pedidoFlotante");
  const dialogoPedido = document.getElementById("pedido");

  const abrirModal = () => { if (dialogoPedido) dialogoPedido.showModal(); };
  if (btnAbrir) btnAbrir.addEventListener("click", abrirModal);
  if (btnFlotante) btnFlotante.addEventListener("click", abrirModal);

  document.querySelectorAll("[data-cerrar]").forEach(btn => {
    btn.addEventListener("click", () => {
      const diag = btn.closest("dialog");
      if (diag) diag.close();
    });
  });

  const formPedido = document.getElementById("pedidoForm");
  if (formPedido) {
    formPedido.addEventListener("submit", (e) => {
      e.preventDefault();
      if (carrito.length === 0) return;

      const nombre = document.getElementById("pNombre").value || "Cliente";
      const notas = document.getElementById("pNegocio").value || "";
      let texto = `Hola, mi nombre es *${nombre}* y quiero hacer este pedido en ToTo Tools:\n\n`;

      let total = 0;
      carrito.forEach(i => {
        const sub = i.precio * i.cantidad;
        total += sub;
        texto += `• ${i.nombre} x${i.cantidad} = $${sub.toFixed(2)} USD\n`;
      });

      if (notas) texto += `\nNotas: ${notas}`;
      texto += `\n\n*Total Estimado:* $${total.toFixed(2)} USD`;

      window.open(`https://wa.me/5356950485?text=${encodeURIComponent(texto)}`, "_blank");
    });
  }

  const btnVaciar = document.getElementById("vaciar");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      carrito = [];
      actualizarCarritoUI();
    });
  }
});
