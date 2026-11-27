const tones = require('#/tones');

/**
 * 体内剂量的颜色等级。
 * 阈值单位是 μSv；内部存储单位是 1/60 μSv，这里统一换算后再比较。
 * 从上往下匹配，取最后一个满足的等级。
 */
const LEVELS = [
    {min: 0, color: tones.COLORS.reminder},
    {min: 300, color: tones.COLORS.time},
    {min: 500, color: tones.COLORS.late},
    {min: 1000, color: tones.COLORS.missed}
];

/** 内部单位 → μSv。 */
function toMicro(units) {
    return Math.floor((Number(units) || 0) / 60);
}

/**
 * 按体内剂量取文字颜色。
 * @param {number} units 内部单位（1/60 μSv）
 */
function colorOf(units) {
    const value = toMicro(units);
    let color = LEVELS[0].color;
    for (const level of LEVELS) {
        if (value >= level.min) {
            color = level.color;
        }
    }
    return color;
}

module.exports = {LEVELS, colorOf};
