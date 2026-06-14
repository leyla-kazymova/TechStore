/* =============================================
   TECHSTORE — CATALOG.JS
   Категории, список товаров, добавление в корзину
   ============================================= */

// Текущая активная категория (null = все товары)
let activeCategoryId = null;

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

// Запускается когда страница загрузилась
document.addEventListener("DOMContentLoaded", function () {
    loadCategories();
    loadProducts();
});

/* ─── КАТЕГОРИИ ─────────────────────────────── */

async function loadCategories() {
    const res = await apiGet("/api/categories/list.php");

    const container = document.getElementById("categories");
    if (!container) return;

    // Убираем скелетоны
    container.innerHTML = "";

    if (!res.success || res.data.length === 0) return;

    // Кнопка "Все" — показывает все товары без фильтра
    const allBtn = document.createElement("button");
    allBtn.className   = "category-btn active";
    allBtn.textContent = "Все";
    allBtn.onclick     = () => filterByCategory(null, allBtn);
    container.appendChild(allBtn);

    // Кнопка для каждой категории
    res.data.forEach(function (category) {
        const btn      = document.createElement("button");
        btn.className  = "category-btn";
        btn.textContent= category.name;
        btn.onclick    = () => filterByCategory(category.id, btn);
        container.appendChild(btn);
    });
}

// Вызывается при клике на кнопку категории
function filterByCategory(categoryId, clickedBtn) {
    activeCategoryId = categoryId;

    // Снимаем active со всех кнопок, ставим на нажатую
    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    clickedBtn.classList.add("active");

    // Загружаем товары этой категории
    loadProducts(categoryId);
}

/* ─── ТОВАРЫ ────────────────────────────────── */

async function loadProducts(categoryId = null) {
    const grid     = document.getElementById("products");
    const empty    = document.getElementById("catalog-empty");
    const countEl  = document.getElementById("catalog-count");

    if (!grid) return;

    // Показываем скелетоны пока грузим
    grid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
    if (empty) empty.style.display = "none";

    // Формируем URL — с фильтром по категории или без
    const url = categoryId
        ? `/api/products/list.php?category_id=${categoryId}`
        : `/api/products/list.php`;

    const res = await apiGet(url);

    // Убираем скелетоны
    grid.innerHTML = "";

    if (!res.success) {
        grid.innerHTML = `<p style="color:#dc2626">Ошибка загрузки товаров</p>`;
        return;
    }

    const products = res.data;

    // Обновляем счётчик товаров
    if (countEl) {
        countEl.textContent = products.length > 0
            ? products.length + " товаров"
            : "";
    }

    // Если товаров нет — показываем заглушку
    if (products.length === 0) {
        if (empty) empty.style.display = "block";
        return;
    }

    // Рендерим карточки
    products.forEach(function (product) {
        grid.innerHTML += renderProductCard(product);
    });
}

/* ─── КАРТОЧКА ТОВАРА ───────────────────────── */

// Возвращает HTML одной карточки
function renderProductCard(product) {
    // Картинка или заглушка
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
    // Если пользователь не авторизован — открываем модалку входа
    if (!currentUser) {
        openModal();
        showToast("Войдите чтобы добавить товар в корзину", "info");
        return;
    }

    // Блокируем кнопку чтобы не добавить несколько раз
    const originalText  = btn.textContent;
    btn.disabled        = true;
    btn.textContent     = "...";

    const res = await apiPost("/api/cart/add.php", {
        product_id: productId,
        quantity:   1
    });

    btn.disabled    = false;
    btn.textContent = originalText;

    if (res.success) {
        showToast("Товар добавлен в корзину", "success");
        updateCartCount(); // обновляем счётчик в шапке
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}