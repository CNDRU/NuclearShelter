const {t} = require('#/i18n');

function deserializePos(pos) {
    const raw = pos.split(',').map(Number);
    return [raw[0], raw[1]];
}

function serializePos(pos) {
    return `${pos[0]},${pos[1]}`;
}

/**
 * 耗时显示：15 → "0:15"；480 → "8:00"。
 * @param {number} minutes
 */
function formatCost(minutes) {
    const value = Math.max(0, Math.round(minutes));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

/**
 * 这段时间里累积的辐射量（内部单位：1/60 μSv）。
 * @param {number} minutes
 * @param {number} rate 当地辐射（μSv/h）
 */
function radiationGain(minutes, rate) {
    return Math.round(Number(rate) || 0) * Math.round(Number(minutes) || 0);
}

/**
 * 按钮上的「时间 + 辐射」：15 分钟、1 μSv/h → "0:15|辐射15"。
 * @param {number} minutes
 * @param {number} rate
 */
function formatMeta(minutes, rate) {
    return `${formatCost(minutes)}|${t('meta.radiation', {n: radiationGain(minutes, rate)})}`;
}

/**
 * 变化量 → 重复符号：+2 → "++"；-3 → "---"；0 → ""。
 * @param {number} delta
 */
function formatSigns(delta) {
    const value = Math.round(Number(delta) || 0);
    if (value === 0) {
        return '';
    }
    return (value > 0 ? '+' : '-').repeat(Math.abs(value));
}

/**
 * 辐射显示：整数 μSv，不带小数。
 * @param {number} value
 */
function formatRadiation(value) {
    return String(Math.round(Number(value) || 0));
}

/**
 * 格式化玩家电脑的本地时间，用于存档默认名。
 * @param {Date} [date]
 * @returns {string} 形如 "2026-11-26 20:53"
 */
function formatLocalTime(date) {
    const value = date || new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

module.exports = {
    serializePos,
    deserializePos,
    formatCost,
    radiationGain,
    formatMeta,
    formatSigns,
    formatRadiation,
    formatLocalTime,
};
