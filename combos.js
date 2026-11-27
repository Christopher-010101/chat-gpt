(() => {
  const host = document.querySelector("#bundleGrid");
  if (!host) return;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

  const db = window.DP?.db;
  if (!db) {
    host.innerHTML = '<div class="empty">Los combos publicados aparecerán aquí cuando Supabase esté conectado.</div>';
    return;
  }

  (async () => {
    const bundleColumns = [
      "id",
      "name",
      "description",
      "category",
      "image_url",
      "price",
      "stock",
      "starts_at",
      "ends_at",
      "bundle_items(quantity,products(id,name,price,stock,is_published,status,image_url))"
    ].join(",");
    const result = await db
      .from("bundles")
      .select(bundleColumns)
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (result.error) {
      host.innerHTML = '<div class="notice">No se pudieron cargar los combos. Ejecuta la migración de combos y revisa las políticas RLS.</div>';
      return;
    }

    const now = Date.now();
    const combos = (result.data || []).map((bundle) => {
      const entries = bundle.bundle_items || [];
      const available = entries.length
        ? Math.min(
            Number(bundle.stock),
            ...entries.map((entry) => {
              const product = entry.products;
              const isAvailable = product?.is_published && product.status === "active";
              return isAvailable
                ? Math.floor(Number(product.stock) / Number(entry.quantity))
                : 0;
            })
          )
        : 0;
      const original = entries.reduce((sum, entry) => {
        return sum + Number(entry.products?.price || 0) * Number(entry.quantity);
      }, 0);

      return {
        ...bundle,
        available,
        original,
        saving: Math.max(0, original - Number(bundle.price))
      };
    }).filter((bundle) => {
      const started = !bundle.starts_at || new Date(bundle.starts_at).getTime() <= now;
      const notExpired = !bundle.ends_at || new Date(bundle.ends_at).getTime() > now;
      return bundle.available > 0 && started && notExpired;
    });

    if (!combos.length) {
      host.innerHTML = '<div class="empty">No hay combos activos con inventario disponible en este momento.</div>';
      return;
    }

    host.innerHTML = combos.map((bundle) => {
      const firstProduct = bundle.bundle_items[0]?.products;
      const image = bundle.image_url || firstProduct?.image_url || "assets/img/ofertas.svg";
      const products = bundle.bundle_items.map((entry) => {
        return `<li>${esc(entry.products?.name || "Producto")} × ${Number(entry.quantity)}</li>`;
      }).join("");

      return `
        <article class="product-card bundle-card">
          <img
            src="${esc(image)}"
            alt="${esc(bundle.name)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='assets/img/ofertas.svg'"
          >
          <span class="tag">Combo · ahorra ${esc(window.DP.money(bundle.saving))}</span>
          <div class="product-info">
            <span class="product-brand">${esc(bundle.category)}</span>
            <h3>${esc(bundle.name)}</h3>
            <p class="small">${esc(bundle.description || "Paquete especial de productos.")}</p>
            <div class="bundle-prices">
              <strong class="price">${esc(window.DP.money(bundle.price))}</strong>
              ${bundle.original > bundle.price
                ? `<s class="old-price">${esc(window.DP.money(bundle.original))}</s>`
                : ""}
            </div>
            <details class="bundle-details">
              <summary>Ver detalles</summary>
              <ul>${products}</ul>
              <p class="small">Disponibles: ${bundle.available} combo(s)</p>
              ${bundle.ends_at
                ? `<p class="small">Oferta hasta ${esc(new Date(bundle.ends_at).toLocaleDateString("es-DO"))}</p>`
                : ""}
            </details>
            <button class="primary btn-small" data-combo-add="${esc(bundle.id)}">
              Agregar combo al carrito
            </button>
          </div>
        </article>
      `;
    }).join("");

    host.querySelectorAll("[data-combo-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const bundle = combos.find((item) => item.id === button.dataset.comboAdd);
        if (!bundle) return;

        window.DP.addToCart({
          id: bundle.id,
          kind: "bundle",
          name: bundle.name,
          price: Number(bundle.price),
          compare_at_price: bundle.original,
          image: bundle.image_url || "assets/img/ofertas.svg",
          available_stock: bundle.available,
          stock: bundle.available,
          description: bundle.description
        });
      });
    });
  })().catch((error) => {
    host.innerHTML = `<div class="notice">No se pudieron cargar los combos: ${esc(error.message)}</div>`;
  });
})();
