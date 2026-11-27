const {t} = require('#/i18n');

/**
 * 物品定义：id -> {nameKey}。
 * 新物品在这里加一条，再在语言文件里写 nameKey 对应的文本。
 * 例：canned_food: {nameKey: 'item.canned_food'}
 */
const ITEMS = {};

/**
 * 物品显示名；没定义的 id 原样显示。
 * @param {string} id
 */
function nameOf(id) {
    const def = ITEMS[id];
    return def === undefined ? String(id) : t(def.nameKey);
}

module.exports = {ITEMS, nameOf};
