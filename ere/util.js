const titlePrefix = "-100";

/**
 * 动作系列的加速键前缀：每个系列一段，段内用 numberPrefix(前缀, 序号)。
 * 标题是 -100（-1000 ~ -1002），动作从 -200 起，下一个系列用 -300，依此类推。
 */
const actionPrefixes = {
    sleep: "-200"
};

function deserializePos(pos) {
    const raw = pos.split(',').map(Number);
    return [raw[0], raw[1]];
}

function serializePos(pos) {
    return `${pos[0]},${pos[1]}`;
}

function numberPrefix(prefix, num) {
    return Number(prefix + num);
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
    titlePrefix,
    actionPrefixes,
    serializePos,
    numberPrefix,
    deserializePos,
    formatLocalTime,
};
