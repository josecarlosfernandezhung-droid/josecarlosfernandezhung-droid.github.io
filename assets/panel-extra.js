/* Aplica lo que el panel guarda en datos/catalogo.json: logo, nombre y aviso.
   El logo se recuerda de la visita anterior para que salga al instante (sin parpadeo ni logo de relleno). */
(function () {
  var logos = function () { return document.querySelectorAll('.logo-marca'); };
  function ponLogo(src) {
    logos().forEach(function (e) {
      e.innerHTML = '<img src="' + src + '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:0">';
      e.classList.add('ok');
    });
  }
  function relleno() {
    logos().forEach(function (e) { if (!e.classList.contains('ok')) { e.textContent = '🛠️'; e.classList.add('ok'); } });
  }
  var guardado = ''; try { guardado = localStorage.getItem('tt-logo') || ''; } catch (e) { }
  if (guardado) ponLogo(guardado);
  (async function () {
    try {
      var c = await (await fetch('datos/catalogo.json?v=' + Date.now())).json(), m = c.marca || {}, a = c.aviso || {};
      if (m.logo) { if (m.logo !== guardado) ponLogo(m.logo); try { localStorage.setItem('tt-logo', m.logo); } catch (e) { } }
      else { try { localStorage.removeItem('tt-logo'); } catch (e) { } relleno(); }
      if (m.nombre) { document.title = m.nombre; var t = document.querySelector('.logo-texto'); if (t && m.nombre !== 'ToTo Tools') t.textContent = m.nombre; }
      if (a.activo && a.texto) { var d = document.createElement('div'); d.textContent = a.texto; d.style.cssText = 'background:#fff3cd;color:#664d03;text-align:center;padding:10px 14px;font-weight:600'; document.body.insertBefore(d, document.body.firstChild); }
    } catch (e) { relleno(); }
  })();
})();
