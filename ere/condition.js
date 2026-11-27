const era = require('#/era-electron');

/**
 * 按钮可见性条件。
 *
 * 常见条件直接写在 JSON 里，不用注册；但条件里用的 flag 必须先写进
 * json/Flags.json，否则引擎不会把它存进存档：
 *   "when": {"flag": "shop_open", "min": 1}
 *   "when": {"flag": "shop_open", "eq": 0}
 *   "when": {"not": {"flag": "shop_open"}}
 *   "when": {"all": [{"flag": "a"}, {"flag": "b", "min": 2}]}
 *
 * 复杂条件可以注册（函数里自己保证读的是已声明的 flag）：
 *   condition.register('late_night', (ctx) => time.now().hour >= 22)
 *   "when": "late_night"
 *
 * JS 里（动作、事件选项）也可以直接写函数：
 *   when: (ctx) => era.get("Flags:xxx") === 1
 */
const registry = new Map();

/**
 * 注册一个具名条件。
 * @param {string} id
 * @param {(context:object)=>boolean} fn
 */
function register(id, fn) {
    registry.set(id, fn);
}

/**
 * 判断一个按钮是否可见。
 * @param {boolean|function|string|object|undefined} when
 * @param {object} [context]
 * @returns {boolean}
 */
function test(when, context) {
    if (when === undefined || when === null) {
        return true;
    }
    if (typeof when === 'function') {
        return Boolean(when(context));
    }
    if (typeof when === 'string') {
        const fn = registry.get(when);
        if (fn === undefined) {
            console.warn(`[condition] 未注册的条件：${when}`);
            return false;
        }
        return Boolean(fn(context));
    }
    if (typeof when === 'object') {
        return testObject(when, context);
    }
    return Boolean(when);
}

/**
 * 声明式条件：flag 比较 / not / all / any。
 * @param {object} when
 * @param {object} context
 */
function testObject(when, context) {
    if (Array.isArray(when.all)) {
        return when.all.every((item) => test(item, context));
    }
    if (Array.isArray(when.any)) {
        return when.any.some((item) => test(item, context));
    }
    if (when.not !== undefined) {
        return !test(when.not, context);
    }
    if (when.flag !== undefined) {
        const value = flagValue(when.flag);
        if (when.eq !== undefined) {
            return value === when.eq;
        }
        if (when.min !== undefined && value < when.min) {
            return false;
        }
        if (when.max !== undefined && value > when.max) {
            return false;
        }
        if (when.min === undefined && when.max === undefined) {
            return Boolean(value);
        }
        return true;
    }
    console.warn(`[condition] 不认识的条件：${JSON.stringify(when)}`);
    return false;
}

/**
 * 取 flag 的数值；非数字按真假折算成 1/0。
 * @param {string} name
 */
function flagValue(name) {
    const raw = era.get(`Flags:${name}`);
    const value = Number(raw);
    return Number.isFinite(value) ? value : (raw ? 1 : 0);
}

module.exports = {register, test};
