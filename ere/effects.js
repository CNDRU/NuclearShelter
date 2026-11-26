const era = require('#/era-electron');

/**
 * 效果处理器表：名字 -> (值, context) => 追加的分钟数（可选）。
 *
 * 约定：
 * - 处理器必须是同步函数。
 * - 返回数字表示"额外消耗的分钟"，会被累加进本次动作的总耗时；返回其它值当作 0。
 * - 想加新效果类型，register 一个处理器即可，事件/动作的写法不用改。
 */
const handlers = new Map();

function register(name, handler) {
    handlers.set(name, handler);
}

/** 追加时间：effects: { minutes: 5 } */
register('minutes', (value) => Number(value) || 0);

/** 数值累加：effects: { flag: { drunk_helped: 1 } } */
register('flag', (value) => {
    for (const [name, delta] of Object.entries(value)) {
        const current = Number(era.get(`Flags:${name}`)) || 0;
        era.set(`Flags:${name}`, current + (Number(delta) || 0));
    }
    return 0;
});

/** 直接赋值：effects: { setFlag: { met_stranger: true } } */
register('setFlag', (value) => {
    for (const [name, val] of Object.entries(value)) {
        era.set(`Flags:${name}`, val);
    }
    return 0;
});

/**
 * 结算一组 effects，返回其中累计的额外分钟数。
 * @param {object|undefined} effects
 * @param {object} context
 * @returns {number}
 */
function apply(effects, context) {
    if (!effects) {
        return 0;
    }
    let extra = 0;
    for (const [name, value] of Object.entries(effects)) {
        const handler = handlers.get(name);
        if (handler === undefined) {
            console.warn(`[effects] 未知的效果类型：${name}`);
            continue;
        }
        extra += Number(handler(value, context)) || 0;
    }
    return extra;
}

module.exports = {register, apply, handlers};
