const era = require('#/era-electron');
const {t} = require('#/i18n');
const screen = require('#/screen');
const items = require('#/data/items');
const ui = require('#/ui');

/**
 * 背包：Flags:inventory 存 {物品id: 数量}，Flags:backpack_open 存折叠状态。
 */

/** @returns {Object<string, number>} */
function counts() {
    const raw = era.get("Flags:inventory");
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return {};
    }
    return raw;
}

/** 背包里所有物品的总件数。 */
function totalCount() {
    return Object.values(counts()).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

/**
 * 某件物品的数量。
 * @param {string} id
 */
function countOf(id) {
    return Number(counts()[id]) || 0;
}

/**
 * 增减物品；数量为 0 时从背包里删掉。
 * @param {string} id
 * @param {number} delta
 */
function changeItem(id, delta) {
    const next = {...counts()};
    const value = (Number(next[id]) || 0) + (Number(delta) || 0);
    if (value <= 0) {
        delete next[id];
    } else {
        next[id] = value;
    }
    era.set("Flags:inventory", next);
}

/**
 * 加物品。
 * @param {string} id
 * @param {number} [count]
 */
function addItem(id, count) {
    changeItem(id, count === undefined ? 1 : count);
}

/**
 * 减物品。
 * @param {string} id
 * @param {number} [count]
 */
function removeItem(id, count) {
    changeItem(id, -(count === undefined ? 1 : count));
}

/**
 * 折叠栏：标题始终显示总件数，展开后逐条列出物品。
 */
function renderBackpack() {
    if (era.get("Flags:is_at_title")) {
        return;
    }
    const open = Boolean(era.get("Flags:backpack_open"));
    era.printMultiColumns([{
        config: ui.buttonConfig('primary', {width: 24, align: 'left'}),
        content: t('backpack.title', {
            mark: open ? '▼' : '▶',
            count: totalCount()
        }),
        type: 'button',
        accelerator: screen.assign({kind: 'backpack'})
    }]);
    if (!open) {
        return;
    }
    const entries = Object.entries(counts()).filter(([, count]) => Number(count) > 0);
    if (entries.length === 0) {
        era.print(t('backpack.empty'));
        return;
    }
    for (const [id, count] of entries) {
        era.print(t('backpack.item', {
            name: items.nameOf(id),
            count
        }));
    }
}

/** 切换折叠状态。 */
function toggle() {
    era.set("Flags:backpack_open", !era.get("Flags:backpack_open"));
}

module.exports = {counts, totalCount, countOf, addItem, removeItem, renderBackpack, toggle};
