/* =============================================
   TECHSTORE — AUTH.JS
   Авторизация, регистрация, состояние пользователя
   ============================================= */

// Текущий пользователь — доступен из любого JS-файла
let currentUser = null;

/* ─── ИНИЦИАЛИЗАЦИЯ ─────────────────────────── */

// Вызывается автоматически при загрузке каждой страницы.
// Проверяет сессию на сервере и обновляет шапку.
async function checkAuth() {
    const res = await apiGet("/api/auth/me.php");

    if (res.success) {
        currentUser = res.data;
    } else {
        currentUser = null;
    }

    renderHeader();
    updateCartCount();
}

/* ─── ШАПКА ─────────────────────────────────── */

// Переключает шапку в зависимости от того, залогинен ли пользователь
function renderHeader() {
    const btnLogin       = document.getElementById("btn-login");
    const userBlock      = document.getElementById("user-block");
    const userName       = document.getElementById("user-name");
    const btnAdmin       = document.getElementById("btn-admin");
    const navOrders      = document.getElementById("nav-orders");

    // Мобильные элементы
    const mobileBtnLogin  = document.getElementById("mobile-btn-login");
    const mobileUserBlock = document.getElementById("mobile-user-block");
    const mobileUserName  = document.getElementById("mobile-user-name");
    const mobileNavOrders = document.getElementById("mobile-nav-orders");
    const mobileNavAdmin  = document.getElementById("mobile-nav-admin");

    if (currentUser) {
        // — Пользователь залогинен —

        // Прячем кнопку "Войти", показываем блок пользователя
        if (btnLogin)  btnLogin.style.display  = "none";
        if (userBlock) userBlock.style.display = "flex";
        if (userName)  userName.textContent    = currentUser.name;

        // Показываем "Мои заказы"
        if (navOrders) navOrders.style.display = "block";

        // Если администратор — показываем кнопку "Админ"
        if (currentUser.role === "admin") {
            if (btnAdmin)     btnAdmin.style.display     = "inline-flex";
            if (mobileNavAdmin) mobileNavAdmin.style.display = "block";
        }

        // Мобильная шапка
        if (mobileBtnLogin)  mobileBtnLogin.style.display  = "none";
        if (mobileUserBlock) mobileUserBlock.style.display = "flex";
        if (mobileUserName)  mobileUserName.textContent    = currentUser.name;
        if (mobileNavOrders) mobileNavOrders.style.display = "block";

    } else {
        // — Гость —

        if (btnLogin)  btnLogin.style.display  = "inline-flex";
        if (userBlock) userBlock.style.display = "none";
        if (navOrders) navOrders.style.display = "none";
        if (btnAdmin)  btnAdmin.style.display  = "none";

        // Мобильная шапка
        if (mobileBtnLogin)  mobileBtnLogin.style.display  = "inline-flex";
        if (mobileUserBlock) mobileUserBlock.style.display = "none";
        if (mobileNavOrders) mobileNavOrders.style.display = "none";
        if (mobileNavAdmin)  mobileNavAdmin.style.display  = "none";
    }
}

/* ─── СЧЁТЧИК КОРЗИНЫ ───────────────────────── */

// Обновляет цифру на иконке корзины в шапке
async function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    if (!countEl) return;

    if (!currentUser) {
        countEl.textContent = "0";
        countEl.classList.remove("visible");
        return;
    }

    const res = await apiGet("/api/cart/list.php");

    if (res.success && res.data.items.length > 0) {
        const total = res.data.items.reduce((sum, item) => sum + Number(item.quantity), 0);
        countEl.textContent = total;
        countEl.classList.add("visible");
    } else {
        countEl.textContent = "0";
        countEl.classList.remove("visible");
    }
}

/* ─── МОДАЛЬНОЕ ОКНО ────────────────────────── */

function openModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) {
        overlay.classList.add("open");
        document.body.style.overflow = "hidden"; // запрещаем скролл страницы
    }
    clearModalMessage();
    switchTab("login");
}

function closeModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
    }
    clearModalMessage();
    // Очищаем поля форм
    const loginForm    = document.getElementById("form-login");
    const registerForm = document.getElementById("form-register");
    if (loginForm)    loginForm.reset();
    if (registerForm) registerForm.reset();
}

// Закрыть модалку при клике на тёмный фон (не на само окно)
function handleOverlayClick(event) {
    if (event.target === document.getElementById("modal-overlay")) {
        closeModal();
    }
}

// Закрыть модалку по клавише Escape
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeModal();
});

/* ─── ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ──────────────────── */

function switchTab(tab) {
    const tabLogin    = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin   = document.getElementById("form-login");
    const formRegister= document.getElementById("form-register");

    if (!tabLogin || !formLogin) return;

    clearModalMessage();

    if (tab === "login") {
        tabLogin.classList.add("modal__tab--active");
        tabRegister.classList.remove("modal__tab--active");
        formLogin.style.display    = "flex";
        formRegister.style.display = "none";
    } else {
        tabRegister.classList.add("modal__tab--active");
        tabLogin.classList.remove("modal__tab--active");
        formRegister.style.display = "flex";
        formLogin.style.display    = "none";
    }
}

/* ─── СООБЩЕНИЯ В МОДАЛКЕ ───────────────────── */

function showModalMessage(text, type = "error") {
    const el = document.getElementById("modal-message");
    if (!el) return;
    el.textContent = text;
    el.className   = "modal__message modal__message--" + type;
    el.style.display = "block";
}

function clearModalMessage() {
    const el = document.getElementById("modal-message");
    if (el) {
        el.style.display = "none";
        el.textContent   = "";
    }
}

/* ─── ФОРМА ВХОДА ───────────────────────────── */

async function submitLogin(event) {
    event.preventDefault();

    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn      = document.getElementById("login-submit");

    if (!email || !password) {
        showModalMessage("Заполните все поля");
        return;
    }

    // Показываем загрузку на кнопке
    btn.disabled          = true;
    btn.querySelector("span").textContent = "Входим...";

    const res = await apiPost("/api/auth/login.php", { email, password });

    btn.disabled = false;
    btn.querySelector("span").textContent = "Войти";

    if (res.success) {
        currentUser = res.data;
        renderHeader();
        updateCartCount();
        closeModal();
        showToast("Добро пожаловать, " + currentUser.name + "!", "success");

        // Если пользователь на странице корзины или заказов — перезагружаем данные
        if (typeof loadCart    === "function") loadCart();
        if (typeof loadOrders  === "function") loadOrders();

    } else {
        showModalMessage(res.message || "Ошибка входа");
    }
}

/* ─── ФОРМА РЕГИСТРАЦИИ ─────────────────────── */

async function submitRegister(event) {
    event.preventDefault();

    const name     = document.getElementById("reg-name").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const btn      = document.getElementById("register-submit");

    if (!name || !email || !password) {
        showModalMessage("Заполните все поля");
        return;
    }

    if (password.length < 6) {
        showModalMessage("Пароль должен быть не менее 6 символов");
        return;
    }

    btn.disabled = true;
    btn.querySelector("span").textContent = "Регистрируем...";

    const res = await apiPost("/api/auth/register.php", { name, email, password });

    btn.disabled = false;
    btn.querySelector("span").textContent = "Зарегистрироваться";

    if (res.success) {
        // После регистрации сразу логиним
        showModalMessage("Регистрация успешна! Выполняем вход...", "success");

        const loginRes = await apiPost("/api/auth/login.php", { email, password });

        if (loginRes.success) {
            currentUser = loginRes.data;
            renderHeader();
            updateCartCount();
            closeModal();
            showToast("Добро пожаловать, " + currentUser.name + "!", "success");
        } else {
            // Если автологин не сработал — просто переключаем на вкладку входа
            switchTab("login");
            showModalMessage("Теперь войдите в аккаунт", "success");
        }

    } else {
        showModalMessage(res.message || "Ошибка регистрации");
    }
}

/* ─── ВЫХОД ─────────────────────────────────── */

async function logout() {
    await apiPost("/api/auth/logout.php");

    currentUser = null;
    renderHeader();
    updateCartCount();
    showToast("Вы вышли из аккаунта");

    // Если пользователь на защищённой странице — редирект на главную
    const protectedPages = ["cart.html", "orders.html", "admin.html"];
    const currentPage    = window.location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage)) {
        window.location.href = "index.html";
    }
}

/* ─── МОБИЛЬНОЕ МЕНЮ ────────────────────────── */

function toggleMenu() {
    const menu   = document.getElementById("mobile-menu");
    const burger = document.getElementById("burger");
    if (menu)   menu.classList.toggle("open");
    if (burger) burger.classList.toggle("active");
}

// Добавляем тень шапке при скролле
window.addEventListener("scroll", function() {
    const header = document.getElementById("header");
    if (header) {
        header.classList.toggle("scrolled", window.scrollY > 10);
    }
});

/* ─── TOAST-УВЕДОМЛЕНИЕ ─────────────────────── */

let toastTimer = null;

// type: "success" | "error" | "info"
function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    // Сбрасываем предыдущий таймер если toast уже показан
    if (toastTimer) clearTimeout(toastTimer);

    toast.textContent = message;
    toast.className   = "toast toast--" + type + " show";

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* ─── ЗАПУСК ────────────────────────────────── */

// Запускаем проверку авторизации сразу при загрузке страницы
document.addEventListener("DOMContentLoaded", checkAuth);