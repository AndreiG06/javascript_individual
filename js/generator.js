// Модуль генерации паролей.
// Использует криптографически стойкий генератор случайных чисел (Web Crypto API).

const CHARSETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.<>?/",
};

// Похожие символы, которые легко спутать.
const SIMILAR = "lI1O0o";

/**
 * Возвращает криптографически стойкое случайное целое число в диапазоне [0, max).
 * @param {number} max - Верхняя граница (не включительно).
 */
function secureRandomInt(max) {
    const array = new Uint32Array(1);
    // Отбраковываем значения, которые приведут к смещению (modulo bias).
    const limit = Math.floor(0xffffffff / max) * max;
    let value;
    do {
        crypto.getRandomValues(array);
        value = array[0];
    } while (value >= limit);
    return value % max;
}

/**
 * Перемешивает массив (алгоритм Фишера-Йетса).
 * @param {Array} arr
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Собирает итоговый набор символов с учётом опций.
 * @param {object} options
 * @returns {{ pool: string, mandatorySets: string[] }}
 */
function buildCharsetPool(options) {
    const { upper, lower, digits, symbols, excludeSimilar } = options;
    const exclude = (set) =>
        excludeSimilar
            ? [...set].filter((ch) => !SIMILAR.includes(ch)).join("")
            : set;

    const mandatorySets = [];
    let pool = "";

    if (upper)   { const s = exclude(CHARSETS.upper);   pool += s; mandatorySets.push(s); }
    if (lower)   { const s = exclude(CHARSETS.lower);   pool += s; mandatorySets.push(s); }
    if (digits)  { const s = exclude(CHARSETS.digits);  pool += s; mandatorySets.push(s); }
    if (symbols) { const s = exclude(CHARSETS.symbols); pool += s; mandatorySets.push(s); }

    return { pool, mandatorySets };
}

/**
 * Генерирует пароль по заданным опциям.
 * @param {object} options
 * @param {number} options.length - Длина пароля.
 * @param {boolean} options.upper - Включать заглавные.
 * @param {boolean} options.lower - Включать строчные.
 * @param {boolean} options.digits - Включать цифры.
 * @param {boolean} options.symbols - Включать спецсимволы.
 * @param {boolean} options.excludeSimilar - Исключать похожие символы.
 * @returns {string} Сгенерированный пароль.
 */
export function generatePassword(options) {
    const { pool, mandatorySets } = buildCharsetPool(options);

    if (!pool) {
        throw new Error("Не выбран ни один набор символов.");
    }
    if (options.length < mandatorySets.length) {
        throw new Error(
            `Длина пароля слишком мала для выбранных наборов (минимум ${mandatorySets.length}).`
        );
    }

    // Гарантируем по одному символу из каждого выбранного набора.
    const chars = mandatorySets.map(
        (set) => set[secureRandomInt(set.length)]
    );

    // Добиваем оставшуюся длину случайными символами из общего пула.
    while (chars.length < options.length) {
        chars.push(pool[secureRandomInt(pool.length)]);
    }

    return shuffle(chars).join("");
}

/**
 * Оценивает надёжность пароля.
 * Простая эвристика на основе длины и разнообразия классов символов.
 * @param {string} password
 * @returns {"weak" | "medium" | "strong"}
 */
export function estimateStrength(password) {
    if (!password) return "weak";

    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 3) return "weak";
    if (score <= 5) return "medium";
    return "strong";
}
