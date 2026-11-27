/**
 * 物理单位与数值格式化。
 * 单位是符号，不参与翻译；语言文件里只放标签和 {value} 占位。
 */

/** 剂量单位。 */
const DOSE = 'μSv';

/** 辐射强度单位。 */
const DOSE_RATE = 'μSv/h';

/**
 * 玩家剂量：内部单位是 1/60 μSv，显示成整数 μSv。
 * @param {number} value
 */
function dose(value) {
    return `${Math.floor((Number(value) || 0) / 60)} ${DOSE}`;
}

/**
 * 当地辐射强度。
 * @param {number} value
 */
function doseRate(value) {
    return `${Math.round(Number(value) || 0)} ${DOSE_RATE}`;
}

module.exports = {DOSE, DOSE_RATE, dose, doseRate};
