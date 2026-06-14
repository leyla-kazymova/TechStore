/* =============================================
   TECHSTORE — API.JS
   Обёртки для всех запросов к бэкенду
   ============================================= */

/**
 * GET-запрос
 * Используется для получения данных (товары, категории, корзина и т.д.)
 *
 * Пример:
 *   const res = await apiGet("/api/products/list.php");
 *   const res = await apiGet("/api/products/list.php?category_id=3");
 */

const BASE = "/TechStore";
async function apiGet(url) {
    try {
        const response = await fetch(BASE + url, {
            method: "GET",
            credentials: "same-origin"   // передаём куки сессии (важно для авторизации)
        });

        if (!response.ok) {
            return { success: false, message: "Ошибка сети: " + response.status };
        }

        return await response.json();

    } catch (error) {
        console.error("apiGet error:", url, error);
        return { success: false, message: "Нет соединения с сервером" };
    }
}

/**
 * POST-запрос с JSON
 * Используется для большинства операций (логин, регистрация, смена статуса и т.д.)
 *
 * Пример:
 *   const res = await apiPost("/api/auth/login.php", { email, password });
 *   const res = await apiPost("/api/cart/add.php", { product_id: 1, quantity: 1 });
 */
async function apiPost(url, data = {}) {
    try {
        const response = await fetch(BASE + url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return { success: false, message: "Ошибка сети: " + response.status };
        }

        return await response.json();

    } catch (error) {
        console.error("apiPost error:", url, error);
        return { success: false, message: "Нет соединения с сервером" };
    }
}

/**
 * POST-запрос с FormData
 * Используется когда нужно загрузить файл (картинка товара)
 *
 * Пример:
 *   const form = new FormData();
 *   form.append("name", "iPhone");
 *   form.append("price", 79990);
 *   form.append("image", fileInput.files[0]);
 *   const res = await apiPostForm("/api/products/create.php", form);
 */
async function apiPostForm(url, formData) {
    try {
        const response = await fetch(BASE + url, {
            method: "POST",
            credentials: "same-origin",
            // НЕ ставим Content-Type — браузер сам добавит boundary для FormData
            body: formData
        });

        if (!response.ok) {
            return { success: false, message: "Ошибка сети: " + response.status };
        }

        return await response.json();

    } catch (error) {
        console.error("apiPostForm error:", url, error);
        return { success: false, message: "Нет соединения с сервером" };
    }
}

/**
 * Форматирование цены
 * Используется во всех местах где выводится цена товара
 *
 * Пример:
 *   formatPrice(79990)  →  "79 990 ₽"
 */
function formatPrice(price) {
    return Number(price).toLocaleString("ru-RU") + " ₽";
}

/**
 * Форматирование даты
 * Используется в заказах
 *
 * Пример:
 *   formatDate("2025-04-21 14:30:00")  →  "21 апр 2025, 14:30"
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString("ru-RU", {
        day:    "numeric",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit"
    });
}

/**
 * Получить URL картинки товара
 * Если картинка не загружена — возвращает null (покажем заглушку)
 *
 * Пример:
 *   getImageUrl("abc123.jpg")  →  "/uploads/abc123.jpg"
 *   getImageUrl(null)          →  null
 */
function getImageUrl(imageName) {
    if (!imageName) return null;
    return BASE + "/uploads/" + imageName;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Получить HTML бейджа статуса заказа
 *
 * Пример:
 *   getStatusBadge("Новый")       →  '<span class="status-badge status--new">Новый</span>'
 *   getStatusBadge("Доставлен")   →  '<span class="status-badge status--delivered">Доставлен</span>'
 */
function getStatusBadge(status) {
    const map = {
        "Новый":       "status--new",
        "В обработке": "status--processing",
        "Отправлен":   "status--sent",
        "Доставлен":   "status--delivered",
        "Отменён":     "status--cancelled"
    };
    const cls = map[status] || "status--new";
    return `<span class="status-badge ${cls}">${status}</span>`;
}