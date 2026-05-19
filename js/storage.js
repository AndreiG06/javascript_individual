// Модуль работы с историей паролей в localStorage.

const STORAGE_KEY = "pwd-generator:history";
const MAX_ITEMS = 50;

/**
 * Загружает историю из localStorage.
 * @returns {Array<{id:string, password:string, strength:string, createdAt:number}>}
 */
export function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Сохраняет историю в localStorage.
 * @param {Array} history
 */
export function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.warn("Не удалось сохранить историю:", err);
    }
}

/**
 * Добавляет новый пароль в начало истории и обрезает её до MAX_ITEMS.
 * @param {Array} history
 * @param {string} password
 * @param {string} strength
 * @returns {Array} Новая история.
 */
export function addToHistory(history, password, strength) {
    const entry = {
        id: crypto.randomUUID(),
        password,
        strength,
        createdAt: Date.now(),
    };
    const updated = [entry, ...history].slice(0, MAX_ITEMS);
    saveHistory(updated);
    return updated;
}

/**
 * Удаляет запись по id.
 * @param {Array} history
 * @param {string} id
 * @returns {Array}
 */
export function removeFromHistory(history, id) {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    return updated;
}

/**
 * Полностью очищает историю.
 */
export function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    return [];
}
