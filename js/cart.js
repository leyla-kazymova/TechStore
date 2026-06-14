/* =============================================
   TECHSTORE — CART.JS
   Корзина: загрузка, изменение количества,
   удаление товаров, оформление заказа
   ============================================= */

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
    // Ждём пока auth.js проверит авторизацию, потом загружаем корзину
    // checkAuth() вызывается в auth.js при DOMContentLoaded — но нам нужно
    // дождаться его результата, поэтому используем небольшую задержку
    setTimeout(initCart, 100);
});

function initCart() {
    if (!currentUser) {
        // Пользователь не авторизован — показываем заглушку
        showBlock("cart-guest");
        return;
    }

    // Показываем скелетон пока грузим
    showBlock("cart-skeleton");
    loadCart();
}

/* ─── ЗАГРУЗКА КОРЗИНЫ ──────────────────────── */

async function loadCart() {
    const res = await apiGet("/api/cart/list.php");

    hideAllBlocks();

    if (!res.success) {
        showToast("Ошибка загрузки корзины", "error");
        showBlock("cart-empty");
        return;
    }

    const items      = res.data.items;
    const totalPrice = res.data.total_price;

    if (items.length === 0) {
        showBlock("cart-empty");
        return;
    }

    renderCart(items, totalPrice);
    showBlock("cart-layout");
}

/* ─── РЕНДЕР КОРЗИНЫ ────────────────────────── */

function renderCart(items, totalPrice) {
    const cartItemsEl = document.getElementById("cart-items");

    cartItemsEl.innerHTML = items.map(item => renderCartItem(item)).join("");

    // Итого
    document.getElementById("summary-count").textContent = items.length + " шт.";
    document.getElementById("summary-price").textContent = formatPrice(totalPrice);
}

function renderCartItem(item) {
    const imgHtml = item.image
        ? `<img src="${getImageUrl(item.image)}" alt="${item.name}">`
        : `<div class="no-img">📦</div>`;

    return `
        <div class="cart-item" id="cart-item-${item.cart_item_id}">

            <div class="cart-item__img">${imgHtml}</div>

            <div class="cart-item__info">
                <a href="product.html?id=${item.product_id}" class="cart-item__name">
                    ${escapeHtml(item.name)}
                </a>
                <p class="cart-item__price-unit">${formatPrice(item.price)} за шт.</p>
                <p class="cart-item__total">${formatPrice(item.total)}</p>
            </div>

            <div class="cart-item__actions">
                <div class="cart-qty">
                    <button
                        class="cart-qty__btn"
                        onclick="changeItemQty(${item.cart_item_id}, ${item.quantity}, -1)"
                    >−</button>
                    <input
                        class="cart-qty__val"
                        type="number"
                        value="${item.quantity}"
                        min="1"
                        readonly
                        id="qty-${item.cart_item_id}"
                    >
                    <button
                        class="cart-qty__btn"
                        onclick="changeItemQty(${item.cart_item_id}, ${item.quantity}, 1)"
                    >+</button>
                </div>
                <button
                    class="cart-item__remove"
                    onclick="removeItem(${item.cart_item_id})"
                >
                    Удалить
                </button>
            </div>

        </div>
    `;
}

/* ─── ИЗМЕНИТЬ КОЛИЧЕСТВО ───────────────────── */

async function changeItemQty(cartItemId, currentQty, delta) {
    const newQty = currentQty + delta;

    // Минимум 1
    if (newQty < 1) return;

    const res = await apiPost("/api/cart/update.php", {
        cart_item_id: cartItemId,
        quantity:     newQty
    });

    if (res.success) {
        loadCart(); // перезагружаем корзину чтобы пересчитать итого
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* ─── УДАЛИТЬ ТОВАР ─────────────────────────── */

async function removeItem(cartItemId) {
    const res = await apiPost("/api/cart/delete.php", {
        cart_item_id: cartItemId
    });

    if (res.success) {
        // Убираем строку товара из DOM без перезагрузки
        const row = document.getElementById("cart-item-" + cartItemId);
        if (row) row.remove();

        // Перезагружаем чтобы пересчитать итого и проверить не пустая ли корзина
        loadCart();
        updateCartCount();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* ─── ОФОРМИТЬ ЗАКАЗ ────────────────────────── */

async function checkout() {
    const btn = document.getElementById("btn-checkout");

    btn.disabled    = true;
    btn.textContent = "Оформляем...";

    const res = await apiPost("/api/cart/checkout.php");

    btn.disabled    = false;
    btn.textContent = "Оформить заказ";

    if (res.success) {
        showToast("Заказ №" + res.data.order_id + " оформлен!", "success");
        updateCartCount();

        // Переходим на страницу заказов через 1.5 секунды
        setTimeout(() => {
            window.location.href = "orders.html";
        }, 1500);
    } else {
        showToast(res.message || "Ошибка оформления", "error");
    }
}

/* ─── ВСПОМОГАТЕЛЬНЫЕ ───────────────────────── */

// Показать один блок
function showBlock(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = id === "cart-layout" ? "grid" : "block";
}

// Скрыть все блоки корзины
function hideAllBlocks() {
    ["cart-guest", "cart-skeleton", "cart-empty", "cart-layout"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}