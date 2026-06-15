/* =============================================
   TECHSTORE — CATALOG.JS
   Категории, список товаров, добавление в корзину, пагинация
   ============================================= */

// Текущая активная категория (null = все товары)
let activeCategoryId = null;

// Все загруженные товары
let allProducts = [];

// Текущая страница пагинации
let currentPage = 1;

// Сколько товаров показывать на одной странице
const PRODUCTS_PER_PAGE = 8;

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
    loadCategories();
    loadProducts();
});

/* ─── КАТЕГОРИИ ─────────────────────────────── */

async function loadCategories() {
    const res = await apiGet("/api/categories/list.php");

    const container = document.getElementById("categories");
    if (!container) return;

    container.innerHTML = "";

    if (!res.success || res.data.length === 0) return;

    const allBtn = document.createElement("button");
    allBtn.className = "category-btn active";
    allBtn.textContent = "Все";
    allBtn.onclick = () => filterByCategory(null, allBtn);
    container.appendChild(allBtn);

    res.data.forEach(function (category) {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        btn.textContent = category.name;
        btn.onclick = () => filterByCategory(category.id, btn);
        container.appendChild(btn);
    });
}

function filterByCategory(categoryId, clickedBtn) {
    activeCategoryId = categoryId;
    currentPage = 1;

    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    clickedBtn.classList.add("active");

    loadProducts(categoryId);
}

/* ─── ТОВАРЫ ────────────────────────────────── */

async function loadProducts(categoryId = null) {
    const grid = document.getElementById("products");
    const empty = document.getElementById("catalog-empty");
    const countEl = document.getElementById("catalog-count");

    if (!grid) return;

    grid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;

    if (empty) empty.style.display = "none";

    const url = categoryId
        ? `/api/products/list.php?category_id=${categoryId}`
        : `/api/products/list.php`;

    const res = await apiGet(url);

    grid.innerHTML = "";

    if (!res.success) {
        grid.innerHTML = `<p style="color:#dc2626">Ошибка загрузки товаров</p>`;
        return;
    }

    allProducts = res.data;
    currentPage = 1;

    if (countEl) {
        countEl.textContent = allProducts.length > 0
            ? allProducts.length + " товаров"
            : "";
    }

    if (allProducts.length === 0) {
        if (empty) empty.style.display = "block";
        renderPagination();
        return;
    }

    renderProductsPage();
    renderPagination();
}

/* ─── РЕНДЕР ТОВАРОВ ПО СТРАНИЦАМ ───────────── */

function renderProductsPage() {
    const grid = document.getElementById("products");
    if (!grid) return;

    grid.innerHTML = "";

    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;

    const productsForPage = allProducts.slice(start, end);

    productsForPage.forEach(function (product) {
        grid.innerHTML += renderProductCard(product);
    });
}

/* ─── ПАГИНАЦИЯ ─────────────────────────────── */

function renderPagination() {
    let pagination = document.getElementById("pagination");

    const grid = document.getElementById("products");
    if (!grid) return;

    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        pagination.className = "pagination";
        grid.insertAdjacentElement("afterend", pagination);
    }

    pagination.innerHTML = "";

    const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
    }

    pagination.style.display = "flex";

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination__btn";
    prevBtn.textContent = "←";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = function () {
        if (currentPage > 1) {
            currentPage--;
            renderProductsPage();
            renderPagination();
            scrollToCatalogTop();
        }
    };
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "pagination__btn";

        if (i === currentPage) {
            btn.classList.add("pagination__btn--active");
        }

        btn.textContent = i;

        btn.onclick = function () {
            currentPage = i;
            renderProductsPage();
            renderPagination();
            scrollToCatalogTop();
        };

        pagination.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination__btn";
    nextBtn.textContent = "→";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = function () {
        if (currentPage < totalPages) {
            currentPage++;
            renderProductsPage();
            renderPagination();
            scrollToCatalogTop();
        }
    };
    pagination.appendChild(nextBtn);
}

function scrollToCatalogTop() {
    const catalog = document.getElementById("catalog");
    if (catalog) {
        catalog.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* ─── КАРТОЧКА ТОВАРА ───────────────────────── */

function renderProductCard(product) {
    const imgHtml = product.image
        ? `<img src="${getImageUrl(product.image)}" alt="${product.name}" loading="lazy">`
        : `<div class="product-card__no-img">📦</div>`;

    return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-card__img">
                ${imgHtml}
            </a>
            <div class="product-card__body">
                <p class="product-card__category">${escapeHtml(product.category_name)}</p>
                <a href="product.html?id=${product.id}" class="product-card__name">
                    ${escapeHtml(product.name)}
                </a>
                <p class="product-card__price">${formatPrice(product.price)}</p>
            </div>
            <div class="product-card__footer">
                <a href="product.html?id=${product.id}" class="btn btn--outline">
                    Подробнее
                </a>
                <button
                    class="btn btn--primary"
                    onclick="addToCart(${product.id}, this)"
                >
                    В корзину
                </button>
            </div>
        </div>
    `;
}

/* ─── ДОБАВИТЬ В КОРЗИНУ ────────────────────── */

async function addToCart(productId, btn) {
    if (!currentUser) {
        openModal();
        showToast("Войдите чтобы добавить товар в корзину", "info");
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "...";

    const res = await apiPost("/api/cart/add.php", {
        product_id: productId,
        quantity: 1
    });

    btn.disabled = false;
    btn.textContent = originalText;

    if (res.success) {
        showToast("Товар добавлен в корзину", "success");
        updateCartCount();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}