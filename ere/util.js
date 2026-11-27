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
    formatRadiation,
    formatLocalTime,
};
