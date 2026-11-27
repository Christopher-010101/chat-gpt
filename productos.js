(async () => {
  const host = document.querySelector("#productGrid");
  if (!host) return;

  const category = document.body.dataset.category;
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";
  const demoProducts = window.DP.demoProducts || [];
  let products = demoProducts.filter((product) => {
    return product.category_slug === category || (category === "ofertas" && product.compare_at_price);
  });

  if (window.DP.db) {
    let query = window.DP.db
      .from("products")
      .select("*,categories!inner(slug,name)")
      .eq("is_published", true);

    if (category !== "ofertas") {
      query = query.eq("categories.slug", category);
    } else {
      query = query.not("compare_at_price", "is", null);
    }

    const { data, error } = await query;
    if (error) {
      host.innerHTML = '<div class="notice">No se pudieron cargar los productos desde Supabase. Intenta actualizar la página.</div>';
      return;
    }

    products = (data || [])
      .filter((product) => !product.status || product.status === "active")
      .map((product) => ({
        ...product,
        image: product.image_url,
        category_slug: product.categories?.slug
      }));
  }

  const search = document.querySelector("#productSearch");
  const sort = document.querySelector("#sortProducts");
  const count = document.querySelector("#productCount");
  if (search) search.value = initialQuery;

  function drawProducts() {
    const text = (search?.value || "").toLowerCase();
    const filtered = products.filter((product) => {
      return `${product.name} ${product.brand} ${product.description}`.toLowerCase().includes(text);
    });

    if (sort?.value === "low") filtered.sort((a, b) => a.price - b.price);
    if (sort?.value === "high") filtered.sort((a, b) => b.price - a.price);

    if (count) count.textContent = `${filtered.length} producto(s) encontrados`;
    host.innerHTML = filtered.length
      ? filtered.map(window.DP.productCard).join("")
      : '<div class="empty" style="grid-column:1/-1">No encontramos productos con esos filtros.</div>';
  }

  search?.addEventListener("input", drawProducts);
  sort?.addEventListener("change", drawProducts);
  drawProducts();
})();
