window.DP = window.DP || {};
window.DP.productsById = window.DP.productsById || {};
// Fotografías reales de productos comerciales. Los precios y existencias son datos académicos de demostración.
window.DP.demoProducts = [
  {
    id: "demo-samsung-a15",
    name: "Samsung Galaxy A15 128 GB",
    brand: "Samsung",
    description: "Smartphone con pantalla Super AMOLED de 6.5 pulgadas y cámara principal de 50 MP.",
    price: 8995,
    compare_at_price: 9995,
    stock: 12,
    image: "https://i5.walmartimages.com/asr/2f4a87e3-a16b-4f64-baff-6135548a4eba.02ae1b3626c91207e5cc76c666616d4a.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768",
    fallback_image: "assets/img/celulares.svg",
    category_slug: "celulares",
    features: ["128 GB", "Super AMOLED", "50 MP"]
  },
  {
    id: "demo-lenovo-ideapad",
    name: 'Lenovo IdeaPad Slim 3 15.6"',
    brand: "Lenovo",
    description: "Laptop para estudio y productividad con procesador Intel Core i7, 16 GB RAM y SSD de 512 GB.",
    price: 32995,
    compare_at_price: 35995,
    stock: 6,
    image: "https://cdn11.bigcommerce.com/s-sp9oc95xrw/images/stencil/1280x1280/products/19088/71372/82X7006LAX__18628.1701425037.jpg?c=2",
    fallback_image: "assets/img/laptops.svg",
    category_slug: "laptops",
    features: ["Intel Core i7", "16 GB RAM", "SSD 512 GB"]
  },
  {
    id: "demo-samsung-tab",
    name: 'Samsung Galaxy Tab 8.7"',
    brand: "Samsung",
    description: "Tablet compacta para lectura, clases, navegación y entretenimiento.",
    price: 9995,
    compare_at_price: null,
    stock: 9,
    image: "https://media.ipcstore.net/img/21312197_1.jpg",
    fallback_image: "assets/img/tablets.svg",
    category_slug: "tablets",
    features: ["8.7 pulgadas", "64 GB", "Wi-Fi"]
  },
  {
    id: "demo-lg-tv",
    name: 'LG UHD 4K Smart TV 55"',
    brand: "LG",
    description: "Televisor LG de 55 pulgadas con resolución UHD 4K y funciones Smart TV.",
    price: 27995,
    compare_at_price: 31995,
    stock: 4,
    image: "https://www.lg.com/ru/images/televisions/md06099956/gallery/UM7300_55_large.jpg",
    fallback_image: "assets/img/televisores.svg",
    category_slug: "televisores",
    features: ["55 pulgadas", "UHD 4K", "Smart TV"]
  },
  {
    id: "demo-lg-fridge",
    name: "Refrigerador LG Smart Inverter",
    brand: "LG",
    description: "Refrigerador de dos puertas con compresor Smart Inverter y amplio espacio interior.",
    price: 42995,
    compare_at_price: null,
    stock: 3,
    image: "https://bf1af2.akinoncloudcdn.com/products/2024/09/19/35795/cdcf4c29-2fd4-4d5a-834b-59a3fbf7ad36_size3840_cropCenter.jpg",
    fallback_image: "assets/img/electrodomesticos.svg",
    category_slug: "electrodomesticos",
    features: ["Smart Inverter", "Dos puertas", "438 litros"]
  },
  {
    id: "demo-sony-headphones",
    name: "Audífonos inalámbricos Sony",
    brand: "Sony",
    description: "Audífonos over-ear inalámbricos para música, llamadas y uso diario.",
    price: 4995,
    compare_at_price: 5995,
    stock: 18,
    image: "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_102745011",
    fallback_image: "assets/img/accesorios.svg",
    category_slug: "accesorios",
    features: ["Bluetooth", "Over-ear", "Micrófono integrado"]
  }
];

window.DP.productCard = (product) => {
  window.DP.productsById[product.id] = product;

  const categoryImages = {
    celulares: "assets/img/celulares.svg",
    laptops: "assets/img/laptops.svg",
    tablets: "assets/img/tablets.svg",
    televisores: "assets/img/televisores.svg",
    electrodomesticos: "assets/img/electrodomesticos.svg",
    accesorios: "assets/img/accesorios.svg"
  };
  const fallback = product.fallback_image || categoryImages[product.category_slug] || "assets/img/accesorios.svg";
  const image = product.image || product.image_url || fallback;
  const offerLabel = product.offer_label || (product.compare_at_price ? "Oferta" : "");
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

  return `
    <article class="product-card">
      <img
        src="${safe(image)}"
        alt="Fotografía de ${safe(product.name)}"
        loading="lazy"
        onerror="this.onerror=null;this.src='${fallback}'"
      >
      ${offerLabel ? `<span class="tag">${safe(offerLabel)}</span>` : ""}
      <div class="product-info">
        <span class="product-brand">${safe(product.brand || "D'Paniagua")}</span>
        <h3>${safe(product.name)}</h3>
        <p class="small">${safe(product.description || "Consulta detalles y disponibilidad.")}</p>
        <div>
          <span class="price">${window.DP.money(product.price)}</span>
          ${product.compare_at_price
            ? `<span class="old-price">${window.DP.money(product.compare_at_price)}</span>`
            : ""}
        </div>
        <div class="stock ${product.stock > 0 ? "" : "out"}">
          ${product.stock > 0 ? `Disponible · ${product.stock} uds.` : "Agotado"}
        </div>
        <div class="product-actions">
          <button class="primary btn-small" ${product.stock <= 0 ? "disabled" : ""} data-add="${safe(product.id)}">
            Añadir
          </button>
          <a class="btn-outline btn-small" href="producto.html?id=${encodeURIComponent(product.id)}">
            Ver detalles
          </a>
        </div>
      </div>
    </article>
  `;
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const product = window.DP.productsById[button.dataset.add] ||
    window.DP.demoProducts.find((item) => item.id === button.dataset.add);
  if (product) {
    window.DP.addToCart({
      ...product,
      image: product.image || product.image_url || product.fallback_image || "assets/img/accesorios.svg"
    });
  } else {
    window.DP.toast("No se pudo cargar el producto.");
  }
});
window.DP.showProductDetails = async (product) => {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

  let modal = document.getElementById("productDetailModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "productDetailModal";
    modal.className = "dp-detail-backdrop";
    modal.innerHTML = `
      <section class="dp-detail" role="dialog" aria-modal="true" aria-labelledby="dpDetailTitle">
        <button class="dp-detail-close" aria-label="Cerrar">×</button>
        <div id="dpDetailContent"></div>
      </section>
    `;
    document.body.append(modal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest(".dp-detail-close")) {
        modal.remove();
        document.body.style.overflow = "";
      }
    });
  }

  const content = modal.querySelector("#dpDetailContent");
  const image = product.image || product.image_url || product.fallback_image || "assets/img/accesorios.svg";
  content.innerHTML = `
    <div class="dp-detail-product">
      <img src="${esc(image)}" alt="${esc(product.name)}">
      <div>
        <span class="eyebrow">${esc(product.brand || "D'Paniagua Technology")}</span>
        <h2 id="dpDetailTitle">${esc(product.name)}</h2>
        <p>${esc(product.description || "")}</p>
        <strong class="price">${window.DP.money(product.price)}</strong>
        <p class="small">${product.stock > 0 ? `Disponible · ${product.stock} unidades` : "Agotado"}</p>
        <p>${(product.features || []).map((feature) => `<span class="dp-feature">${esc(feature)}</span>`).join(" ")}</p>
      </div>
    </div>
    <hr>
    <section>
      <h3>Reseñas de este producto</h3>
      <div id="dpProductReviews">Cargando reseñas…</div>
      <form id="dpProductReviewForm" class="dp-review-form">
        <h4>Escribe tu opinión</h4>
        <label for="dpReviewRating">Calificación</label>
        <select id="dpReviewRating" name="rating" required>
          <option value="5">★★★★★ · 5</option>
          <option value="4">★★★★☆ · 4</option>
          <option value="3">★★★☆☆ · 3</option>
          <option value="2">★★☆☆☆ · 2</option>
          <option value="1">★☆☆☆☆ · 1</option>
        </select>
        <label for="dpReviewBody">Tu comentario</label>
        <textarea id="dpReviewBody" name="body" minlength="10" maxlength="1200" required placeholder="Cuéntanos tu experiencia (mínimo 10 caracteres)"></textarea>
        <button class="primary" type="submit">Enviar reseña</button>
        <p class="small">Debes iniciar sesión. Tu reseña aparecerá inmediatamente después de enviarla.</p>
      </form>
    </section>
  `;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  const reviewHost = content.querySelector("#dpProductReviews");
  const db = window.DP.db;
  const isSavedProduct = product.id && !String(product.id).startsWith("demo-");

  if (!db || !isSavedProduct) {
    reviewHost.innerHTML = '<p class="small">Las reseñas aparecerán cuando el producto esté guardado en Supabase.</p>';
  } else {
    const result = await db
      .from("reviews")
      .select("id,display_name,rating,body,created_at,is_verified")
      .eq("product_id", product.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (result.error) {
      reviewHost.textContent = "No se pudieron cargar las reseñas. Verifica la conexión con Supabase.";
    } else {
      const reviews = result.data || [];
      const average = reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
        : 0;
      const stars = reviews.length
        ? "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average))
        : "☆☆☆☆☆";
      const reviewCards = reviews.map((review) => `
        <article class="review-card">
          <b>${esc(review.display_name)}</b>
          <span class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
          <p>${esc(review.body)}</p>
          <small>
            ${new Date(review.created_at).toLocaleDateString("es-DO")}
            ${review.is_verified ? " · Compra verificada" : ""}
          </small>
        </article>
      `).join("");

      reviewHost.innerHTML = `
        <div class="dp-review-summary">
          <strong>${reviews.length ? average.toFixed(1) : "—"} / 5</strong>
          <span class="stars">${stars}</span>
          <span>${reviews.length} reseña(s)</span>
        </div>
        ${reviewCards || '<p class="small">Todavía no hay reseñas aprobadas para este producto.</p>'}
      `;
    }
  }

  content.querySelector("#dpProductReviewForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!db) {
      window.DP.toast("No hay conexión con Supabase.");
      return;
    }

    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError) {
      window.DP.toast("No se pudo verificar tu sesión: " + authError.message);
      return;
    }
    if (!user) {
      location.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
      return;
    }
    if (!isSavedProduct) {
      window.DP.toast("Este producto de demostración debe guardarse desde el administrador antes de recibir reseñas.");
      return;
    }

    const form = event.currentTarget;
    const body = form.elements.namedItem("body").value.trim();
    const rating = Number(form.elements.namedItem("rating").value);
    if (body.length < 10 || rating < 1 || rating > 5) {
      window.DP.toast("Selecciona una calificación y escribe al menos 10 caracteres.");
      return;
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      window.DP.toast("No se pudo consultar tu perfil: " + profileError.message);
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const { error } = await db.from("reviews").insert({
        user_id: user.id,
        product_id: product.id,
        display_name: profile?.full_name || user.email?.split("@")[0] || "Cliente",
        rating,
        body,
        is_visible: true,
        is_verified: false
      });

      if (error) {
        console.error("Error publicando reseña de producto:", error);
        window.DP.toast(error.code === "23505"
          ? "Ya enviaste una reseña para este producto."
          : `No se pudo enviar: ${error.message}`);
        return;
      }

      form.reset();
      window.DP.toast("¡Gracias! Tu reseña ya está publicada.");
      await window.DP.showProductDetails(product);
    } finally {
      submit.disabled = false;
    }
  });
};
