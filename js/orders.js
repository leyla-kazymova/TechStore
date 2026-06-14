/* =============================================
   TECHSTORE — ORDERS.JS
   История заказов пользователя
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(initOrders, 100);
});

function initOrders() {
    if (!currentUser) {
        showBlock("orders-guest");
        return;
    }
    showBlock("orders-skeleton");
    loadOrders();
}

/* ─── ЗАГРУЗКА ЗАКАЗОВ ──────────────────────── */

async function loadOrders() {
    const res = await apiGet("/api/orders/my.php");

    hideAllBlocks();

    if (!res.success) {
        showToast("Ошибка загрузки заказов", "error");
        return;
    }

    const orders = res.data;

    if (orders.length === 0) {
        showBlock("orders-empty");
        return;
    }

    renderOrders(orders);
}

/* ─── РЕНДЕР ЗАКАЗОВ ────────────────────────── */

function renderOrders(orders) {
    const list = document.getElementById("orders-list");
    list.innerHTML = orders.map(order => renderOrderCard(order)).join("");
    list.style.display = "flex";
}

function renderOrderCard(order) {
    // Строки товаров внутри заказа
    const itemsHtml = order.items.map(item => `
        <div class="order-item">
            <span class="order-item__name">${escapeHtml(item.product_name)}</span>
            <span class="order-item__qty">${item.quantity} шт.</span>
            <span class="order-item__price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("");

    return `
        <div class="order-card" id="order-${order.id}">
            <div class="order-card__head" onclick="toggleOrder(${order.id})">
                <div class="order-card__left">
                    <span class="order-card__num">Заказ №${order.id}</span>
                    <span class="order-card__date">${escapeHtml(formatDate(order.created_at))}</span>
                    ${getStatusBadge(order.status)}
                </div>
                <div class="order-card__right">
                    <span class="order-card__price">${formatPrice(order.total_price)}</span>
                    <span class="order-card__arrow">▼</span>
                </div>
            </div>
            <div class="order-card__body">
                <p class="order-card__items-title">Состав заказа</p>
                ${itemsHtml}
                <div class="order-card__total">
                    <span>Итого:</span>
                    <span>${formatPrice(order.total_price)}</span>
                </div>
            </div>
        </div>
    `;
}

/* ─── РАСКРЫТЬ / СКРЫТЬ ЗАКАЗ ──────────────── */

function toggleOrder(orderId) {
    const card = document.getElementById("order-" + orderId);
    if (card) card.classList.toggle("open");
}

/* ─── ВСПОМОГАТЕЛЬНЫЕ ───────────────────────── */

function showBlock(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
}

function hideAllBlocks() {
    ["orders-guest", "orders-skeleton", "orders-empty"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}