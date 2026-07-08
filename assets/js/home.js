/* home.js — carga productos destacados */
document.body.dataset.page = 'home';

(async function () {
  // Esperar a que NS.init corra los partials primero
  await new Promise(r => setTimeout(r, 50));

  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  try {
    const products = await NS.api('products.php?featured=1');
    if (!products.length) {
      grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column:1/-1;">No hay productos destacados aún.</p>';
      return;
    }
    grid.innerHTML = products.slice(0, 4).map(p => renderCard(p)).join('');
    grid.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.add, 10);
        const p = products.find(x => x.id === id);
        if (p) NS.addToCart(p);
      });
    });
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger); text-align:center; grid-column:1/-1;">No se pudo cargar el menú. ${e.message}</p>`;
  }
})();

function renderCard(p) {
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}">`
    : `<span>${p.emoji || '🍣'}</span>`;
  return `
    <article class="ns-product">
      <div class="ns-product__media">
        ${img}
        ${p.is_featured ? '<span class="ns-product__badge">Destacado</span>' : ''}
      </div>
      <div class="ns-product__body">
        <div class="ns-product__name">${escapeHTML(p.name)}</div>
        <div class="ns-product__desc">${escapeHTML(p.description || '')}</div>
        <div class="ns-product__price">${NS.money(p.price)}</div>
        <button class="ns-product__add" data-add="${p.id}">Agregar 🛒</button>
      </div>
    </article>
  `;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
