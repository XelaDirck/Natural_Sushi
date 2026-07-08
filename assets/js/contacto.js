/* contacto.js — carga datos de contacto desde settings y envía formulario */
document.body.dataset.page = 'contacto';

(async function () {
  await new Promise(r => setTimeout(r, 80));

  const settings = await NS.getSettings();

  set('cAddress', settings.address);
  set('cPhone',   settings.phone);
  set('cWa',      settings.phone);
  set('cHours',   settings.hours);

  setHref('sFb',  settings.facebook_url);
  setHref('sIg',  settings.instagram_url);
  setHref('sTk',  settings.tiktok_url);
  setHref('mapsCta', settings.google_maps_url);

  // Form
  const form = document.getElementById('contactForm');
  const result = document.getElementById('fResult');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('fName').value.trim();
      const email = document.getElementById('fEmail').value.trim();
      const msg = document.getElementById('fMsg').value.trim();

      if (!name || !email || !msg) {
        result.innerHTML = '<div class="ns-alert ns-alert--error">Por favor completa todos los campos.</div>';
        return;
      }

      // Enviar a WhatsApp con mensaje pre-armado
      const text = `Nuevo mensaje desde el sitio:\n\nNombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`;
      const url = NS.waLink(text);
      window.open(url, '_blank', 'noopener');

      result.innerHTML = '<div class="ns-alert ns-alert--ok">¡Gracias! Abrimos WhatsApp para enviar tu mensaje.</div>';
      form.reset();
    });
  }
})();

function set(id, v) { const e = document.getElementById(id); if (e && v) e.textContent = v; }
function setHref(id, v) { const e = document.getElementById(id); if (e && v) e.href = v; }
