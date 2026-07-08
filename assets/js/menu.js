/* menu.js — vista de menú con filtro por categoría y búsqueda */
document.body.dataset.page = 'menu';

(async function () {
  await new Promise(r => setTimeout(r, 50));

  const grid = document.getElementById('products');
  const tabs = document.getElementById('catTabs');
  const search = document.getElementById('menuSearch');
  if (!grid || !tabs) return;

  let state = { products: [], categories: [], activeCat: 'all', query: '' };

  try {
    const [products, categories] = await Promise.all([
      NS.api('products.php'),
      NS.api('categories.php'),
    ]);
    state.products = products;
    state.categories = categories.filter(c => c.is_active == 1);
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger); text-align:center; grid-column:1/-1;">No se pudo cargar el menú. ${escapeHTML(e.message)}</p>`;
    return;
  }

  // Render tabs
  state.categories.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'ns-cat-tab';
    btn.dataset.cat = c.id;
    btn.textContent = c.name;
    tabs.appendChild(btn);
  });

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.ns-cat-tab');
    if (!btn) return;
    tabs.querySelectorAll('.ns-cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeCat = btn.dataset.cat;
    render();
  });

  if (search) {
    search.addEventListener('input', e => {
      state.query = e.target.value.trim().toLowerCase();
      render();
    });
  }

  render();

  function render() {
    const filtered = state.products.filter(p => {
      if (p.is_active != 1) return false;
      if (state.activeCat !== 'all' && String(p.category_id) !== String(state.activeCat)) return false;
      if (state.query && !p.name.toLowerCase().includes(state.query) &&
          !(p.description || '').toLowerCase().includes(state.query)) return false;
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column:1/-1; padding:40px 0;">No encontramos platillos con ese filtro.</p>';
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
    grid.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.add, 10);
        const p = state.products.find(x => x.id === id);
        if (p) NS.addToCart(p);
      });
    });
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
        ${p.is_featured == 1 ? '<span class="ns-product__badge">Destacado</span>' : ''}
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
