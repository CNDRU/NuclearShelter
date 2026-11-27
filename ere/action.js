const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const scene = require('#/scene');
const effects = require('#/effects');
const events = require('#/events');
const map_data = require('#/map-data');

/**
 * 统一约定：
 * 1. 任何消耗时间的操作都必须走 perform()，禁止直接写 Flags:time_minutes。
 * 2. perform() 固定负责：过程文字 → 掷事件 → 结算 effects → 推进时间 → 跨天提示 → 收尾文字 → 应用事件结果。
 * 3. 事件可以嵌套成链（step.event），结果里可以带 move 把玩家带到别的节点。
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
 *   move?: string,
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
        move,
        onDone
    } = options;

    if (startText) {
        era.print(startText);
    }

    let total = minutes;
    let outcome = {minutes: 0, move: null};
    const event = events.roll(encounters, context);
    if (event !== null) {
        outcome = await scene.run(event, context);
    }
    total += outcome.minutes;
    total += effects.apply(actionEffects, context);

    const change = time.advance(total);
    if (change.dayPassed) {
        era.print(t('action.day_passed', {clock: time.formatClock()}));
    }

    // 背景辐射 = 当前地点的强度 × 本次耗时（移动时仍是出发地）
    addRadiation(total);

    const text = typeof endText === 'function'
        ? endText(total)
        : (endText ?? t('action.done', {
            duration: time.formatDuration(total),
            label
        }));
    if (text) {
        era.print(text);
    }

    // 事件结果优先于原本的移动目标
    const destination = outcome.move !== null ? outcome.move : move;
    if (destination !== undefined && destination !== null) {
        era.set("Flags:cur_map_node", String(destination));
    }

    if (onDone) {
        onDone();
    }

    return total;
}

/**
 * 按当前地点的背景辐射累积到玩家身上。
 * @param {number} minutes 本次耗时
 */
function addRadiation(minutes) {
    if (!(minutes > 0)) {
        return;
    }
    const node = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    if (node === null) {
        return;
    }
    const current = Number(era.get("Flags:radiation")) || 0;
    era.set("Flags:radiation", current + map_data.radiationOf(node) * minutes);
}

module.exports = {perform};
