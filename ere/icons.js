/**
 * 选项前的小图标与资源位置。
 *
 * 每个可点击选项都带一个 rl 字段（resource location），存图片的注册名：
 *   rl: 'shop'   用注册名 shop，找不到回退 default
 *   rl: false    不要图标
 *   rl 不写      用 default
 *
 * 图片要先在 res 同目录的 csv 里注册；引擎会用 `\t` 分隔的多个名字逐个尝试。
 */
const DEFAULT_ICON = 'default';

/** 图标占的列数。 */
const WIDTH = 1;

/**
 * 选项的 rl → 实际资源名；不要图标时返回 null。
 * @param {string|boolean|undefined} rl
 */
function resourceOf(rl) {
    if (rl === false) {
        return null;
    }
    return typeof rl === 'string' && rl.trim().length > 0 ? rl : DEFAULT_ICON;
}

/**
 * 生成图标网格单元。
 * @param {string|null} name 资源名
 * @param {number} [width]
 */
function cell(name, width) {
    if (name === null || name === undefined) {
        return null;
    }
    return {
        type: 'image.whole',
        names: name === DEFAULT_ICON ? name : `${name}\t${DEFAULT_ICON}`,
        config: {width: width || 1, fit: 'contain'}
    };
}

module.exports = {DEFAULT_ICON, WIDTH, resourceOf, cell};
