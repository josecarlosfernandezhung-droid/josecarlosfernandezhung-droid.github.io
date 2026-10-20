const REPO_OWNER = "josecarlosfernandezhung-droid";
const REPO_NAME = "josecarlosfernandezhung-droid.github.io";
const FILE_PATH = "datos/catalogo.json";

let catalogoData = null;
let fileSHA = "";

document.addEventListener("DOMContentLoaded", () => {
  const savedToken = localStorage.getItem("gh_token") || "";
  if (savedToken) {
    document.getElementById("ghToken").value = savedToken;
    cargarCatalogoDesdeGitHub(savedToken);
  }

  document.getElementById("btnGuardarToken").addEventListener("click", () => {
    const token = document.getElementById("ghToken").value.trim();
    if (token) {
      localStorage.setItem("gh_token", token);
      cargarCatalogoDesdeGitHub(token);
    }
  });

  document.getElementById("btnNuevoProd").addEventListener("click", agregarNuevoProducto);
  document.getElementById("btnPublicar").addEventListener("click", publicarCambiosGitHub);
});

async function cargarCatalogoDesdeGitHub(token) {
  const status = document.getElementById("tokenStatus");
  status.style.color = "var(--azul)";
  status.innerText = "Cargando datos desde GitHub...";

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { Authorization: `token ${token}` }
    });

    if (!res.ok) throw new Error("Token inválido o problema de permisos");

    const data = await res.json();
    fileSHA = data.sha;
    const content = decodeURIComponent(escape(atob(data.content)));
    catalogoData = JSON.parse(content);

    status.style.color = "var(--verde)";
    status.innerText = "Conectado correctamente con GitHub";

    renderEditorProductos();
  } catch (err) {
    status.style.color = "var(--rojo)";
    status.innerText = err.message;
  }
}

function renderEditorProductos() {
  const container = document.getElementById("listaProductos");
  container.innerHTML = "";

  if (!catalogoData || !catalogoData.productos) return;

  catalogoData.productos.forEach((p, idx) => {
    const row = document.createElement("div");
    row.className = "prod-item-row";
    row.innerHTML = `
      <input type="text" class="inp-nombre" value="${p.nombre}" onchange="actualizarProd(${idx}, 'nombre', this.value)" placeholder="Nombre del producto">
      <input type="number" class="inp-precio" value="${p.precio}" onchange="actualizarProd(${idx}, 'precio', parseFloat(this.value))" placeholder="Precio">
      <select onchange="actualizarProd(${idx}, 'categoria', this.value)">
        <option value="electricas" ${p.categoria === 'electricas' ? 'selected' : ''}>Eléctricas</option>
        <option value="manuales" ${p.categoria === 'manuales' ? 'selected' : ''}>Manuales</option>
        <option value="accesorios" ${p.categoria === 'accesorios' ? 'selected' : ''}>Accesorios</option>
        <option value="fontaneria" ${p.categoria === 'fontaneria' ? 'selected' : ''}>Fontanería</option>
      </select>
      <button type="button" class="btn btn-tinta" onclick="eliminarProd(${idx})">Eliminar</button>
    `;
    container.appendChild(row);
  });
}

function actualizarProd(idx, campo, valor) {
  catalogoData.productos[idx][campo] = valor;
}

function agregarNuevoProducto() {
  if (!catalogoData) return;
  catalogoData.productos.unshift({
    id: "prod-" + Date.now(),
    nombre: "Nuevo Artículo de Ferretería",
    categoria: "manuales",
    precio: 0,
    precioOferta: null,
    resumen: "",
    descripcion: "",
    foto: "",
    agotado: false,
    nuevo: true,
    destacado: false,
    visible: true,
    orden: 0
  });
  renderEditorProductos();
}

function eliminarProd(idx) {
  if (confirm("¿Deseas eliminar este producto?")) {
    catalogoData.productos.splice(idx, 1);
    renderEditorProductos();
  }
}

async function publicarCambiosGitHub() {
  const token = localStorage.getItem("gh_token");
  if (!token || !catalogoData) {
    alert("Primero debes conectar un Token válido de GitHub.");
    return;
  }

  const status = document.getElementById("tokenStatus");
  status.style.color = "var(--azul)";
  status.innerText = "Publicando cambios en GitHub...";

  try {
    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(catalogoData, null, 1))));

    const body = {
      message: "Actualización de catálogo desde el panel de edición",
      content: updatedContent,
      sha: fileSHA
    };

    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("Error al publicar en GitHub");

    const data = await res.json();
    fileSHA = data.content.sha;

    status.style.color = "var(--verde)";
    status.innerText = "¡Cambios publicados exitosamente! Se reflejarán en tu tienda en 1 o 2 minutos.";
    alert("¡Catálogo actualizado correctamente!");
  } catch (err) {
    status.style.color = "var(--rojo)";
    status.innerText = "Error: " + err.message;
  }
}
