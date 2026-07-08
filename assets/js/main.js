/* ============================================================
   Natural Sushi - main.js
   Utilidades compartidas: carga de partials, config del sitio,
   estado del carrito (localStorage) y helpers.
   ============================================================ */

const NS = (function () {
  // ---------- Config API ----------
  // Cambia esto si tu backend está en otro path
  const API_BASE = '../api';

  // ---------- Estado del carrito (localStorage) ----------
  const CART_KEY = 'ns_cart_v1';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    // Evento para que otras vistas reaccionen
    window.dispatchEvent(new CustomEvent('ns:cart-changed', { detail: cart }));
  }
  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        emoji: product.emoji || '🍣',
        image_url: product.image_url || null,
        qty: 1,
      });
    }
    saveCart(cart);
    showToast(`${product.name} agregado al carrito`);
  }
  function setQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
  }
  function clearCart() { saveCart([]); }
  function cartTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  }
  function cartCount() {
    return getCart().reduce((s, i) => s + i.qty, 0);
  }
  function updateCartBadge() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const c = cartCount();
    el.textContent = c;
    el.hidden = c === 0;
  }

  // ---------- Formato ----------
  function money(n) {
    return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // ---------- API helper ----------
  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
    });
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ---------- Partials (navbar / footer) ----------
  async function loadPartial(id, url) {
    const target = document.getElementById(id);
    if (!target) return;
    try {
      const res = await fetch(url);
      target.innerHTML = await res.text();
    } catch (e) {
      console.error('Partial load failed:', url, e);
    }
  }

  // ---------- Configuración del negocio (settings) ----------
  let _settings = null;
  async function getSettings() {
    if (_settings) return _settings;
    try {
      _settings = await api('settings.php');
    } catch {
      _settings = {
        whatsapp_number: '5215512345678',
        business_name: 'Natural Sushi',
        phone: '55 1234 5678',
      };
    }
    return _settings;
  }

  // WhatsApp link builder
  function waLink(text = '') {
    if (!_settings) return '#';
    const num = (_settings.whatsapp_number || '').replace(/\D/g, '');
    const msg = encodeURIComponent(text);
    return `https://wa.me/${num}${msg ? `?text=${msg}` : ''}`;
  }

  // ---------- Toast ----------
  function showToast(msg) {
    let t = document.getElementById('nsToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'nsToast';
      t.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
        background:#4ADE80; color:#0A0F0C; padding:12px 20px;
        border-radius:999px; font-weight:600; font-size:14px; z-index:1000;
        box-shadow:0 4px 20px rgba(0,0,0,.4); opacity:0; transition:opacity .2s;
        pointer-events:none;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2000);
  }

  // ---------- Inicialización ----------
  async function init() {
    // Cargar partials
    await Promise.all([
      loadPartial('navbar', '../partials/navbar.html'),
      loadPartial('footer', '../partials/footer.html'),
    ]);

    // Toggle nav móvil
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }

    // Marcar link activo
    const page = document.body.dataset.page || detectPage();
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === page) a.classList.add('active');
    });

    updateCartBadge();

    // Aplicar settings donde aplique
    const settings = await getSettings();

    // Enlaces WhatsApp
    document.querySelectorAll('#waLink, #heroWa, #footerWa').forEach(el => {
      if (el) el.href = waLink('Hola, me gustaría hacer un pedido.');
    });

    // Contactos en footer
    setText('footerPhone', settings.phone);
    setText('footerPhone2', settings.phone);

    // Año en footer
    setText('footerYear', new Date().getFullYear());
  }

  function detectPage() {
    const p = location.pathname.split('/').pop() || 'index.html';
    if (p.startsWith('index')) return 'home';
    return p.replace('.html', '');
  }

  function setText(id, v) {
    const el = document.getElementById(id);
    if (el && v) el.textContent = v;
  }

  // ---------- Público ----------
  return {
    api, getSettings, waLink,
    getCart, addToCart, setQty, removeFromCart, clearCart, cartTotal, cartCount,
    money, showToast, updateCartBadge,
    init,
  };
})();

document.addEventListener('DOMContentLoaded', NS.init);
