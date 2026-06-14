/* =============================================
   TECHSTORE — ADMIN.JS
   Панель администратора
   ============================================= */

let ordersInterval = null; // таймер live-обновления заказов
let editingProductId = null; // id товара при редактировании

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(initAdmin, 100);
});

function initAdmin() {
    // Проверяем что пользователь — администратор
    if (!currentUser || currentUser.role !== "admin") {
        document.getElementById("admin-denied").style.display = "block";
        return;
    }

    document.getElementById("admin-panel").style.display = "block";

    // Загружаем данные первой вкладки
    loadAdminOrders();
    startOrdersLive();

    // Загружаем категории для select в форме товаров
    loadCategoriesForSelect();
}

/* ─── ВКЛАДКИ ───────────────────────────────── */

function switchAdminTab(tab, btn) {
    // Убираем active со всех вкладок
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("admin-tab--active"));
    btn.classList.add("admin-tab--active");

    // Скрываем все панели
    ["pane-orders", "pane-products", "pane-categories"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });

    // Показываем нужную
    document.getElementById("pane-" + tab).style.display = "block";

    // Останавливаем live если ушли с заказов
    if (tab !== "orders") {
        stopOrdersLive();
    } else {
        loadAdminOrders();
        startOrdersLive();
    }

    // Загружаем данные нужной вкладки
    if (tab === "products")   loadAdminProducts();
    if (tab === "categories") loadAdminCategories();
}

/* ══════════════════════════════════════════════
   ЗАКАЗЫ
══════════════════════════════════════════════ */

function startOrdersLive() {
    stopOrdersLive();
    ordersInterval = setInterval(loadAdminOrders, 5000);
}

function stopOrdersLive() {
    if (ordersInterval) {
        clearInterval(ordersInterval);
        ordersInterval = null;
    }
}

async function loadAdminOrders() {
    const res = await apiGet("/api/orders/admin_list.php");

    if (!res.success) return;

    const orders = res.data;

    // Обновляем бейдж счётчика
    const badge = document.getElementById("orders-badge");
    if (badge) badge.textContent = orders.length;

    const tbody = document.getElementById("orders-tbody");
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:24px">Заказов пока нет</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr class="${order.status === "Новый" ? "tr-new" : ""}">
            <td>#${order.id}</td>
            <td>
                <div style="font-weight:600">${escapeHtml(order.user_name)}</div>
                <div style="font-size:12px;color:var(--color-muted)">${escapeHtml(order.user_email)}</div>
            </td>
            <td style="white-space:nowrap">${formatDate(order.created_at)}</td>
            <td style="font-weight:600;white-space:nowrap">${formatPrice(order.total_price)}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="td-actions">
                    <select class="status-select" id="status-${order.id}">
                        <option value="Новый"       ${order.status === "Новый"       ? "selected" : ""}>Новый</option>
                        <option value="В обработке" ${order.status === "В обработке" ? "selected" : ""}>В обработке</option>
                        <option value="Отправлен"   ${order.status === "Отправлен"   ? "selected" : ""}>Отправлен</option>
                        <option value="Доставлен"   ${order.status === "Доставлен"   ? "selected" : ""}>Доставлен</option>
                        <option value="Отменён"     ${order.status === "Отменён"     ? "selected" : ""}>Отменён</option>
                    </select>
                    <button class="btn btn--primary btn--sm" onclick="updateOrderStatus(${order.id})">
                        Сохранить
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function updateOrderStatus(orderId) {
    const select = document.getElementById("status-" + orderId);
    const status = select.value;

    const res = await apiPost("/api/orders/update_status.php", {
        order_id: orderId,
        status:   status
    });

    if (res.success) {
        showToast("Статус обновлён", "success");
        loadAdminOrders();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* ══════════════════════════════════════════════
   ТОВАРЫ
══════════════════════════════════════════════ */

async function loadAdminProducts() {
    const res = await apiGet("/api/products/list.php");
    if (!res.success) return;

    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;

    if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:24px">Товаров нет</td></tr>`;
        return;
    }

    tbody.innerHTML = res.data.map(p => `
        <tr>
            <td style="color:var(--color-muted)">${p.id}</td>
            <td style="font-weight:600">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category_name)}</td>
            <td style="white-space:nowrap">${formatPrice(p.price)}</td>
            <td>${p.quantity}</td>
            <td>
                <div class="td-actions">
                    <button class="btn btn--outline btn--sm" onclick="editProduct(${p.id})">Редактировать</button>
                    <button class="btn btn--danger btn--sm"  onclick="deleteProduct(${p.id})">Удалить</button>
                </div>
            </td>
        </tr>
    `).join("");
}

/* Загрузить категории в select формы товара */
async function loadCategoriesForSelect() {
    const res = await apiGet("/api/categories/list.php");
    if (!res.success) return;

    const select = document.getElementById("product-category-input");
    if (!select) return;

    // Оставляем первый пустой option
    select.innerHTML = `<option value="">Выберите категорию</option>`;

    res.data.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

/* Отправить форму товара (добавить или обновить) */
async function submitProduct(event) {
    event.preventDefault();

    const name     = document.getElementById("product-name-input").value.trim();
    const catId    = document.getElementById("product-category-input").value;
    const price    = document.getElementById("product-price-input").value;
    const qty      = document.getElementById("product-qty-input").value;
    const desc     = document.getElementById("product-desc-input").value.trim();
    const imageFile= document.getElementById("product-image-input").files[0];
    const btn      = document.getElementById("product-submit-btn");

    if (!name || !catId || !price) {
        showToast("Заполните обязательные поля", "error");
        return;
    }

    const formData = new FormData();
    formData.append("name",        name);
    formData.append("category_id", catId);
    formData.append("price",       price);
    formData.append("quantity",    qty || 0);
    formData.append("description", desc);
    if (imageFile) formData.append("image", imageFile);

    btn.disabled    = true;
    btn.textContent = "Сохраняем...";

    let res;

    if (editingProductId) {
        // Обновляем существующий товар
        formData.append("id", editingProductId);
        res = await apiPostForm("/api/products/update.php", formData);
    } else {
        // Добавляем новый
        res = await apiPostForm("/api/products/create.php", formData);
    }

    btn.disabled    = false;
    btn.textContent = editingProductId ? "Сохранить изменения" : "Добавить товар";

    if (res.success) {
        showToast(res.message, "success");
        cancelProductEdit();
        loadAdminProducts();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* Заполнить форму для редактирования товара */
async function editProduct(productId) {
    const res = await apiGet(`/api/products/one.php?id=${productId}`);
    if (!res.success) return;

    const p = res.data;
    editingProductId = productId;

    document.getElementById("product-id").value           = p.id;
    document.getElementById("product-name-input").value   = p.name;
    document.getElementById("product-category-input").value = p.category_id;
    document.getElementById("product-price-input").value  = p.price;
    document.getElementById("product-qty-input").value    = p.quantity;
    document.getElementById("product-desc-input").value   = p.description || "";

    // Показываем текущую картинку если есть
    const hint = document.getElementById("current-image-hint");
    if (p.image) {
        hint.textContent    = "Текущая картинка: " + p.image + ". Загрузите новую чтобы заменить.";
        hint.style.display  = "block";
    } else {
        hint.style.display  = "none";
    }

    document.getElementById("product-form-title").textContent  = "Редактировать товар";
    document.getElementById("product-submit-btn").textContent   = "Сохранить изменения";
    document.getElementById("product-cancel-btn").style.display = "inline-flex";

    // Прокручиваем к форме
    document.getElementById("product-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Сбросить форму товара */
function cancelProductEdit() {
    editingProductId = null;
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value                 = "";
    document.getElementById("product-form-title").textContent   = "Добавить товар";
    document.getElementById("product-submit-btn").textContent   = "Добавить товар";
    document.getElementById("product-cancel-btn").style.display = "none";
    document.getElementById("current-image-hint").style.display = "none";
}

/* Удалить товар */
async function deleteProduct(productId) {
    if (!confirm("Удалить этот товар? Это действие нельзя отменить.")) return;

    const res = await apiPost("/api/products/delete.php", { id: productId });

    if (res.success) {
        showToast("Товар удалён", "success");
        loadAdminProducts();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* ══════════════════════════════════════════════
   КАТЕГОРИИ
══════════════════════════════════════════════ */

async function loadAdminCategories() {
    const res = await apiGet("/api/categories/list.php");
    if (!res.success) return;

    const tbody = document.getElementById("categories-tbody");
    if (!tbody) return;

    if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--color-muted);padding:24px">Категорий нет</td></tr>`;
        return;
    }

    tbody.innerHTML = res.data.map(cat => `
        <tr>
            <td style="color:var(--color-muted)">${cat.id}</td>
            <td style="font-weight:600">${escapeHtml(cat.name)}</td>
            <td>
                <div class="td-actions">
                    <button class="btn btn--outline btn--sm" onclick="editCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')">Редактировать</button>
                    <button class="btn btn--danger btn--sm"  onclick="deleteCategory(${cat.id})">Удалить</button>
                </div>
            </td>
        </tr>
    `).join("");
}

/* Отправить форму категории */
async function submitCategory(event) {
    event.preventDefault();

    const id   = document.getElementById("category-id").value;
    const name = document.getElementById("category-name-input").value.trim();
    const btn  = document.getElementById("category-submit-btn");

    if (!name) {
        showToast("Введите название", "error");
        return;
    }

    btn.disabled    = true;
    btn.textContent = "Сохраняем...";

    let res;
    if (id) {
        res = await apiPost("/api/categories/update.php", { id, name });
    } else {
        res = await apiPost("/api/categories/create.php", { name });
    }

    btn.disabled    = false;
    btn.textContent = id ? "Сохранить" : "Добавить";

    if (res.success) {
        showToast(res.message, "success");
        cancelCategoryEdit();
        loadAdminCategories();
        loadCategoriesForSelect(); // обновляем select в форме товаров
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}

/* Заполнить форму для редактирования категории */
function editCategory(id, name) {
    document.getElementById("category-id").value          = id;
    document.getElementById("category-name-input").value  = name;
    document.getElementById("category-form-title").textContent  = "Редактировать категорию";
    document.getElementById("category-submit-btn").textContent  = "Сохранить";
    document.getElementById("category-cancel-btn").style.display= "inline-flex";
}

/* Сбросить форму категории */
function cancelCategoryEdit() {
    document.getElementById("category-id").value                 = "";
    document.getElementById("category-name-input").value         = "";
    document.getElementById("category-form-title").textContent   = "Добавить категорию";
    document.getElementById("category-submit-btn").textContent   = "Добавить";
    document.getElementById("category-cancel-btn").style.display = "none";
}

/* Удалить категорию */
async function deleteCategory(id) {
    if (!confirm("Удалить категорию? Все товары в ней тоже будут удалены.")) return;

    const res = await apiPost("/api/categories/delete.php", { id });

    if (res.success) {
        showToast("Категория удалена", "success");
        loadAdminCategories();
        loadCategoriesForSelect();
    } else {
        showToast(res.message || "Ошибка", "error");
    }
}