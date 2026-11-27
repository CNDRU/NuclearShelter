const tables = require('#/data/encounters');

/**
 * 把「表名 / 表对象 / 空」统一成事件表。
 * @param {string|object|undefined} value
 */
function resolve(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'string') {
        return tables[value] || null;
    }
    return value;
}

/**
 * 取某个可点击选项/节点挂的事件表。
 * @param {object} owner
 */
function tableOf(owner) {
    return resolve(owner && owner.events);
}

/**
 * 掷一个事件，没中返回 null。
 * 权重可以是数字或函数 (context) => 数字，方便随属性变化。
 * @param {{chance?:number, entries:Array}} table
 * @param {object} context
 */
function roll(table, context) {
    if (!table || !Array.isArray(table.entries) || table.entries.length === 0) {
        return null;
    }
    if (Math.random() >= (table.chance ?? 0)) {
        return null;
    }
    const available = table.entries
        .map((entry) => ({entry, weight: weightOf(entry, context)}))
        .filter(({entry, weight}) =>
            weight > 0 && (typeof entry.when === 'function' ? entry.when(context) : true));
    if (available.length === 0) {
        return null;
    }
    const total = available.reduce((sum, item) => sum + item.weight, 0);
    let rest = Math.random() * total;
    for (const item of available) {
        rest -= item.weight;
        if (rest <= 0) {
            return item.entry;
        }
    }
    return available[available.length - 1].entry;
}

/**
 * 条目权重：数字或 (context) => 数字；不写默认 1。
 * @param {object} entry
 * @param {object} context
 */
function weightOf(entry, context) {
    const raw = entry.weight;
    const weight = typeof raw === 'function' ? raw(context) : (raw === undefined ? 1 : raw);
    return Number(weight) || 0;
}

module.exports = {resolve, tableOf, roll, weightOf};
