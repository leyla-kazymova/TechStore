/* =============================================
   TECHSTORE — PRODUCT.JS
   Загрузка и отображение карточки товара
   ============================================= */

// ID товара из URL
let productId = null;

// Максимальное количество в наличии
let maxQuantity = 99;

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
    // Читаем id из URL: product.html?id=5
    const params = new URLSearchParams(window.location.search);
    productId    = params.get("id");

    if (!productId) {
        showNotFound();
        return;
    }

    loadProduct(productId);
});

/* ─── ЗАГРУЗКА ТОВАРА ───────────────────────── */

async function loadProduct(id) {
    const res = await apiGet(`/api/products/one.php?id=${id}`);

    // Скрываем скелетон
    document.getElementById("product-skeleton").style.display = "none";

    if (!res.success || !res.data) {
        showNotFound();
        return;
    }

    renderProduct(res.data);
}

/* ─── РЕНДЕР ТОВАРА ─────────────────────────── */

function renderProduct(product) {
    // Обновляем title страницы
    document.title = product.name + " — TechStore";

    // Хлебная крошка
    const breadcrumb = document.getElementById("breadcrumb-name");
    if (breadcrumb) breadcrumb.textContent = product.name;

    // Картинка
    const imgBlock = document.getElementById("product-img");
    if (product.image) {
        imgBlock.innerHTML = `<img src="${getImageUrl(product.image)}" alt="${escapeHtml(product.name)}">`;
    } else {
        imgBlock.innerHTML = `<div class="no-img">📦</div>`;
    }

    // Категория
    document.getElementById("product-category").textContent = product.category_name;

    // Название
    document.getElementById("product-name").textContent = product.name;

    // Цена
    document.getElementById("product-price").textContent = formatPrice(product.price);

    // Наличие
    const stockEl  = document.getElementById("product-stock");
    const qty      = parseInt(product.quantity);
    maxQuantity    = qty;

    if (qty > 0) {
        stockEl.className   = "product-detail__stock in-stock";
        stockEl.textContent = "В наличии: " + qty + " шт.";
    } else {
        stockEl.className   = "product-detail__stock out-stock";
        stockEl.textContent = "Нет в наличии";

        // Блокируем кнопку если товара нет
        const btn   = document.getElementById("btn-add-cart");
        if (btn) {
            btn.disabled    = true;
            btn.textContent = "Нет в наличии";
        }
    }

    // Описание
    const descEl = document.getElementById("product-desc");
    if (product.description) {
        descEl.textContent  = product.description;
        descEl.style.display= "block";
    } else {
        descEl.style.display = "none";
    }

    // Показываем блок товара
    document.getElementById("product-detail").style.display = "grid";
}

/* ─── УПРАВЛЕНИЕ КОЛИЧЕСТВОМ ────────────────── */

function changeQuantity(delta) {
    const input = document.getElementById("quantity");
    let val     = parseInt(input.value) + delta;

    // Не меньше 1 и не больше чем есть на складе
    if (val < 1)           val = 1;
    if (val > maxQuantity) val = maxQuantity;

    input.value = val;
}

/* ─── ДОБАВИТЬ В КОРЗИНУ ────────────────────── */

async function addToCartFromPage() {
    // Если не авторизован — открываем модалку
    if (!currentUser) {
        openModal();
        showToast("Войдите чтобы добавить товар в корзину", "info");
        return;
    }

    const quantity = parseInt(document.getElementById("quantity").value);
    const btn      = document.getElementById("btn-add-cart");

    btn.disabled    = true;
    btn.textContent = "Добавляем...";

    const res = await apiPost("/api/cart/add.php", {
        product_id: parseInt(productId),
        quantity:   quantity
    });

    btn.disabled    = false;
    btn.textContent = "В корзину";

    if (res.success) {
        showToast("Товар добавлен в корзину", "success");
        updateCartCount();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* ─── ТОВАР НЕ НАЙДЕН ───────────────────────── */

function showNotFound() {
    document.getElementById("product-skeleton").style.display = "none";
    document.getElementById("product-detail").style.display   = "none";
    document.getElementById("product-not-found").style.display= "block";
}