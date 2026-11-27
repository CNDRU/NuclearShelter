const era = require('#/era-electron');
const {t} = require('#/i18n');
const effects = require('#/effects');
const events = require('#/events');
const condition = require('#/condition');
const screen = require('#/screen');
const ui = require('#/ui');

/** 把上下文里的节点名翻译成当前语言。 */
function describe(context) {
    return {
        from: context && context.from ? t(context.from.name) : '',
        to: context && context.to ? t(context.to.name) : ''
    };
}

/**
 * 运行一段事件，返回结果：
 *   minutes 事件额外消耗的分钟数
 *   move    事件把玩家带到的节点 id（没有就是 null）
 *
 * event: { steps?: step[], effects?: object, move?: string }
 * step:  { textKey?, text?, minutes?, effects?, move?, event?, choices? }
 *   event  嵌套事件表（表名或对象），掷中后继续执行，形成事件链
 *   move   事件结果：移动到的节点 id
 *   choices 分支，选中后执行该分支的 steps/effects/move，本段事件结束
 *
 * @param {{steps?: Array, effects?: object, move?: string}} event
 * @param {object} context
 * @returns {Promise<{minutes:number, move:string|null}>}
 */
async function run(event, context) {
    const outcome = {minutes: 0, move: null};
    await runSteps(event.steps || [], context, outcome);
    outcome.minutes += effects.apply(event.effects, context);
    if (event.move !== undefined && event.move !== null) {
        outcome.move = event.move;
    }
    return outcome;
}

async function runSteps(steps, context, outcome) {
    const params = describe(context);
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const text = step.textKey !== undefined
            ? t(step.textKey, params)
            : (typeof step.text === 'function' ? step.text(context) : step.text);
        if (text) {
            era.print(text);
        }
        outcome.minutes += step.minutes || 0;
        outcome.minutes += effects.apply(step.effects, context);
        if (step.move !== undefined && step.move !== null) {
            outcome.move = step.move;
        }
        if (step.event !== undefined) {
            const picked = events.roll(events.resolve(step.event), context);
            if (picked !== null) {
                const nested = await run(picked, context);
                outcome.minutes += nested.minutes;
                if (nested.move !== null) {
                    outcome.move = nested.move;
                }
            }
        }
        if (step.choices && step.choices.length > 0) {
            const picked = await choose(step.choices, params, context);
            if (picked !== null) {
                outcome.minutes += effects.apply(picked.effects, context);
                if (picked.move !== undefined && picked.move !== null) {
                    outcome.move = picked.move;
                }
                await runSteps(picked.steps || [], context, outcome);
            }
            return outcome;
        }
        if (i < steps.length - 1) {
            await next();
        }
    }
    return outcome;
}

/**
 * 打出一排当前可见的选项并等待选择。
 * 选项可以写 when(context) 控制是否出现；一个都不剩时返回 null（本段事件结束）。
 * @param {Array} choices
 * @param {object} params
 * @param {object} context
 * @returns {Promise<object|null>}
 */
async function choose(choices, params, context) {
    const visible = choices.filter((choice) => condition.test(choice.when, context));
    if (visible.length === 0) {
        return null;
    }
    screen.reset();
    const buttons = visible.map((choice) => ({
        config: ui.buttonConfig('primary', {width: 8, disableContinue: true, showAcc: false}),
        content: choice.labelKey !== undefined ? t(choice.labelKey, params) : choice.label,
        type: 'button',
        accelerator: screen.assign({kind: 'sceneChoice', choice})
    }));
    era.printInColRows(buttons);
    const target = screen.resolve(await era.input({hideInput: true}));
    await clearLastLine();
    return target !== null && target.kind === 'sceneChoice' ? target.choice : null;
}

/** 打出「下一步」并等待点击。 */
async function next() {
    screen.reset();
    era.printButton(t('ui.next'), screen.assign({kind: 'sceneNext'}), ui.buttonConfig('primary', {
        width: 8,
        disableContinue: true,
        showAcc: false
    }));
    await era.input({hideInput: true});
    await clearLastLine();
}

/** 清掉刚点过的按钮那一行，避免一长串灰掉的按钮。 */
async function clearLastLine() {
    await era.clear(1);
}

/**
 * 叙述页的收尾：整屏只留一个「继续」，点击后由调用方切到地图页。
 */
async function continuePage() {
    screen.reset();
    era.printButton(t('ui.continue'), screen.assign({kind: 'continue'}), ui.buttonConfig('primary', {
        width: 24,
        align: 'center',
        disableContinue: true,
        showAcc: false
    }));
    await era.input({hideInput: true});
    await clearLastLine();
}

module.exports = {run, continuePage};
