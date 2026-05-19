// Точка входа: связывает модули генерации, хранилища и UI.

import { generatePassword, estimateStrength } from "./generator.js";
import {
    loadHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
} from "./storage.js";
import {
    activateTab,
    updateStrengthIndicator,
    showToast,
    renderHistory,
    getFilteredHistory,
    copyToClipboard,
} from "./ui.js";

// === Состояние приложения ===
const state = {
    history: loadHistory(),
    historyView: {
        search: "",
        filter: "all",
        sort: "date-desc",
    },
};

// === DOM-элементы ===
const els = {
    form: document.getElementById("generator-form"),
    output: document.getElementById("password-output"),
    copyBtn: document.getElementById("copy-btn"),
    lengthRange: document.getElementById("length"),
    lengthValue: document.getElementById("length-value"),
    lengthInput: document.getElementById("length-input"),
    lengthError: document.getElementById("length-error"),
    optUpper: document.getElementById("opt-upper"),
    optLower: document.getElementById("opt-lower"),
    optDigits: document.getElementById("opt-digits"),
    optSymbols: document.getElementById("opt-symbols"),
    optExcludeSimilar: document.getElementById("opt-exclude-similar"),
    optionsError: document.getElementById("options-error"),
    tabs: document.querySelectorAll(".tab"),
    search: document.getElementById("search"),
    sort: document.getElementById("sort"),
    filter: document.getElementById("filter"),
    clearBtn: document.getElementById("clear-history"),
};

// === Валидация ===
function validateLength(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 4 || num > 64) {
        return "Длина должна быть целым числом от 4 до 64.";
    }
    return "";
}

function getOptions() {
    return {
        length: Number(els.lengthInput.value),
        upper: els.optUpper.checked,
        lower: els.optLower.checked,
        digits: els.optDigits.checked,
        symbols: els.optSymbols.checked,
        excludeSimilar: els.optExcludeSimilar.checked,
    };
}

function validateOptions(opts) {
    if (!opts.upper && !opts.lower && !opts.digits && !opts.symbols) {
        return "Выберите хотя бы один набор символов.";
    }
    return "";
}

// === Обработчики событий ===
function syncLengthInputs(source) {
    const value = source.value;
    els.lengthRange.value = value;
    els.lengthInput.value = value;
    els.lengthValue.textContent = value;

    const err = validateLength(value);
    els.lengthError.textContent = err;
}

function handleGenerate(e) {
    e.preventDefault();

    const opts = getOptions();
    const lengthErr = validateLength(opts.length);
    const optsErr = validateOptions(opts);

    els.lengthError.textContent = lengthErr;
    els.optionsError.textContent = optsErr;

    if (lengthErr || optsErr) {
        showToast("Исправьте ошибки в форме", "error");
        return;
    }

    try {
        const password = generatePassword(opts);
        const strength = estimateStrength(password);

        els.output.value = password;
        updateStrengthIndicator(strength);

        state.history = addToHistory(state.history, password, strength);
        refreshHistoryView();

        showToast("Пароль сгенерирован ✓", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleCopyCurrent() {
    const value = els.output.value;
    if (!value) {
        showToast("Сначала сгенерируйте пароль", "error");
        return;
    }
    const ok = await copyToClipboard(value);
    showToast(ok ? "Скопировано в буфер ✓" : "Не удалось скопировать", ok ? "success" : "error");
}

async function handleCopyFromHistory(password) {
    const ok = await copyToClipboard(password);
    showToast(ok ? "Скопировано ✓" : "Не удалось скопировать", ok ? "success" : "error");
}

function handleDeleteFromHistory(id) {
    state.history = removeFromHistory(state.history, id);
    refreshHistoryView();
    showToast("Удалено", "success");
}

function handleClearHistory() {
    if (state.history.length === 0) return;
    if (!confirm("Очистить всю историю паролей?")) return;
    state.history = clearHistory();
    refreshHistoryView();
    showToast("История очищена", "success");
}

function refreshHistoryView() {
    const filtered = getFilteredHistory(state.history, state.historyView);
    renderHistory(filtered, {
        onCopy: handleCopyFromHistory,
        onDelete: handleDeleteFromHistory,
    });
}

// === Инициализация ===
function init() {
    // Вкладки.
    els.tabs.forEach((tab) => {
        tab.addEventListener("click", () => activateTab(tab.dataset.tab));
    });

    // Синхронизация ползунка и числового поля.
    els.lengthRange.addEventListener("input", () => syncLengthInputs(els.lengthRange));
    els.lengthInput.addEventListener("input", () => syncLengthInputs(els.lengthInput));

    // Генерация и копирование.
    els.form.addEventListener("submit", handleGenerate);
    els.copyBtn.addEventListener("click", handleCopyCurrent);

    // Управление историей.
    els.search.addEventListener("input", (e) => {
        state.historyView.search = e.target.value;
        refreshHistoryView();
    });
    els.sort.addEventListener("change", (e) => {
        state.historyView.sort = e.target.value;
        refreshHistoryView();
    });
    els.filter.addEventListener("change", (e) => {
        state.historyView.filter = e.target.value;
        refreshHistoryView();
    });
    els.clearBtn.addEventListener("click", handleClearHistory);

    // Стартовый рендеринг.
    refreshHistoryView();
    updateStrengthIndicator(null);
}

init();
