const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const scene = require('#/scene');
const effects = require('#/effects');

/**
 * 统一约定：
 * 1. 任何消耗时间的操作都必须走 perform()，禁止直接写 Flags:time_minutes。
 * 2. perform() 固定负责：过程文字 → 随机事件 → 结算 effects → 推进时间 → 跨天提示 → 收尾文字。
 * 3. 随机事件只往 data/encounters.js 的表里加，不改这里的逻辑。
 * 4. 清屏由「回合开始时」统一做；动作内部只允许 clear(1) 清掉自己刚印的按钮。
 *
 * @param {{
 *   label: string,
 *   minutes?: number,
 *   context?: object,
 *   startText?: string,
 *   endText?: string|((total:number)=>string),
 *   encounters?: {chance:number, entries:Array},
 *   effects?: object,
 *   onDone?: function
 * }} options
 */
async function perform(options) {
    const {
        label,
        minutes = 0,
        context = {},
        startText,
        endText,
        encounters,
        effects: actionEffects,
        onDone
    } = options;

    if (startText) {
        era.print(startText);
    }

    let total = minutes;
    const event = roll(encounters, context);
    if (event !== null) {
        total += await scene.run(event, context);
    }
    total += effects.apply(actionEffects, context);

    const change = time.advance(total);
    if (change.dayPassed) {
        era.print(t('action.day_passed', {clock: time.formatClock()}));
    }

    const text = typeof endText === 'function'
        ? endText(total)
        : (endText ?? t('action.done', {
            duration: time.formatDuration(total),
            label
        }));
    if (text) {
        era.print(text);
    }

    if (onDone) {
        onDone();
    }

    return total;
}

/**
 * 按概率 + 权重掷一个事件，没中返回 null。
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
    const available = table.entries.filter((entry) =>
        typeof entry.when === 'function' ? entry.when(context) : true);
    if (available.length === 0) {
        return null;
    }
    let rest = Math.random() * available.reduce((sum, entry) => sum + (entry.weight ?? 1), 0);
    for (const entry of available) {
        rest -= entry.weight ?? 1;
        if (rest <= 0) {
            return entry;
        }
    }
    return available[available.length - 1];
}

module.exports = {perform, roll};
