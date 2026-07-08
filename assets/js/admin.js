/* admin.js — login + CRUD de productos y categorías */
document.body.dataset.page = 'admin';

(async function () {
  await new Promise(r => setTimeout(r, 50));

  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  // ¿Ya está logueado?
  try {
    const me = await NS.api('auth.php?action=me');
    if (me && me.user) showAdmin();
  } catch { /* seguir con login */ }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.innerHTML = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      loginError.innerHTML = '<div class="ns-alert ns-alert--error">Ingresa usuario y contraseña.</div>';
      return;
    }

    try {
      await NS.api('auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      showAdmin();
    } catch (err) {
      loginError.innerHTML = `<div class="ns-alert ns-alert--error">${err.message || 'Credenciales inválidas'}</div>`;
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await NS.api('auth.php?action=logout', { method: 'POST' }); } catch {}
    location.reload();
  });

  // Tabs
  document.querySelectorAll('.ns-sidebar__link[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ns-sidebar__link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('ns-hidden'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('ns-hidden');
    });
  });

  // Modal close
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => document.getElementById(b.dataset.close).hidden = true);
  });

  // Products
  document.getElementById('btnNewProduct').addEventListener('click', () => openProductModal());
  document.getElementById('productForm').addEventListener('submit', saveProduct);

  // Categories
  document.getElementById('btnNewCategory').addEventListener('click', () => openCategoryModal());
  document.getElementById('categoryForm').addEventListener('submit', saveCategory);

  let allCategories = [];

  async function showAdmin() {
    loginView.classList.add('ns-hidden');
    adminView.classList.remove('ns-hidden');
    await loadCategories();
    await loadProducts();
  }

  // ---------- PRODUCTS ----------
  async function loadProducts() {
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '<tr><td colspan="6"><div class="ns-loader"></div></td></tr>';
    try {
      const products = await NS.api('products.php?all=1');
      if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:40px;">Sin productos aún.</td></tr>';
        return;
      }
      tbody.innerHTML = products.map(p => `
        <tr>
          <td><span class="thumb">${p.image_url ? `<img src="${p.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">` : (p.emoji || '🍣')}</span></td>
          <td><strong>${escapeHTML(p.name)}</strong><br><small style="color:var(--text-muted);">${escapeHTML((p.description || '').slice(0, 60))}</small></td>
          <td>${escapeHTML(getCategoryName(p.category_id))}</td>
          <td>${NS.money(p.price)}</td>
          <td><span class="ns-badge ${p.is_active == 1 ? 'ns-badge--on' : 'ns-badge--off'}">${p.is_active == 1 ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <button class="ns-icon-btn" data-edit="${p.id}">✎ Editar</button>
            <button class="ns-icon-btn" data-toggle="${p.id}">${p.is_active == 1 ? '● Desactivar' : '○ Activar'}</button>
            <button class="ns-icon-btn ns-icon-btn--danger" data-delete="${p.id}">🗑</button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
        const p = products.find(x => x.id == b.dataset.edit);
        openProductModal(p);
      }));
      tbody.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', async () => {
        const p = products.find(x => x.id == b.dataset.toggle);
        await NS.api('products.php', {
          method: 'PUT',
          body: JSON.stringify({ ...p, is_active: p.is_active == 1 ? 0 : 1 }),
        });
        showAlert('productsAlert', 'ok', 'Estado actualizado');
        loadProducts();
      }));
      tbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
          await NS.api(`products.php?id=${b.dataset.delete}`, { method: 'DELETE' });
          showAlert('productsAlert', 'ok', 'Producto eliminado');
          loadProducts();
        } catch (e) {
          showAlert('productsAlert', 'error', e.message);
        }
      }));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger); text-align:center;">${e.message}</td></tr>`;
    }
  }

  function openProductModal(p = null) {
    document.getElementById('productModalTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
    document.getElementById('pId').value = p?.id || '';
    document.getElementById('pName').value = p?.name || '';
    document.getElementById('pPrice').value = p?.price || '';
    document.getElementById('pEmoji').value = p?.emoji || '';
    document.getElementById('pImage').value = p?.image_url || '';
    document.getElementById('pDesc').value = p?.description || '';
    document.getElementById('pActive').checked = p ? p.is_active == 1 : true;
    document.getElementById('pFeatured').checked = p ? p.is_featured == 1 : false;

    const catSel = document.getElementById('pCategory');
    catSel.innerHTML = allCategories.map(c =>
      `<option value="${c.id}" ${p && p.category_id == c.id ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
    ).join('');

    document.getElementById('productModal').hidden = false;
  }

  async function saveProduct(e) {
    e.preventDefault();
    const payload = {
      id: document.getElementById('pId').value || null,
      name: document.getElementById('pName').value.trim(),
      category_id: parseInt(document.getElementById('pCategory').value, 10),
      price: parseFloat(document.getElementById('pPrice').value),
      emoji: document.getElementById('pEmoji').value.trim() || null,
      image_url: document.getElementById('pImage').value.trim() || null,
      description: document.getElementById('pDesc').value.trim(),
      is_active: document.getElementById('pActive').checked ? 1 : 0,
      is_featured: document.getElementById('pFeatured').checked ? 1 : 0,
    };
    try {
      await NS.api('products.php', {
        method: payload.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      document.getElementById('productModal').hidden = true;
      showAlert('productsAlert', 'ok', payload.id ? 'Producto actualizado' : 'Producto creado');
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- CATEGORIES ----------
  async function loadCategories() {
    const tbody = document.getElementById('categoriesTable');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5"><div class="ns-loader"></div></td></tr>';
    try {
      allCategories = await NS.api('categories.php?all=1');
      if (!tbody) return;
      if (!allCategories.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px;">Sin categorías.</td></tr>';
        return;
      }
      tbody.innerHTML = allCategories.map(c => `
        <tr>
          <td><strong>${escapeHTML(c.name)}</strong></td>
          <td><code>${escapeHTML(c.slug)}</code></td>
          <td>${c.sort_order}</td>
          <td><span class="ns-badge ${c.is_active == 1 ? 'ns-badge--on' : 'ns-badge--off'}">${c.is_active == 1 ? 'Activa' : 'Inactiva'}</span></td>
          <td>
            <button class="ns-icon-btn" data-edit-c="${c.id}">✎ Editar</button>
            <button class="ns-icon-btn ns-icon-btn--danger" data-del-c="${c.id}">🗑</button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-edit-c]').forEach(b => b.addEventListener('click', () => {
        const c = allCategories.find(x => x.id == b.dataset.editC);
        openCategoryModal(c);
      }));
      tbody.querySelectorAll('[data-del-c]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar categoría? (Solo funciona si no tiene productos)')) return;
        try {
          await NS.api(`categories.php?id=${b.dataset.delC}`, { method: 'DELETE' });
          showAlert('categoriesAlert', 'ok', 'Categoría eliminada');
          loadCategories();
        } catch (e) {
          showAlert('categoriesAlert', 'error', e.message);
        }
      }));
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger); text-align:center;">${e.message}</td></tr>`;
    }
  }

  function openCategoryModal(c = null) {
    document.getElementById('categoryModalTitle').textContent = c ? 'Editar categoría' : 'Nueva categoría';
    document.getElementById('cId').value = c?.id || '';
    document.getElementById('cName').value = c?.name || '';
    document.getElementById('cOrder').value = c?.sort_order || 0;
    document.getElementById('cActive').checked = c ? c.is_active == 1 : true;
    document.getElementById('categoryModal').hidden = false;
  }

  async function saveCategory(e) {
    e.preventDefault();
    const payload = {
      id: document.getElementById('cId').value || null,
      name: document.getElementById('cName').value.trim(),
      sort_order: parseInt(document.getElementById('cOrder').value, 10) || 0,
      is_active: document.getElementById('cActive').checked ? 1 : 0,
    };
    try {
      await NS.api('categories.php', {
        method: payload.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      document.getElementById('categoryModal').hidden = true;
      showAlert('categoriesAlert', 'ok', payload.id ? 'Categoría actualizada' : 'Categoría creada');
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  }

  function getCategoryName(id) {
    const c = allCategories.find(x => x.id == id);
    return c ? c.name : '—';
  }

  function showAlert(hostId, kind, msg) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = `<div class="ns-alert ns-alert--${kind}">${msg}</div>`;
    setTimeout(() => { host.innerHTML = ''; }, 3000);
  }
})();

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
