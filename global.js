(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const toast = (message) => {
    let element = $("#toast");
    if (!element) {
      element = document.createElement("div");
      element.id = "toast";
      element.className = "toast";
      document.body.append(element);
    }

    element.textContent = message;
    element.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => element.classList.remove("show"), 2800);
  };

  const filterCatalogProducts = (products, filters = {}) => {
    const normalize = (value) => String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const query = normalize(filters.query).trim();
    const categorySlug = String(filters.categorySlug ?? "").trim();

    const filtered = (Array.isArray(products) ? products : []).filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.description,
        product.category,
        product.category_slug,
        product.categories?.name,
        product.categories?.slug,
      ].map(normalize).join(" ");
      const matchesQuery = !query || searchableText.includes(query);
      const productCategory = String(product.category_slug ?? product.categories?.slug ?? "");
      const matchesCategory = !categorySlug || productCategory === categorySlug;

      return matchesQuery && matchesCategory;
    });

    if (filters.sort === "low") {
      return filtered.sort((first, second) => Number(first.price) - Number(second.price));
    }
    if (filters.sort === "high") {
      return filtered.sort((first, second) => Number(second.price) - Number(first.price));
    }

    return filtered;
  };

  window.DP = window.DP || {};
  Object.assign(window.DP, { toast, $, filterCatalogProducts });

  const menuButton = $("#menuToggle");
  const navigation = $("#navLinks");
  const closeNavigation = (restoreFocus = false) => {
    if (!menuButton || !navigation) return;
    navigation.classList.remove?.("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    menuButton.textContent = "☰";
    if (restoreFocus) menuButton.focus?.();
  };

  if (navigation && typeof location.pathname === "string" && navigation.querySelectorAll) {
    const currentPage = location.pathname.split("/").filter(Boolean).pop() || "index.html";
    navigation.querySelectorAll("a[href]").forEach((link) => {
      const linkedPage = new URL(link.href, location.href).pathname.split("/").filter(Boolean).pop() || "index.html";
      if (linkedPage === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("open") ?? false;
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    menuButton.textContent = isOpen ? "×" : "☰";
  });

  navigation?.querySelectorAll?.("a")?.forEach((link) => {
    link.addEventListener("click", () => closeNavigation());
  });

  document.addEventListener?.("click", (event) => {
    if (!navigation?.classList.contains("open")) return;
    if (navigation.contains?.(event.target) || menuButton?.contains?.(event.target)) return;
    closeNavigation();
  });

  document.addEventListener?.("keydown", (event) => {
    if (event.key === "Escape" && navigation?.classList.contains("open")) {
      closeNavigation(true);
    }
  });

  const cart = () => JSON.parse(localStorage.getItem("dp_cart") || "[]");
  const updateCount = () => {
    const quantity = cart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = quantity;
    });
  };

  window.DP.cart = cart;
  window.DP.updateCount = updateCount;
  updateCount();

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = form.querySelector("input").value.trim();
      location.href = `buscar.html?q=${encodeURIComponent(query)}`;
    });
  });

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  if (!window.DP.supabaseReady) {
    document.querySelectorAll("[data-demo-note]").forEach((element) => {
      element.classList.remove("hidden");
    });
  }
})();
