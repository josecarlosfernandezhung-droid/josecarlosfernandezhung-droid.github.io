/* Aplica lo que el panel guarda en datos/catalogo.json: logo, nombre y aviso */
(async function () {
  try {
    var c = await (await fetch('datos/catalogo.json?v=' + Date.now())).json(), m = c.marca || {}, a = c.aviso || {};
    if (m.logo) document.querySelectorAll('.logo-marca').forEach(function (e) { e.innerHTML = '<img src="' + m.logo + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:0">'; });
    if (m.nombre) { document.title = m.nombre; var t = document.querySelector('.logo-texto'); if (t && m.nombre !== 'ToTo Tools') t.textContent = m.nombre; }
    if (a.activo && a.texto) { var d = document.createElement('div'); d.textContent = a.texto; d.style.cssText = 'background:#fff3cd;color:#664d03;text-align:center;padding:10px 14px;font-weight:600'; document.body.insertBefore(d, document.body.firstChild); }
  } catch (e) { }
})();
