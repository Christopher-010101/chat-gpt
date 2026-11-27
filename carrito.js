(() => {
  const storageKey = "dp_cart";
  const money = (n) => new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n) || 0);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const keyOf = (item) => item.cart_key || ((item.kind === "bundle" ? "bundle:" : "product:") + item.id);
  const get = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]").map((item) => Object.assign({}, item, {
        kind: item.kind === "bundle" ? "bundle" : "product",
        cart_key: keyOf(item),
        quantity: Math.max(1, Number(item.quantity) || 1)
      }));
    } catch (_) { return []; }
  };
  const save = (cart) => { localStorage.setItem(storageKey, JSON.stringify(cart)); window.DP.updateCount && window.DP.updateCount(); };
  const add = (product) => {
    const kind = product.kind === "bundle" ? "bundle" : "product";
    const item = Object.assign({}, product, { kind, cart_key: (kind === "bundle" ? "bundle:" : "product:") + product.id });
    const cart = get(), found = cart.find((x) => x.cart_key === item.cart_key);
    const max = Number(item.available_stock == null ? item.stock : item.available_stock);
    if (Number.isFinite(max) && max <= 0) return window.DP.toast("Este artículo está agotado.");
    if (found) {
      if (Number.isFinite(max) && found.quantity >= max) return window.DP.toast("No hay más unidades disponibles.");
      found.quantity += 1;
    } else {
      item.quantity = 1;
      cart.push(item);
    }
    save(cart); window.DP.toast("Producto agregado al carrito."); render();
  };
  const remove = (key) => { save(get().filter((x) => x.cart_key !== key)); render(); };
  const change = (key, quantity) => {
    const cart = get(), item = cart.find((x) => x.cart_key === key);
    if (item) {
      const max = Number(item.available_stock == null ? item.stock : item.available_stock);
      if (Number.isFinite(max) && max > 0) item.quantity = Math.min(max, Math.max(1, Number(quantity) || 1));
      else item.quantity = Math.max(1, Number(quantity) || 1);
    }
    save(cart); render();
  };
  const listPrice = (item) => Math.max(Number(item.price) || 0, Number(item.compare_at_price) || 0);
  const totals = (cart) => {
    const subtotal = cart.reduce((sum, item) => sum + listPrice(item) * item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);
    return { subtotal, total, discount: Math.max(0, subtotal - total), shipping: 0 };
  };
  function render() {
    const host = document.querySelector("#cartItems");
    if (!host) return;
    const cart = get(), totalsNow = totals(cart);
    host.innerHTML = cart.length ? cart.map((item) => {
      const image = item.image || item.image_url || "assets/img/accesorios.svg";
      const stock = Number(item.available_stock == null ? item.stock : item.available_stock);
      const saving = item.compare_at_price > item.price
        ? `<span class="small muted">Ahorro: ${money(item.compare_at_price - item.price)} c/u</span>`
        : "";
      const cannotAddMore = Number.isFinite(stock) && item.quantity >= stock;

      return `
        <article class="cart-line panel">
          <img src="${esc(image)}" alt="">
          <div class="cart-line-main">
            <strong>${esc(item.name)}</strong>
            <span class="small">${item.kind === "bundle" ? "Combo · " : ""}${money(item.price)} c/u</span>
            ${saving}
            <div class="cart-quantity">
              <button type="button" class="btn-outline btn-small" data-minus="${esc(item.cart_key)}" aria-label="Restar">−</button>
              <strong>${item.quantity}</strong>
              <button type="button" class="btn-outline btn-small" data-plus="${esc(item.cart_key)}" aria-label="Sumar" ${cannotAddMore ? "disabled" : ""}>＋</button>
              <button type="button" class="btn-outline btn-small danger" data-remove="${esc(item.cart_key)}">Quitar</button>
            </div>
          </div>
          <strong class="cart-line-total">${money(item.price * item.quantity)}</strong>
        </article>
      `;
    }).join("") : '<div class="empty">Tu carrito está vacío.</div>';
    const units = cart.reduce((sum, item) => sum + item.quantity, 0);
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
    set("cartUnits", units); set("cartSubtotal", money(totalsNow.subtotal)); set("cartDiscount", "−" + money(totalsNow.discount));
    set("shippingCost", money(totalsNow.shipping)); set("cartTotal", money(totalsNow.total));
    host.querySelectorAll("[data-minus]").forEach((b) => b.onclick = () => change(b.dataset.minus, (cart.find((x) => x.cart_key === b.dataset.minus).quantity || 1) - 1));
    host.querySelectorAll("[data-plus]").forEach((b) => b.onclick = () => change(b.dataset.plus, (cart.find((x) => x.cart_key === b.dataset.plus).quantity || 0) + 1));
    host.querySelectorAll("[data-remove]").forEach((b) => b.onclick = () => remove(b.dataset.remove));
  }
  window.DP = window.DP || {};
  Object.assign(window.DP, { addToCart: add, renderCart: render, money });
  document.addEventListener("DOMContentLoaded", () => {
    render();
    const form = document.querySelector("#deliveryForm");
    const dialog = document.querySelector("#orderReview");
    const closeDialog = () => dialog && dialog.close();
    dialog && dialog.querySelectorAll("[data-close-review]").forEach((b) => b.addEventListener("click", closeDialog));
    document.querySelector("#checkoutBtn")?.addEventListener("click", () => review(form, dialog));
    document.querySelector("#confirmOrderBtn")?.addEventListener("click", () => checkout(form, dialog));
    prefillAddress(form);
  });
  async function prefillAddress(form) {
    if (!form || !window.DP.db) return;
    const { data: { user } = {} } = await window.DP.db.auth.getUser();
    if (!user) return;
    const profile = await window.DP.db.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle();
    if (!form.elements.full_name.value) form.elements.full_name.value = profile.data && profile.data.full_name || user.user_metadata && user.user_metadata.full_name || "";
    if (!form.elements.phone.value) form.elements.phone.value = profile.data && profile.data.phone || user.phone || "";
    if (!form.elements.email.value) form.elements.email.value = user.email || "";
  }
  function addressFrom(form) {
    const fd = new FormData(form), values = {};
    ["full_name", "phone", "email", "province", "municipality", "sector", "street", "house_number", "reference", "instructions"].forEach((key) => {
      values[key] = String(fd.get(key) || "").trim();
    });
    return values;
  }
  async function review(form, dialog) {
    let cart = get();
    if (!cart.length) return window.DP.toast("Agrega productos antes de continuar.");
    if (!form.reportValidity()) return;
    try {
      cart = await refreshPricesAndStock(cart);
      save(cart);
    } catch (error) {
      return window.DP.toast("Revisa el carrito: " + error.message);
    }
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cash_on_delivery";
    const address = addressFrom(form), amount = totals(cart);
    const labels = { cash_on_delivery: "Pago contra entrega", paypal: "PayPal", card: "Tarjeta", whatsapp: "Coordinar por WhatsApp" };
    const body = document.querySelector("#orderReviewBody");
    const lineItems = cart.map((item) => `
      <div class="admin-list-row">
        <span>${esc(item.name)} × ${item.quantity}${item.kind === "bundle" ? " (combo)" : ""}</span>
        <strong>${money(item.price * item.quantity)}</strong>
      </div>
    `).join("");
    const paymentMessage = method === "cash_on_delivery"
      ? "El pedido se registrará con pago pendiente. El pago se confirmará solo después de validarlo al entregar."
      : method === "whatsapp"
        ? "WhatsApp sirve para coordinar y no crea un pedido en la tienda."
        : "Este método todavía no cuenta con una pasarela integrada; no se realizará ningún cobro ni se registrará un pedido.";

    body.innerHTML = `
      <section class="review-order-items">
        <h3>Productos</h3>
        ${lineItems}
      </section>
      <section class="review-order-total">
        <div><span>Subtotal</span><strong>${money(amount.subtotal)}</strong></div>
        <div><span>Descuentos</span><strong>−${money(amount.discount)}</strong></div>
        <div><span>Envío</span><strong>${money(amount.shipping)}</strong></div>
        <div class="checkout-grand"><span>Total a pagar</span><strong>${money(amount.total)}</strong></div>
      </section>
      <section class="review-order-address">
        <h3>Dirección de entrega</h3>
        <p>
          ${esc(address.full_name)} · ${esc(address.phone)}<br>
          ${esc(address.email)}<br>
          ${esc(address.street)} ${esc(address.house_number)}, ${esc(address.sector)},
          ${esc(address.municipality)}, ${esc(address.province)}<br>
          Referencia: ${esc(address.reference)}
          ${address.instructions ? `<br>Instrucciones: ${esc(address.instructions)}` : ""}
        </p>
      </section>
      <p><strong>Método:</strong> ${esc(labels[method] || method)}</p>
      <p class="small muted">${paymentMessage}</p>
    `;
    const confirmButton = document.querySelector("#confirmOrderBtn");
    confirmButton.textContent = method === "cash_on_delivery" ? "Confirmar pedido contra entrega" : method === "whatsapp" ? "Abrir WhatsApp para coordinar" : "Cerrar revisión";
    confirmButton.dataset.method = method;
    dialog.showModal();
  }
  async function refreshPricesAndStock(cart) {
    const db = window.DP.db;
    if (!db) return cart;
    const productIds = cart.filter((item) => item.kind !== "bundle").map((item) => item.id);
    const bundleIds = cart.filter((item) => item.kind === "bundle").map((item) => item.id);
    const [productResult, bundleResult] = await Promise.all([
      productIds.length ? db.from("products").select("id,name,price,compare_at_price,stock,image_url,is_published,status").in("id", productIds) : Promise.resolve({ data: [], error: null }),
      bundleIds.length ? db.from("bundles").select("id,name,price,stock,image_url,is_published,status,starts_at,ends_at,bundle_items(quantity,products(price,stock,is_published,status))").in("id", bundleIds) : Promise.resolve({ data: [], error: null })
    ]);
    if (productResult.error || bundleResult.error) throw new Error("No se pudo actualizar precio y existencias desde Supabase.");
    const products = new Map((productResult.data || []).map((p) => [p.id, p]));
    const bundles = new Map((bundleResult.data || []).map((b) => [b.id, b]));
    const updated = cart.map((item) => {
      if (item.kind !== "bundle") {
        const product = products.get(item.id);
        if (!product || !product.is_published || product.status !== "active") throw new Error('El producto "' + item.name + '" ya no está disponible.');
        if (Number(product.stock) < item.quantity) throw new Error('Quedan ' + product.stock + ' unidad(es) de "' + product.name + '". Ajusta la cantidad.');
        return Object.assign({}, item, { name: product.name, price: Number(product.price), compare_at_price: Number(product.compare_at_price) || null, stock: Number(product.stock), available_stock: Number(product.stock), image: product.image_url || item.image });
      }
      const bundle = bundles.get(item.id);
      if (!bundle || !bundle.is_published || bundle.status !== "active" || (bundle.starts_at && new Date(bundle.starts_at).getTime() > Date.now()) || (bundle.ends_at && new Date(bundle.ends_at).getTime() <= Date.now())) {
        throw new Error('El combo "' + item.name + '" ya no está publicado.');
      }
      const entries = bundle.bundle_items || [];
      const available = entries.length ? Math.min(Number(bundle.stock), ...entries.map((entry) => {
        const product = entry.products;
        return product && product.is_published && product.status === "active" ? Math.floor(Number(product.stock) / Number(entry.quantity)) : 0;
      })) : 0;
      if (available < item.quantity) throw new Error('El combo "' + bundle.name + '" no tiene suficientes existencias.');
      const original = entries.reduce((sum, entry) => sum + Number(entry.products && entry.products.price || 0) * Number(entry.quantity), 0);
      return Object.assign({}, item, { name: bundle.name, price: Number(bundle.price), compare_at_price: original, stock: available, available_stock: available, image: bundle.image_url || item.image });
    });
    return updated;
  }
  async function checkout(form, dialog) {
    const method = document.querySelector("#confirmOrderBtn").dataset.method;
    if (method === "whatsapp") {
      const config = window.DP_PAYMENT_CONFIG || {};
      const cart = get(), address = addressFrom(form), amount = totals(cart);
      const lines = cart.map((x) => x.name + " x" + x.quantity + " — " + money(x.price * x.quantity)).join("\n");
      const message = "Hola, deseo coordinar una compra con D'Paniagua Technology.\n" + lines + "\nTotal de artículos: " + money(amount.total) + "\nEntrega: " +
        address.street + " " + address.house_number + ", " + address.sector + ", " + address.municipality + ", " + address.province + "\n" + address.phone + " · " + address.full_name;
      window.open("https://wa.me/" + (config.whatsappNumber || "18296726146") + "?text=" + encodeURIComponent(message), "_blank", "noopener");
      dialog.close();
      return;
    }
    if (method !== "cash_on_delivery") {
      dialog.close();
      return window.DP.toast("Este método no está conectado a una pasarela real. No se realizó ningún pago ni se creó pedido.");
    }
    const db = window.DP.db;
    if (!db) return window.DP.toast("Conecta Supabase para registrar el pedido.");
    const auth = await db.auth.getUser(), user = auth.data && auth.data.user;
    if (auth.error || !user) { location.href = "login.html?next=carrito.html"; return; }
    const cart = get(), address = addressFrom(form);
    const lines = cart.map((item) => ({
      product_id: item.kind === "bundle" ? null : item.id,
      bundle_id: item.kind === "bundle" ? item.id : null,
      quantity: Number(item.quantity)
    }));
    const button = document.querySelector("#confirmOrderBtn"), oldText = button.textContent;
    button.disabled = true; button.textContent = "Validando existencias…";
    try {
      const result = await db.rpc("create_order_with_inventory", { p_lines: lines, p_delivery_address: address });
      if (result.error) throw result.error;
      const orderId = result.data;
      const saved = await db.from("orders").select("total,payment_status,status").eq("id", orderId).single();
      if (saved.error) throw saved.error;
      localStorage.removeItem(storageKey); render(); window.DP.updateCount && window.DP.updateCount();
      dialog.close();
      const success = document.querySelector("#checkoutResult");
      success.classList.remove("hidden"); success.classList.add("success");
      success.innerHTML = "Pedido <strong>#" + esc(String(orderId).slice(0, 8)) + "</strong> registrado por " + money(saved.data.total) + ". Estado del pedido: <strong>Pendiente</strong>. Pago: <strong>Pendiente de validación</strong>.";
      button.disabled = true; button.textContent = "Pedido registrado";
    } catch (error) {
      window.DP.toast("No se pudo crear el pedido: " + error.message);
      button.disabled = false; button.textContent = oldText;
    }
  }
})();
