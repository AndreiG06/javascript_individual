// Модуль UI: управление DOM, рендеринг и уведомления.

const STRENGTH_LABELS = {
    weak: "Слабый",
    medium: "Средний",
    strong: "Надёжный",
};

/**
 * Переключает активную вкладку.
 * @param {string} tabName
 */
export function activateTab(tabName) {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("tab--active", tab.dataset.tab === tabName);
    });
    document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.toggle("panel--active", panel.id === tabName);
    });
}

/**
 * Обновляет визуализацию надёжности пароля.
 * @param {"weak"|"medium"|"strong"|null} strength
 */
export function updateStrengthIndicator(strength) {
    const fill = document.getElementById("strength-fill");
    const label = document.getElementById("strength-label");

    fill.className = "strength__fill";
    if (!strength) {
        label.textContent = "—";
        return;
    }

    fill.classList.add(`strength__fill--${strength}`);
    label.textContent = STRENGTH_LABELS[strength];
}

/**
 * Показывает кратковременное уведомление.
 * @param {string} message
 * @param {"success"|"error"|""} type
 */
let toastTimer = null;
export function showToast(message, type = "") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast toast--show";
    if (type) toast.classList.add(`toast--${type}`);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = "toast";
    }, 2200);
}

/**
 * Форматирует timestamp в читаемую дату.
 */
function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Отрисовывает список истории.
 * @param {Array} items
 * @param {{onCopy: Function, onDelete: Function}} handlers
 */
export function renderHistory(items, handlers) {
    const list = document.getElementById("history-list");
    const empty = document.getElementById("history-empty");

    list.innerHTML = "";

    if (items.length === 0) {
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "history-item";
        li.dataset.id = item.id;

        const pwd = document.createElement("span");
        pwd.className = "history-item__pwd";
        pwd.textContent = item.password;

        const meta = document.createElement("div");
        meta.className = "history-item__meta";
        meta.innerHTML = `
            <span class="badge badge--${item.strength}">${STRENGTH_LABELS[item.strength]}</span>
            <div>${formatDate(item.createdAt)}</div>
        `;

        const actions = document.createElement("div");
        actions.className = "history-item__actions";

        const copyBtn = document.createElement("button");
        copyBtn.className = "icon-btn";
        copyBtn.title = "Копировать";
        copyBtn.textContent = "📋";
        copyBtn.addEventListener("click", () => handlers.onCopy(item.password));

        const delBtn = document.createElement("button");
        delBtn.className = "icon-btn";
        delBtn.title = "Удалить";
        delBtn.textContent = "🗑";
        delBtn.addEventListener("click", () => handlers.onDelete(item.id));

        actions.append(copyBtn, delBtn);
        li.append(pwd, meta, actions);
        fragment.append(li);
    });

    list.append(fragment);
}

/**
 * Применяет фильтр, поиск и сортировку к истории.
 * @param {Array} history
 * @param {{search:string, filter:string, sort:string}} state
 */
export function getFilteredHistory(history, { search, filter, sort }) {
    const strengthOrder = { weak: 0, medium: 1, strong: 2 };

    let result = [...history];

    // Фильтрация по уровню надёжности.
    if (filter !== "all") {
        result = result.filter((item) => item.strength === filter);
    }

    // Поиск по подстроке.
    const q = search.trim().toLowerCase();
    if (q) {
        result = result.filter((item) =>
            item.password.toLowerCase().includes(q)
        );
    }

    // Сортировка.
    switch (sort) {
        case "date-asc":
            result.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case "date-desc":
            result.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case "strength-asc":
            result.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);
            break;
        case "strength-desc":
            result.sort((a, b) => strengthOrder[b.strength] - strengthOrder[a.strength]);
            break;
        case "length-asc":
            result.sort((a, b) => a.password.length - b.password.length);
            break;
        case "length-desc":
            result.sort((a, b) => b.password.length - a.password.length);
            break;
    }

    return result;
}

/**
 * Копирует строку в буфер обмена с фоллбэком на старый API.
 * @param {string} text
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback для file:// и старых браузеров.
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        textarea.remove();
        return ok;
    } catch {
        return false;
    }
}
