(() => {
  const db = window.DP && window.DP.db;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
  const money = (value) => window.DP.money(Number(value) || 0);
  const toast = (message) => window.DP.toast(message);
  const statuses = { pending: "Pendiente", confirmed: "Confirmado", processing: "Preparando", shipped: "En camino", completed: "Entregado", cancelled: "Cancelado" };
  const payStatuses = { pending: "Pendiente", confirmed: "Confirmado", rejected: "Rechazado", refunded: "Reembolsado" };
  const methods = { cash_on_delivery: "Contra entrega", paypal: "PayPal", card: "Tarjeta", whatsapp: "WhatsApp" };
  function calculateOfferPricing(baseValue, discountValue) {
    const baseText = String(baseValue == null ? "" : baseValue).trim();
    const discountText = String(discountValue == null ? "" : discountValue).trim();
    const basePrice = Number(baseText);
    const discountPercent = discountText ? Number(discountText) : 0;
    if (!baseText || !Number.isFinite(basePrice) || basePrice < 0) {
      throw new RangeError("El precio base debe ser un número igual o mayor que cero.");
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw new RangeError("El descuento debe estar entre 0% y 100%.");
    }

    const baseCents = Math.round(basePrice * 100);
    const priceCents = Math.round(baseCents * (100 - discountPercent) / 100);
    const hasOffer = discountPercent > 0 && baseCents > 0 && priceCents < baseCents;
    return {
      price: priceCents / 100,
      compare_at_price: hasOffer ? baseCents / 100 : null,
      discount_percent: discountPercent,
      savings: hasOffer ? (baseCents - priceCents) / 100 : 0
    };
  }
  function getOfferFormValues(product) {
    const price = Number(product && product.price);
    const compareAtPrice = Number(product && product.compare_at_price);
    const hasOffer = Number.isFinite(compareAtPrice) && compareAtPrice > price;
    const basePrice = hasOffer ? compareAtPrice : price;
    const discountPercent = hasOffer && basePrice > 0
      ? Number(((basePrice - price) / basePrice * 100).toFixed(12))
      : 0;
    return { basePrice, discountPercent };
  }
  if (window.DP) window.DP.calculateOfferPricing = calculateOfferPricing;
  if (window.DP) window.DP.getOfferFormValues = getOfferFormValues;
  async function getEdgeFunctionErrorMessage(result) {
    const response = result && result.error && result.error.context;
    if (response && typeof response.clone === "function") {
      try {
        const body = await response.clone().json();
        const message = body && (body.error || body.message);
        if (typeof message === "string" && message.trim()) return message.trim();
      } catch (_) {}
      try {
        const text = await response.clone().text();
        if (text.trim()) return text.trim();
      } catch (_) {}
    }
    const backendMessage = result && result.data && result.data.error;
    if (typeof backendMessage === "string" && backendMessage.trim()) return backendMessage.trim();
    const fallback = result && result.error && result.error.message;
    const status = response && response.status;
    return status ? "HTTP " + status + ": " + (fallback || "La función respondió con un error.") : fallback || "La función respondió con un error.";
  }
  if (window.DP) window.DP.getEdgeFunctionErrorMessage = getEdgeFunctionErrorMessage;
  const statusBadge = (value, map) => '<span class="status-badge status-' + esc(value) + '">' + esc(map[value] || value || "—") + '</span>';
  const dateText = (value) => value ? new Date(value).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" }) : "—";
  const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  async function allRows(build) {
    const rows = [];
    for (let start = 0; start < 100000; start += 1000) {
      const result = await build().range(start, start + 999);
      if (result.error) throw result.error;
      rows.push.apply(rows, result.data || []);
      if (!result.data || result.data.length < 1000) break;
    }
    return rows;
  }

  async function boot() {
    const notice = $("#adminNotice");
    if (!db) { if (notice) notice.textContent = "Conecta Supabase para acceder al panel."; return; }
    const auth = await db.auth.getUser();
    const user = auth.data && auth.data.user;
    if (auth.error || !user) { location.href = "../login.html?next=" + encodeURIComponent(location.pathname.replace(/^\//, "")); return; }
    const profileResult = await db.from("profiles").select("role,is_active").eq("id", user.id).single();
    if (profileResult.error || !profileResult.data || profileResult.data.role !== "admin" || profileResult.data.is_active === false) {
      if (notice) notice.textContent = "Acceso denegado: se requiere una cuenta administradora activa.";
      return;
    }
    document.querySelectorAll("[data-admin-content]").forEach((node) => node.classList.remove("hidden"));
    if (notice) notice.classList.add("hidden");
    const nav = $(".admin-side nav");
    if (nav && !nav.querySelector('a[href="combos.html"]')) {
      const link = document.createElement("a"); link.href = "combos.html"; link.textContent = "✦ Ofertas y combos"; nav.insertBefore(link, nav.querySelector('a[href="../index.html"]'));
    }
    const page = document.body.dataset.adminPage;
    const tasks = { dashboard: dashboardPage, products: productsPage, orders: ordersPage, users: usersPage, reviews: reviewsPage, bundles: bundlesPage };
    if (tasks[page]) await tasks[page]();
  }

  async function dashboardPage() {
    const [orders, products, profiles, bundles, reviews, activityOrders, activityProducts, activityProfiles, inventory, history] = await Promise.all([
      allRows(() => db.from("orders").select("id,user_id,total,status,payment_status,created_at").order("created_at", { ascending: false })),
      allRows(() => db.from("products").select("id,name,stock,is_published,created_at").order("created_at", { ascending: false })),
      allRows(() => db.from("profiles").select("id,full_name,created_at").order("created_at", { ascending: false })),
      allRows(() => db.from("bundles").select("id,name,is_published,status")),
      db.from("reviews").select("id", { count: "exact", head: true }),
      allRows(() => db.from("orders").select("id,total,status,payment_status,created_at").order("created_at", { ascending: false }).limit(6)),
      allRows(() => db.from("products").select("id,name,created_at").order("created_at", { ascending: false }).limit(6)),
      allRows(() => db.from("profiles").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(6)),
      allRows(() => db.from("inventory_history").select("id,product_id,old_stock,new_stock,created_at,products(name)").order("created_at", { ascending: false }).limit(6)),
      allRows(() => db.from("order_history").select("id,order_id,change_type,created_at").order("created_at", { ascending: false }).limit(6))
    ]);
    if (reviews.error) throw reviews.error;
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const paid = orders.filter((o) => o.payment_status === "confirmed" && o.status !== "cancelled");
    const sum = (rows) => rows.reduce((n, o) => n + Number(o.total || 0), 0);
    $("#stat-sales").textContent = money(sum(paid));
    $("#stat-today").textContent = money(sum(paid.filter((o) => new Date(o.created_at) >= startToday)));
    $("#stat-month").textContent = money(sum(paid.filter((o) => new Date(o.created_at) >= startMonth)));
    $("#stat-orders").textContent = orders.length;
    $("#stat-pending").textContent = orders.filter((o) => o.status === "pending").length;
    $("#stat-completed").textContent = orders.filter((o) => o.status === "completed").length;
    $("#stat-products").textContent = products.length;
    $("#stat-low-stock").textContent = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    $("#stat-out-stock").textContent = products.filter((p) => p.stock <= 0).length;
    $("#stat-users").textContent = profiles.length;
    $("#stat-bundles").textContent = bundles.filter((b) => b.is_published && b.status === "active").length;
    $("#stat-reviews").textContent = reviews.count == null ? "—" : reviews.count;
    const currentIncome = sum(paid.filter((o) => new Date(o.created_at) >= startMonth));
    const previousIncome = sum(paid.filter((o) => {
      const date = new Date(o.created_at);
      return date >= startPreviousMonth && date < startMonth;
    }));
    $("#incomeComparison").textContent = previousIncome
      ? "Mes actual: " + money(currentIncome) + " · " + ((currentIncome - previousIncome) / previousIncome >= 0 ? "+" : "") +
        (((currentIncome - previousIncome) / previousIncome) * 100).toFixed(1) + "% frente al mes anterior (" + money(previousIncome) + ")."
      : "Mes actual: " + money(currentIncome) + " · no hay ingresos confirmados el mes anterior para comparar.";

    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = dateKey(day);
      daily.push({ label: day.toLocaleDateString("es-DO", { weekday: "short" }), value: sum(paid.filter((o) => dateKey(new Date(o.created_at)) === key)) });
    }
    renderBars($("#dailyChart"), daily);
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({
        label: month.toLocaleDateString("es-DO", { month: "short" }),
        value: sum(paid.filter((o) => { const d = new Date(o.created_at); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }))
      });
    }
    renderBars($("#monthlyChart"), monthly);

    const itemRows = await allRows(() => db.from("order_items").select("quantity,product_id,bundle_id,products(name,categories(name)),bundles(name,category),orders!inner(status,payment_status)"));
    const sold = new Map();
    const categorySales = new Map();
    itemRows.filter((it) => it.orders && it.orders.status !== "cancelled" && it.orders.payment_status === "confirmed").forEach((it) => {
      const name = it.products && it.products.name || it.bundles && it.bundles.name || "Artículo";
      sold.set(name, (sold.get(name) || 0) + Number(it.quantity || 0));
      const category = it.products && it.products.categories && it.products.categories.name || it.bundles && it.bundles.category || "Sin categoría";
      categorySales.set(category, (categorySales.get(category) || 0) + Number(it.quantity || 0));
    });
    const top = Array.from(sold.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $("#topProducts").innerHTML = top.length ? top.map((x) => '<div class="admin-list-row"><span>' + esc(x[0]) + '</span><strong>' + x[1] + ' vendido(s)</strong></div>').join("") : '<p class="muted">Aún no hay ventas confirmadas.</p>';
    const topCategories = Array.from(categorySales.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    $("#topCategories").innerHTML = topCategories.length ? topCategories.map((x) => '<div class="admin-list-row"><span>' + esc(x[0]) + '</span><strong>' + x[1] + ' unidad(es)</strong></div>').join("") : '<p class="muted">Aún no hay ventas confirmadas.</p>';

    const events = [];
    activityOrders.forEach((x) => events.push({ at: x.created_at, text: "Pedido " + x.id.slice(0, 8) + " · " + (statuses[x.status] || x.status) }));
    activityProfiles.forEach((x) => events.push({ at: x.created_at, text: "Nuevo usuario · " + (x.full_name || "Cliente") }));
    activityProducts.forEach((x) => events.push({ at: x.created_at, text: "Producto agregado · " + x.name }));
    inventory.forEach((x) => events.push({ at: x.created_at, text: "Inventario · " + (x.products && x.products.name || "Producto") + " (" + x.old_stock + " → " + x.new_stock + ")" }));
    history.forEach((x) => events.push({ at: x.created_at, text: "Cambio administrativo · pedido " + x.order_id.slice(0, 8) }));
    events.sort((a, b) => new Date(b.at) - new Date(a.at));
    $("#recentActivity").innerHTML = events.length ? events.slice(0, 12).map((x) => '<div class="admin-list-row"><span>' + esc(x.text) + '</span><time>' + esc(dateText(x.at)) + '</time></div>').join("") : '<p class="muted">No hay actividad registrada.</p>';
  }

  function renderBars(host, points) {
    const max = Math.max(1, ...points.map((x) => x.value));
    host.innerHTML = points.map((x) => '<div class="chart-bar-wrap"><div class="chart-bar-value">' + esc(money(x.value)) + '</div><div class="chart-bar" style="height:' + (x.value ? Math.max(7, x.value / max * 100) : 2) + '%" title="' + esc(money(x.value)) + '"></div><span>' + esc(x.label) + '</span></div>').join("");
  }

  async function productsPage() {
    const host = $("#adminTable"), categorySelect = $("#productCategory"), editForm = $("#productEditForm"), dialog = $("#productEditor");
    const categoryResult = await db.from("categories").select("id,name").order("name");
    if (categoryResult.error) throw categoryResult.error;
    const categories = categoryResult.data || [];
    const categoryOptions = '<option value="">Selecciona categoría</option>' + categories.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join("");
    categorySelect.innerHTML = categoryOptions;
    editForm.elements.category_id.innerHTML = categoryOptions;
    const create = $("#productCreate");
    function updateOfferPreview(form) {
      const preview = form.querySelector("[data-offer-preview]");
      if (!preview) return;
      try {
        const offer = calculateOfferPricing(form.elements.base_price.value, form.elements.discount_percent.value);
        preview.textContent = offer.discount_percent > 0 && offer.compare_at_price !== null
          ? "Precio de oferta: " + money(offer.price) + " · Precio base: " + money(offer.compare_at_price) + " · Ahorras " + money(offer.savings) + " (" + offer.discount_percent + "%)"
          : "Precio final: " + money(offer.price) + " · Sin descuento";
      } catch (error) {
        preview.textContent = error.message;
      }
    }
    [create, editForm].forEach((form) => {
      form.elements.base_price.addEventListener("input", () => updateOfferPreview(form));
      form.elements.discount_percent.addEventListener("input", () => updateOfferPreview(form));
      updateOfferPreview(form);
    });
    async function load() {
      const products = await allRows(() => db.from("products").select("*").order("created_at", { ascending: false }));
      const query = ($("#productSearch").value || "").trim().toLowerCase();
      const shown = products.filter((p) => (p.name + " " + (p.brand || "")).toLowerCase().includes(query));
      host.innerHTML = shown.length ? '<div class="table-wrap"><table class="admin-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Inventario</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + shown.map((p) => {
        const category = categories.find((c) => c.id === p.category_id);
        const stockStatus = p.stock === 0
          ? '<span class="status-badge status-cancelled">Agotado</span>'
          : p.stock <= 5
            ? '<span class="status-badge status-pending">Bajo</span>'
            : "";
        const publicationStatus = statusBadge(
          p.status || (p.is_published ? "active" : "inactive"),
          { active: p.is_published ? "Publicado" : "No publicado", inactive: "Inactivo", archived: "Archivado" }
        );

        return `
          <tr>
            <td>
              <div class="table-product">
                <img src="${esc(p.image_url || "")}" alt="">
                <span>
                  <strong>${esc(p.name)}</strong>
                  <small>${esc(p.brand || "Sin marca")}</small>
                </span>
              </div>
            </td>
            <td>${esc(category && category.name || "—")}</td>
            <td>
              ${money(p.price)}
              ${p.compare_at_price ? `<small class="muted table-sub">${money(p.compare_at_price)}</small>` : ""}
            </td>
            <td>${p.stock} ${stockStatus}</td>
            <td>${publicationStatus}</td>
            <td>
              <div class="table-actions">
                <button class="btn-outline btn-small" data-edit="${esc(p.id)}">Editar</button>
                <button class="btn-outline btn-small danger" data-delete="${esc(p.id)}">Eliminar</button>
              </div>
            </td>
          </tr>
        `;
      }).join("") + '</tbody></table></div>' : '<div class="empty">No hay productos que coincidan con la búsqueda.</div>';
      host.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => {
        const p = products.find((x) => x.id === button.dataset.edit);
        editForm.reset();
        editForm.elements.id.value = p.id;
        ["name", "brand", "category_id", "stock", "image_url", "offer_label", "description", "status"].forEach((key) => { editForm.elements[key].value = p[key] == null ? "" : p[key]; });
        const offerFields = getOfferFormValues(p);
        editForm.elements.base_price.value = offerFields.basePrice;
        editForm.elements.discount_percent.value = offerFields.discountPercent;
        editForm.elements.image_urls.value = (p.image_urls || []).join("\n");
        editForm.elements.features_text.value = (p.features || []).join("\n");
        editForm.elements.is_published.checked = !!p.is_published;
        updateOfferPreview(editForm);
        dialog.showModal();
      }));
      host.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
        const p = products.find((x) => x.id === button.dataset.delete);
        if (!confirm('¿Eliminar "' + p.name + '"? Si ya aparece en pedidos, la base de datos lo conservará para proteger el historial.')) return;
        const result = await db.from("products").delete().eq("id", p.id);
        if (result.error) { toast("No se pudo eliminar: " + result.error.message); return; }
        toast("Producto eliminado."); await load();
      }));
    }
    const productPayload = (form) => {
      const fd = new FormData(form);
      const offer = calculateOfferPricing(fd.get("base_price"), fd.get("discount_percent"));
      const url = String(fd.get("image_url") || "").trim();
      try { if (new URL(url).protocol !== "https:") throw new Error(); } catch (_) { throw new Error("Usa una URL segura de imagen que comience por https://."); }
      const extra = String(fd.get("image_urls") || "").split(/\n/).map((x) => x.trim()).filter(Boolean);
      if (extra.some((x) => { try { return new URL(x).protocol !== "https:"; } catch (_) { return true; } })) throw new Error("Cada imagen adicional debe ser una URL HTTPS válida.");
      const payload = {
        name: String(fd.get("name") || "").trim(), brand: String(fd.get("brand") || "").trim() || null,
        category_id: String(fd.get("category_id") || ""), price: offer.price,
        compare_at_price: offer.compare_at_price, stock: Number(fd.get("stock")),
        image_url: url, image_urls: extra, offer_label: String(fd.get("offer_label") || "").trim() || null,
        description: String(fd.get("description") || "").trim(),
        features: String(fd.get("features_text") || "").split(/\n|,/).map((x) => x.trim()).filter(Boolean),
        status: String(fd.get("status") || "active"), is_published: fd.get("is_published") === "on"
      };
      if (!payload.name || !payload.category_id || !payload.description || !Number.isFinite(payload.price) || payload.price < 0 ||
        !Number.isInteger(payload.stock) || payload.stock < 0 || (payload.compare_at_price != null && payload.compare_at_price < payload.price)) {
        throw new Error("Revisa nombre, categoría, descripción, precios e inventario.");
      }
      return payload;
    };
    create.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const button = create.querySelector('[type="submit"]'); button.disabled = true;
        const result = await db.from("products").insert(productPayload(create));
        button.disabled = false;
        if (result.error) throw result.error;
        create.reset(); create.elements.is_published.checked = true; create.elements.status.value = "active"; updateOfferPreview(create);
        toast("Producto creado correctamente."); await load();
      } catch (error) { toast("No se pudo guardar: " + error.message); }
    });
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const payload = productPayload(editForm), id = editForm.elements.id.value;
        const result = await db.from("products").update(Object.assign(payload, { updated_at: new Date().toISOString() })).eq("id", id);
        if (result.error) throw result.error;
        dialog.close(); toast("Producto actualizado."); await load();
      } catch (error) { toast("No se pudo guardar: " + error.message); }
    });
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    $("#productSearch").addEventListener("input", load);
    await load();
  }

  async function ordersPage() {
    const host = $("#adminTable"), dialog = $("#orderEditor");
    let orders = [], profiles = [], items = [], selectable = [];
    async function load() {
      [orders, profiles, items] = await Promise.all([
        allRows(() => db.from("orders").select("*").order("created_at", { ascending: false })),
        allRows(() => db.from("profiles").select("id,full_name,phone")),
        allRows(() => db.from("order_items").select("id,order_id,product_id,bundle_id,quantity,unit_price,components,products(name),bundles(name)"))
      ]);
      const userResult = await db.functions.invoke("admin-users", { body: { action: "list" } });
      const users = userResult.error ? [] : (userResult.data && userResult.data.users || []);
      const userMap = new Map(users.map((u) => [u.id, u]));
      const productResult = await allRows(() => db.from("products").select("id,name,price,is_published,status").order("name"));
      const bundleResult = await allRows(() => db.from("bundles").select("id,name,price,is_published,status").order("name"));
      selectable = productResult.filter((p) => p.is_published && p.status === "active").map((p) => ({ key: "p:" + p.id, label: p.name, price: p.price }))
        .concat(bundleResult.filter((b) => b.is_published && b.status === "active").map((b) => ({ key: "b:" + b.id, label: b.name + " (combo)", price: b.price })));
      render(userMap);
    }
    function render(userMap) {
      const search = ($("#orderSearch").value || "").trim().toLowerCase();
      const state = $("#orderStatusFilter").value, paymentState = $("#paymentStatusFilter").value;
      const from = $("#orderFrom").value ? new Date($("#orderFrom").value + "T00:00:00").getTime() : -Infinity;
      const to = $("#orderTo").value ? new Date($("#orderTo").value + "T23:59:59").getTime() : Infinity;
      const shown = orders.filter((o) => {
        const profile = profiles.find((p) => p.id === o.user_id) || {}, user = userMap.get(o.user_id) || {};
        const address = o.delivery_address || {};
        const query = [o.id, address.full_name, address.phone, profile.full_name, profile.phone, user.email].join(" ").toLowerCase();
        const time = new Date(o.created_at).getTime();
        return (!search || query.includes(search)) && (!state || o.status === state) && (!paymentState || o.payment_status === paymentState) && time >= from && time <= to;
      });
      host.innerHTML = shown.length ? `
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Pedido / fecha</th>
                <th>Cliente / teléfono</th>
                <th>Productos</th>
                <th>Dirección de entrega</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${shown.map((o) => {
        const p = profiles.find((x) => x.id === o.user_id) || {}, u = userMap.get(o.user_id) || {};
        const address = o.delivery_address || {};
        const lines = items.filter((x) => x.order_id === o.id);
        const purchasedItems = lines.map((item) => {
          const name = item.products?.name || item.bundles?.name || "Artículo";
          return `${esc(name)} × ${item.quantity}`;
        }).join("<br>");
        const deliveryAddress = [
          address.street,
          address.house_number,
          address.sector,
          address.municipality,
          address.province
        ].filter(Boolean).join(", ");

        return `
          <tr>
            <td>
              <strong>#${esc(o.id.slice(0, 8))}</strong>
              <small class="table-sub">${esc(dateText(o.created_at))}</small>
            </td>
            <td>
              ${esc(address.full_name || p.full_name || "Cliente")}
              <small class="table-sub">${esc(address.phone || p.phone || u.email || "Sin teléfono")}</small>
            </td>
            <td>${purchasedItems}</td>
            <td>
              ${esc(deliveryAddress || "Sin dirección")}
              ${address.reference ? `<small class="table-sub">Ref.: ${esc(address.reference)}</small>` : ""}
            </td>
            <td>${money(o.total)}</td>
            <td>
              ${statusBadge(o.payment_status || "pending", payStatuses)}
              <small class="table-sub">${esc(methods[o.payment_method] || "—")}</small>
            </td>
            <td>${statusBadge(o.status, statuses)}</td>
            <td><button class="btn-outline btn-small" data-order="${esc(o.id)}">Ver / editar</button></td>
          </tr>
        `;
              }).join("")}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty">No hay pedidos para esos filtros.</div>';
      host.querySelectorAll("[data-order]").forEach((button) => button.addEventListener("click", () => openOrder(orders.find((o) => o.id === button.dataset.order))));
    }
    async function openOrder(order) {
      const currentItems = items.filter((x) => x.order_id === order.id);
      const address = order.delivery_address || {};
      const itemControls = currentItems.map((it) => {
        const key = it.product_id ? "p:" + it.product_id : "b:" + it.bundle_id;
        return itemRow(key, it.quantity, order.status === "pending" && !order.inventory_released);
      }).join("");
      const canEditItems = order.status === "pending" && !order.inventory_released;
      dialog.innerHTML = `
        <form id="orderEditForm">
          <div class="admin-dialog-head">
            <div>
              <span class="eyebrow">Pedido #${esc(order.id.slice(0, 8))}</span>
              <h2>Detalle del pedido</h2>
            </div>
            <button type="button" class="icon-btn" data-close>×</button>
          </div>
          <p class="muted">Creado ${esc(dateText(order.created_at))} · Total actual ${money(order.total)}</p>
          <div class="admin-form-grid">
            ${selectField("Estado del pedido", "status", Object.entries(statuses), order.status)}
            ${selectField("Estado del pago", "payment_status", Object.entries(payStatuses), order.payment_status || "pending")}
            ${selectField("Método de pago", "payment_method", Object.entries(methods), order.payment_method || "cash_on_delivery")}
            <label class="field">
              <span>Nombre completo</span>
              <input name="full_name" required value="${esc(address.full_name || "")}">
            </label>
            <label class="field">
              <span>Teléfono</span>
              <input name="phone" required value="${esc(address.phone || "")}">
            </label>
            <label class="field">
              <span>Correo</span>
              <input name="email" type="email" required value="${esc(address.email || "")}">
            </label>
            <label class="field">
              <span>Provincia</span>
              <input name="province" required value="${esc(address.province || "")}">
            </label>
            <label class="field">
              <span>Municipio</span>
              <input name="municipality" required value="${esc(address.municipality || "")}">
            </label>
            <label class="field">
              <span>Sector</span>
              <input name="sector" required value="${esc(address.sector || "")}">
            </label>
            <label class="field">
              <span>Calle</span>
              <input name="street" required value="${esc(address.street || "")}">
            </label>
            <label class="field">
              <span>Casa / apartamento</span>
              <input name="house_number" required value="${esc(address.house_number || "")}">
            </label>
            <label class="field">
              <span>Referencia</span>
              <input name="reference" required value="${esc(address.reference || "")}">
            </label>
            <label class="field field-wide">
              <span>Instrucciones</span>
              <textarea name="instructions" rows="2">${esc(address.instructions || "")}</textarea>
            </label>
            <div class="field field-wide">
              <div class="admin-section-head">
                <span class="field-label">Productos y cantidades</span>
                <button type="button" class="btn-outline btn-small" id="addOrderLine" ${canEditItems ? "" : "disabled"}>
                  ＋ Añadir
                </button>
              </div>
              <div id="orderLines">${itemControls}</div>
              <p class="small muted">Solo se pueden cambiar mientras el pedido está pendiente y mantiene el inventario reservado.</p>
            </div>
            <div class="field field-wide">
              <h3>Historial de cambios</h3>
              <div id="orderHistory" class="admin-list">Cargando historial…</div>
            </div>
            <div class="field-wide dialog-actions">
              <button type="button" class="btn-outline" data-close>Volver</button>
              <button type="submit" class="primary">Guardar cambios</button>
            </div>
          </div>
        </form>
      `;
      dialog.showModal();
      dialog.querySelectorAll("[data-close]").forEach((b) => b.onclick = () => dialog.close());
      const lines = $("#orderLines", dialog);
      const changed = () => { lines.dataset.changed = "true"; };
      lines.querySelectorAll("select,input").forEach((n) => n.addEventListener("change", changed));
      $("#addOrderLine", dialog).addEventListener("click", () => { lines.insertAdjacentHTML("beforeend", itemRow("", 1, true)); lines.lastElementChild.querySelectorAll("select,input,button").forEach((n) => n.addEventListener(n.tagName === "BUTTON" ? "click" : "change", n.tagName === "BUTTON" ? () => { n.closest(".order-line-row").remove(); changed(); } : changed)); changed(); });
      lines.querySelectorAll("[data-remove-line]").forEach((b) => b.addEventListener("click", () => { b.closest(".order-line-row").remove(); changed(); }));
      const history = await db.from("order_history").select("change_type,changes,created_at,changed_by").eq("order_id", order.id).order("created_at", { ascending: false });
      $("#orderHistory", dialog).innerHTML = history.error ? '<span class="muted">No se pudo consultar el historial.</span>' :
        (history.data || []).length ? history.data.map((h) => {
          const actor = profiles.find((p) => p.id === h.changed_by);
          return '<div class="admin-list-row"><span>' + esc(h.change_type.replace("_", " ")) + ' · ' + esc(actor && actor.full_name || (h.changed_by ? h.changed_by.slice(0, 8) : "Sistema")) + '<small class="table-sub">' + esc(JSON.stringify(h.changes)) + '</small></span><time>' + esc(dateText(h.created_at)) + '</time></div>';
        }).join("") : '<span class="muted">Sin cambios registrados.</span>';
      $("#orderEditForm", dialog).addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget, fd = new FormData(form), addressFields = ["full_name", "phone", "email", "province", "municipality", "sector", "street", "house_number", "reference", "instructions"];
        const addressValue = {}; addressFields.forEach((key) => { addressValue[key] = String(fd.get(key) || "").trim(); });
        if (addressFields.slice(0, 9).some((key) => !addressValue[key])) { toast("Completa todos los campos obligatorios de la dirección."); return; }
        const args = { p_order_id: order.id, p_status: fd.get("status"), p_delivery_address: addressValue, p_payment_method: fd.get("payment_method"), p_payment_status: fd.get("payment_status"), p_items: null };
        if (lines.dataset.changed === "true") {
          args.p_items = Array.from(lines.querySelectorAll(".order-line-row")).map((row) => {
            const value = row.querySelector("[data-line-product]").value.split(":");
            return { product_id: value[0] === "p" ? value[1] : null, bundle_id: value[0] === "b" ? value[1] : null, quantity: Number(row.querySelector("[data-line-quantity]").value) };
          });
          if (!args.p_items.length || args.p_items.some((x) => (!x.product_id && !x.bundle_id) || !Number.isInteger(x.quantity) || x.quantity < 1)) { toast("Revisa productos y cantidades del pedido."); return; }
        }
        if (args.p_status === "cancelled" && !confirm("¿Cancelar el pedido? El inventario reservado se devolverá una sola vez.")) return;
        const button = form.querySelector('[type="submit"]'); button.disabled = true;
        const result = await db.rpc("admin_update_order", args); button.disabled = false;
        if (result.error) { toast("No se guardaron los cambios: " + result.error.message); return; }
        dialog.close(); toast("Pedido actualizado y cambio registrado."); await load();
      });
    }
    function selectField(label, name, options, selected) {
      return '<label class="field"><span>' + esc(label) + '</span><select name="' + name + '">' + options.map((o) => '<option value="' + esc(o[0]) + '" ' + (o[0] === selected ? "selected" : "") + '>' + esc(o[1]) + '</option>').join("") + '</select></label>';
    }
    function itemRow(key, quantity, enabled) {
      return '<div class="order-line-row"><select data-line-product ' + (enabled ? "" : "disabled") + '><option value="">Selecciona artículo</option>' + selectable.map((x) => '<option value="' + esc(x.key) + '" ' + (x.key === key ? "selected" : "") + '>' + esc(x.label) + ' · ' + money(x.price) + '</option>').join("") + '</select><input data-line-quantity type="number" min="1" step="1" value="' + Number(quantity || 1) + '" ' + (enabled ? "" : "disabled") + '><button type="button" class="btn-outline btn-small danger" data-remove-line ' + (enabled ? "" : "disabled") + '>Quitar</button></div>';
    }
    ["orderSearch", "orderFrom", "orderTo", "orderStatusFilter", "paymentStatusFilter"].forEach((id) => $("#" + id).addEventListener(id === "orderSearch" ? "input" : "change", () => load().catch((e) => toast("No se pudo actualizar la tabla: " + e.message))));
    await load();
  }

  async function usersPage() {
    const host = $("#adminTable"), dialog = $("#userEditor");
    const result = await db.functions.invoke("admin-users", { body: { action: "list" } });
    if (result.error || !result.data || result.data.error) {
      const errorMessage = await getEdgeFunctionErrorMessage(result);
      host.innerHTML = '<div class="notice">No se pudieron cargar las cuentas de Auth. Respuesta de <code>admin-users</code>: ' + esc(errorMessage) + '</div>';
      return;
    }
    const users = result.data.users || [];
    function render() {
      const q = ($("#userSearch").value || "").trim().toLowerCase(), role = $("#userRoleFilter").value, active = $("#userStateFilter").value;
      const shown = users.filter((u) => (!q || [u.full_name, u.email, u.phone].join(" ").toLowerCase().includes(q)) && (!role || u.role === role) && (!active || String(u.is_active) === active));
      host.innerHTML = shown.length ? `
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Pedidos</th>
                <th>Compras confirmadas</th>
                <th>Estado / rol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${shown.map((user) => `
                <tr>
                  <td>
                    <strong>${esc(user.full_name || "Sin nombre")}</strong>
                    <small class="table-sub">${esc(user.email)}</small>
                  </td>
                  <td>${esc(user.phone || "—")}</td>
                  <td>${esc(dateText(user.created_at))}</td>
                  <td>${Number(user.order_count || 0)}</td>
                  <td>${money(user.purchase_total)}</td>
                  <td>
                    ${statusBadge(user.is_active ? "active" : "inactive", { active: "Activo", inactive: "Desactivado" })}
                    <small class="table-sub">${user.role === "admin" ? "Administrador" : "Cliente"}</small>
                  </td>
                  <td><button class="btn-outline btn-small" data-user="${esc(user.id)}">Ver / editar</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty">No hay usuarios para esos filtros.</div>';
      host.querySelectorAll("[data-user]").forEach((b) => b.onclick = () => editUser(users.find((u) => u.id === b.dataset.user)));
    }
    function editUser(user) {
      dialog.innerHTML = `
        <form id="userEditForm">
          <div class="admin-dialog-head">
            <div>
              <span class="eyebrow">Cuenta</span>
              <h2>Editar usuario</h2>
            </div>
            <button type="button" class="icon-btn" data-close>×</button>
          </div>
          <p class="muted">${esc(user.email)}</p>
          <div class="admin-form-grid">
            <label class="field field-wide">
              <span>Nombre completo</span>
              <input name="full_name" required maxlength="120" value="${esc(user.full_name)}">
            </label>
            <label class="field">
              <span>Teléfono</span>
              <input name="phone" maxlength="40" value="${esc(user.phone)}">
            </label>
            <label class="field">
              <span>Rol</span>
              <select name="role">
                <option value="customer" ${user.role === "customer" ? "selected" : ""}>Cliente</option>
                <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administrador</option>
              </select>
            </label>
            <label class="check-field">
              <input type="checkbox" name="is_active" ${user.is_active ? "checked" : ""}>
              Cuenta activa
            </label>
            <p class="field-wide small muted">Las contraseñas nunca se leen ni se modifican desde este panel.</p>
            <div class="field-wide dialog-actions">
              <button type="button" class="btn-outline" data-close>Cancelar</button>
              <button type="submit" class="primary">Guardar</button>
            </div>
          </div>
        </form>
      `;
      dialog.showModal();
      dialog.querySelectorAll("[data-close]").forEach((b) => b.onclick = () => dialog.close());
      const historySection = document.createElement("section");
      historySection.className = "field-wide";
      historySection.innerHTML = '<h3>Historial de compras</h3><div id="userOrders" class="admin-list">Cargando pedidos…</div>';
      $("#userEditForm", dialog).querySelector(".admin-form-grid").append(historySection);
      db.from("orders").select("id,created_at,total,status,payment_status").eq("user_id", user.id).order("created_at", { ascending: false }).then((orderResult) => {
        const list = $("#userOrders", dialog);
        if (orderResult.error) { list.textContent = "No se pudo consultar el historial de compras."; return; }
        list.innerHTML = (orderResult.data || []).length ? orderResult.data.map((order) => `
          <div class="admin-list-row">
            <span>
              Pedido #${esc(order.id.slice(0, 8))} · ${esc(statuses[order.status] || order.status)}
              <small class="table-sub">Pago: ${esc(payStatuses[order.payment_status] || "Pendiente")}</small>
            </span>
            <time>${esc(dateText(order.created_at))}<br>${esc(money(order.total))}</time>
          </div>
        `).join("") : '<span class="muted">Este usuario aún no tiene pedidos.</span>';
      });
      $("#userEditForm", dialog).onsubmit = async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const updated = await db.functions.invoke("admin-users", { body: { action: "update", userId: user.id, fullName: fd.get("full_name"), phone: fd.get("phone"), role: fd.get("role"), isActive: fd.get("is_active") === "on" } });
        if (updated.error || updated.data && updated.data.error) { toast("No se pudo actualizar: " + (updated.data && updated.data.error || updated.error && updated.error.message)); return; }
        toast("Usuario actualizado."); dialog.close(); location.reload();
      };
    }
    ["userSearch", "userRoleFilter", "userStateFilter"].forEach((id) => $("#" + id).addEventListener(id === "userSearch" ? "input" : "change", render));
    await render();
  }

  async function bundlesPage() {
    const form = $("#bundleForm"), host = $("#adminTable"), itemHost = $("#bundleItemsEditor");
    let products = [], bundles = [];
    products = await allRows(() => db.from("products").select("id,name,price,stock,is_published").order("name"));
    function itemEditorRow(productId, quantity) {
      const options = products.map((product) => `
        <option value="${esc(product.id)}" ${product.id === productId ? "selected" : ""}>
          ${esc(product.name)} · ${money(product.price)} · stock ${product.stock}
        </option>
      `).join("");

      return `
        <div class="bundle-item-row">
          <select data-bundle-product required>
            <option value="">Producto</option>
            ${options}
          </select>
          <input data-bundle-quantity type="number" min="1" step="1" value="${Number(quantity || 1)}" required>
          <button type="button" class="btn-outline btn-small danger" data-remove-bundle-item>
            Quitar
          </button>
        </div>
      `;
    }
    function addItem(productId, quantity) {
      itemHost.insertAdjacentHTML("beforeend", itemEditorRow(productId || "", quantity || 1));
      itemHost.lastElementChild.querySelector("[data-remove-bundle-item]").onclick = (e) => e.currentTarget.closest(".bundle-item-row").remove();
    }
    function resetForm() {
      form.reset(); form.elements.id.value = ""; form.elements.stock.value = "0"; form.elements.is_published.checked = false;
      form.elements.status.value = "inactive"; itemHost.innerHTML = ""; $("#bundleFormTitle").textContent = "Crear combo"; addItem();
    }
    async function load() {
      bundles = await allRows(() => db.from("bundles").select("*,bundle_items(id,product_id,quantity,products(name,price,stock))").order("created_at", { ascending: false }));
      const q = ($("#bundleSearch").value || "").trim().toLowerCase();
      const shown = bundles.filter((b) => b.name.toLowerCase().includes(q));
      host.innerHTML = shown.length ? `
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Combo</th>
                <th>Incluye</th>
                <th>Precio original</th>
                <th>Precio combo</th>
                <th>Ahorro</th>
                <th>Stock / estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${shown.map((b) => {
        const original = (b.bundle_items || []).reduce((n, i) => n + Number(i.products && i.products.price || 0) * i.quantity, 0);
        const saving = Math.max(0, original - Number(b.price));
        const included = (b.bundle_items || []).map((item) => {
          return `${esc(item.products?.name || "Producto")} × ${item.quantity}`;
        }).join("<br>");
        const available = (b.bundle_items || []).length
          ? Math.min(
              Number(b.stock),
              ...b.bundle_items.map((item) => {
                return item.products
                  ? Math.floor(Number(item.products.stock) / Number(item.quantity))
                  : 0;
              })
            )
          : 0;
        const publication = b.status === "sold_out" || available <= 0
          ? "Agotado"
          : b.is_published && b.status === "active"
            ? "Publicado"
            : b.status === "inactive"
              ? "Inactivo"
              : "Borrador";

        return `
          <tr>
            <td>
              <strong>${esc(b.name)}</strong>
              <small class="table-sub">${esc(b.category)}</small>
            </td>
            <td>${included}</td>
            <td>${money(original)}</td>
            <td>${money(b.price)}</td>
            <td>
              ${money(saving)}
              ${original > 0 ? `<small class="table-sub">${Math.round(saving / original * 100)}%</small>` : ""}
            </td>
            <td>${available} · ${publication}</td>
            <td>
              <div class="table-actions">
                <button class="btn-outline btn-small" data-edit-bundle="${esc(b.id)}">Editar</button>
                <button class="btn-outline btn-small danger" data-delete-bundle="${esc(b.id)}">Eliminar</button>
              </div>
            </td>
          </tr>
        `;
              }).join("")}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty">No hay combos guardados.</div>';
      host.querySelectorAll("[data-edit-bundle]").forEach((b) => b.onclick = () => {
        const bundle = bundles.find((x) => x.id === b.dataset.editBundle);
        form.reset(); form.elements.id.value = bundle.id;
        ["name", "category", "description", "price", "stock", "image_url", "status"].forEach((key) => { form.elements[key].value = bundle[key] == null ? "" : bundle[key]; });
        form.elements.is_published.checked = !!bundle.is_published;
        form.elements.starts_at.value = bundle.starts_at ? new Date(bundle.starts_at).toISOString().slice(0, 16) : "";
        form.elements.ends_at.value = bundle.ends_at ? new Date(bundle.ends_at).toISOString().slice(0, 16) : "";
        itemHost.innerHTML = ""; (bundle.bundle_items || []).forEach((i) => addItem(i.product_id, i.quantity));
        $("#bundleFormTitle").textContent = "Editar combo"; form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      host.querySelectorAll("[data-delete-bundle]").forEach((b) => b.onclick = async () => {
        const bundle = bundles.find((x) => x.id === b.dataset.deleteBundle);
        if (!confirm('¿Eliminar "' + bundle.name + '"? Si ya aparece en pedidos, desactívalo para conservar su historial.')) return;
        const deleted = await db.rpc("admin_delete_bundle", { p_bundle_id: bundle.id });
        if (deleted.error) { toast("No se pudo eliminar: " + deleted.error.message); return; }
        toast("Combo eliminado."); await load();
      });
    }
    $("#addBundleItem").onclick = () => addItem();
    $("#resetBundleForm").onclick = resetForm;
    $("#bundleSearch").addEventListener("input", () => load().catch((e) => toast(e.message)));
    form.onsubmit = async (event) => {
      event.preventDefault();
      const fd = new FormData(form), price = Number(fd.get("price")), stock = Number(fd.get("stock"));
      const items = Array.from(itemHost.querySelectorAll(".bundle-item-row")).map((row) => ({ product_id: row.querySelector("[data-bundle-product]").value, quantity: Number(row.querySelector("[data-bundle-quantity]").value) }));
      if (!items.length || items.some((x) => !x.product_id || !Number.isInteger(x.quantity) || x.quantity < 1) || new Set(items.map((x) => x.product_id)).size !== items.length) { toast("Agrega productos válidos sin repetirlos."); return; }
      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) { toast("Revisa el precio y la cantidad disponible."); return; }
      const image = String(fd.get("image_url") || "").trim();
      if (image) { try { if (new URL(image).protocol !== "https:") throw new Error(); } catch (_) { toast("La imagen debe ser una URL HTTPS."); return; } }
      const payload = {
        id: String(fd.get("id") || "") || null, name: String(fd.get("name") || "").trim(),
        category: String(fd.get("category") || ""), description: String(fd.get("description") || "").trim(),
        price, stock, image_url: image || null,
        starts_at: fd.get("starts_at") ? new Date(fd.get("starts_at")).toISOString() : null,
        ends_at: fd.get("ends_at") ? new Date(fd.get("ends_at")).toISOString() : null,
        status: String(fd.get("status") || "inactive"), is_published: fd.get("is_published") === "on"
      };
      if (payload.ends_at && payload.starts_at && new Date(payload.ends_at) <= new Date(payload.starts_at)) { toast("La fecha final debe ser posterior a la inicial."); return; }
      const saved = await db.rpc("admin_save_bundle", { p_bundle: payload, p_items: items });
      if (saved.error) { toast("No se pudo guardar el combo: " + saved.error.message); return; }
      toast("Combo guardado. El descuento se calcula automáticamente."); resetForm(); await load();
    };
    $("#bundleSearch").value = "";
    resetForm(); await load();
  }

  async function reviewsPage() {
    const host = $("#adminTable");
    async function load() {
      const result = await db.from("reviews").select("id,display_name,rating,body,is_visible,created_at,products(name)").order("created_at", { ascending: false });
      if (result.error) throw result.error;
      host.innerHTML = (result.data || []).length ? `
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Autor</th>
                <th>Producto</th>
                <th>Calificación</th>
                <th>Opinión</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${(result.data || []).map((review) => `
                <tr>
                  <td>${esc(review.display_name)}</td>
                  <td>${esc(review.products?.name || "Reseña general")}</td>
                  <td>${review.rating}/5</td>
                  <td>${esc(review.body)}</td>
                  <td>${review.is_visible ? "Visible" : "Pendiente"}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-outline btn-small" data-review="${esc(review.id)}" data-visible="${review.is_visible}">
                        ${review.is_visible ? "Ocultar" : "Publicar"}
                      </button>
                      <button class="btn-outline btn-small danger" data-review-delete="${esc(review.id)}">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty">No hay reseñas.</div>';
      host.querySelectorAll("[data-review]").forEach((b) => b.onclick = async () => {
        const saved = await db.from("reviews").update({ is_visible: b.dataset.visible !== "true" }).eq("id", b.dataset.review);
        if (saved.error) { toast("No se pudo actualizar: " + saved.error.message); return; }
        toast("Estado de la reseña actualizado."); await load();
      });
      host.querySelectorAll("[data-review-delete]").forEach((b) => b.onclick = async () => {
        if (!confirm("¿Eliminar esta reseña?")) return;
        const deleted = await db.from("reviews").delete().eq("id", b.dataset.review);
        if (deleted.error) { toast("No se pudo eliminar: " + deleted.error.message); return; }
        toast("Reseña eliminada."); await load();
      });
    }
    await load();
  }

  boot().catch((error) => {
    const notice = $("#adminNotice");
    if (notice) { notice.classList.remove("hidden"); notice.textContent = "No se pudo cargar el panel: " + (error && error.message || "error desconocido"); }
    console.error("Error en administración:", error);
  });
})();
