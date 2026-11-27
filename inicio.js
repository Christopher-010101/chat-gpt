(async () => {
  const host = document.querySelector("#featuredProducts");
  if (!host) return;

  let products = window.DP.demoProducts || [];
  if (window.DP.db) {
    const { data, error } = await window.DP.db
      .from("products")
      .select("*,categories(name,slug)")
      .eq("is_published", true)
      .limit(8);

    if (error) {
      host.innerHTML = '<div class="notice">No se pudieron cargar los productos desde Supabase.</div>';
      return;
    }

    products = (data || [])
      .filter((product) => !product.status || product.status === "active")
      .map((product) => ({
        ...product,
        image: product.image_url,
        category: product.categories?.name,
        category_slug: product.categories?.slug
      }));
  }

  host.innerHTML = products.length
    ? products.slice(0, 8).map((product) => window.DP.productCard(product)).join("")
    : '<div class="empty">Todavía no hay productos publicados.</div>';
})();
