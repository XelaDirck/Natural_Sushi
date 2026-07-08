/* cart.js — vista del carrito y envío por WhatsApp */
document.body.dataset.page = 'carrito';

(async function () {
  await new Promise(r => setTimeout(r, 50));

  const rowsEl = document.getElementById('cartRows');
  const wrapEl = document.getElementById('cartWrap');
  const emptyEl = document.getElementById('cartEmpty');
  const sumSubtotal = document.getElementById('sumSubtotal');
  const sumTotal = document.getElementById('sumTotal');
  const btnWa = document.getElementById('btnWhatsApp');

  if (!rowsEl) return;

  function render() {
    const cart = NS.getCart();
    if (!cart.length) {
      wrapEl.classList.add('ns-hidden');
      emptyEl.classList.remove('ns-hidden');
      return;
    }
    wrapEl.classList.remove('ns-hidden');
    emptyEl.classList.add('ns-hidden');

    rowsEl.innerHTML = cart.map(i => `
      <div class="ns-cart-row" data-id="${i.id}">
        <div class="ns-cart-thumb">${i.image_url ? `<img src="${i.image_url}" alt="">` : (i.emoji || '🍣')}</div>
        <div class="ns-cart-name">${escapeHTML(i.name)}<br>
          <small style="color:var(--text-muted);">${NS.money(i.price)} c/u</small>
        </div>
        <div>
          <div class="ns-qty">
            <button data-act="dec">−</button>
            <span>${i.qty}</span>
            <button data-act="inc">+</button>
          </div>
        </div>
        <div class="ns-cart-price">${NS.money(i.price * i.qty)}</div>
        <button class="ns-cart-remove" data-act="rm" aria-label="Eliminar">✕</button>
      </div>
    `).join('');

    const subtotal = NS.cartTotal();
    sumSubtotal.textContent = NS.money(subtotal);
    sumTotal.textContent = NS.money(subtotal);
  }

  rowsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const row = btn.closest('[data-id]');
    const id = parseInt(row.dataset.id, 10);
    const cart = NS.getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (btn.dataset.act === 'inc') NS.setQty(id, item.qty + 1);
    else if (btn.dataset.act === 'dec') NS.setQty(id, item.qty - 1);
    else if (btn.dataset.act === 'rm') NS.removeFromCart(id);
    render();
  });

  btnWa.addEventListener('click', async () => {
    const cart = NS.getCart();
    if (!cart.length) return;

    const lines = cart.map(i => `• ${i.qty} × ${i.name} — ${NS.money(i.price * i.qty)}`);
    const total = NS.money(NS.cartTotal());
    const msg = [
      'Hola, quiero hacer un pedido:',
      '',
      ...lines,
      '',
      `Total estimado: ${total}`,
      '',
      '(Pago en local o al recibir)',
    ].join('\n');

    const url = NS.waLink(msg);
    window.open(url, '_blank', 'noopener');
  });

  window.addEventListener('ns:cart-changed', render);
  render();
})();

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
