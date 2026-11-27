(async () => {
  const host = document.querySelector("#productGrid");
  if (!host) return;

  const searchForm = document.querySelector("#catalogSearchForm");
  const searchInput = document.querySelector("#productSearch");
  const categoryFilter = document.querySelector("#categoryFilter");
  const sortFilter = document.querySelector("#sortProducts");
  const resultCount = document.querySelector("#productCount");
  const searchNotice = document.querySelector("#searchNotice");
  const demoNote = document.querySelector("[data-demo-note]");
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  let products = window.DP.demoProducts || [];

  if (searchInput) searchInput.value = initialQuery;
  if (resultCount) resultCount.textContent = "Cargando productos…";
  host.innerHTML = '<div class="empty" role="status">Cargando productos…</div>';

  if (window.DP.db) {
    const { data, error } = await window.DP.db
      .from("products")
      .select("*,categories(name,slug)")
      .eq("is_published", true)
      .order("name", { ascending: true });

    if (error) {
      if (searchNotice) {
        searchNotice.textContent = "No se pudieron cargar los productos desde Supabase. Actualiza la página para intentarlo de nuevo.";
      }
      if (resultCount) resultCount.textContent = "";
      host.innerHTML = "";
      return;
    }

    products = (data || [])
      .filter((product) => !product.status || product.status === "active")
      .map((product) => ({
        ...product,
        image: product.image_url,
        category: product.categories?.name || "",
        category_slug: product.categories?.slug || "",
      }));

    demoNote?.classList.add("hidden");
  } else {
    demoNote?.classList.remove("hidden");
  }

  const categories = new Map();
  products.forEach((product) => {
    const slug = product.category_slug || product.categories?.slug;
    const name = product.category || product.categories?.name || slug;
    if (slug && name) categories.set(slug, name);
  });

  [...categories.entries()]
    .sort((first, second) => first[1].localeCompare(second[1], "es"))
    .forEach(([slug, name]) => {
      const option = document.createElement("option");
      option.value = slug;
      option.textContent = name;
      categoryFilter?.append(option);
    });

  function renderProducts() {
    const filtered = window.DP.filterCatalogProducts(products, {
      query: searchInput?.value || "",
      categorySlug: categoryFilter?.value || "",
      sort: sortFilter?.value || "featured",
    });

    if (resultCount) {
      const productLabel = filtered.length === 1 ? "producto encontrado" : "productos encontrados";
      resultCount.textContent = `${filtered.length} ${productLabel}`;
    }

    if (!filtered.length) {
      host.innerHTML = `
        <div class="empty catalog-empty">
          <p>No encontramos productos con esos filtros.</p>
          <button class="btn btn-outline" id="clearCatalogFilters" type="button">Limpiar búsqueda</button>
        </div>
      `;
      document.querySelector("#clearCatalogFilters")?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (sortFilter) sortFilter.value = "featured";
        renderProducts();
        searchInput?.focus();
      });
      return;
    }

    host.innerHTML = filtered.map((product) => window.DP.productCard(product)).join("");
  }

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderProducts();
  });
  searchInput?.addEventListener("input", renderProducts);
  categoryFilter?.addEventListener("change", renderProducts);
  sortFilter?.addEventListener("change", renderProducts);

  renderProducts();
})();
