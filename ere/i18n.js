const era = require('#/era-electron');

const DEFAULT_LOCALE = 'zh-CN';

const locales = {
    'zh-CN': require('#/data/locales/zh-CN.json')
};

/** 当前语言代码。 */
function currentLocale() {
    const stored = era.get("Flags:locale");
    return typeof stored === 'string' && stored.length > 0 ? stored : DEFAULT_LOCALE;
}

/**
 * 切换语言（同时写进存档）。
 * @param {string} code 例如 'zh-CN'
 */
function setLocale(code) {
    era.set("Flags:locale", code);
}

/**
 * 取文本。
 * - 系统文本用点分键，例如 'ui.status'；
 * - 地图节点直接传原文，例如 'Tereza St.'，没翻译时原样返回；
 * - 缺键时返回键本身，点分键会告警。
 * @param {string} key
 * @param {object} [params] 形如 {name: '...'} 的占位符
 */
function t(key, params) {
    const table = locales[currentLocale()] || locales[DEFAULT_LOCALE];
    let text = table[key];
    if (text === undefined) {
        text = key;
        if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/.test(key)) {
            console.warn(`[i18n] 缺少文本：${key}`);
        }
    }
    if (params) {
        text = text.replace(/\{(\w+)\}/g, (match, name) =>
            (params[name] === undefined ? match : String(params[name])));
    }
    return text;
}

module.exports = {t, setLocale, currentLocale, DEFAULT_LOCALE};
