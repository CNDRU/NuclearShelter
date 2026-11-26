const era = require('#/era-electron');
const {t} = require('#/i18n');
const effects = require('#/effects');

/** 「下一步」按钮的加速键。 */
const NEXT_ACC = 1;

/** 「继续」按钮的加速键（叙述页结束时用）。 */
const CONTINUE_ACC = 2;

/** 选项按钮的加速键从 1 开始。 */
const CHOICE_ACC_BASE = 1;

/** 把上下文里的节点名翻译成当前语言。 */
function describe(context) {
    return {
        from: context && context.from ? t(context.from.name) : '',
        to: context && context.to ? t(context.to.name) : ''
    };
}

/**
 * 运行一段事件。
 * event: { steps?: step[], effects?: object }
 *   event.effects 在整段事件结束后结算一次。
 * step:  { textKey?: string, text?: string|((context)=>string), minutes?: number,
 *          effects?: object,
 *          choices?: [{ labelKey?: string, label?: string, steps?: step[], effects?: object }] }
 *
 * 有 choices 的步骤走完所选分支后，本段事件结束（分支里可以继续嵌套 steps）。
 *
 * @param {{steps?: Array, effects?: object}} event
 * @param {object} context
 * @returns {Promise<number>} 事件额外消耗的分钟数
 */
async function run(event, context) {
    let extra = await runSteps(event.steps || [], context);
    extra += effects.apply(event.effects, context);
    return extra;
}

async function runSteps(steps, context) {
    const params = describe(context);
    let extra = 0;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const text = step.textKey !== undefined
            ? t(step.textKey, params)
            : (typeof step.text === 'function' ? step.text(context) : step.text);
        if (text) {
            era.print(text);
        }
        extra += step.minutes || 0;
        extra += effects.apply(step.effects, context);

        if (step.choices && step.choices.length > 0) {
            const picked = await choose(step.choices, params);
            if (picked !== null) {
                extra += effects.apply(picked.effects, context);
                extra += await runSteps(picked.steps || [], context);
            }
            return extra;
        }

        if (i < steps.length - 1) {
            await next();
        }
    }
    return extra;
}

/**
 * 打出一排选项并等待选择。
 * @param {Array} choices
 * @param {object} params
 * @returns {Promise<object|null>}
 */
async function choose(choices, params) {
    const buttons = choices.map((choice, i) => ({
        config: {width: 8, disableContinue: true, showAcc: false},
        content: choice.labelKey !== undefined ? t(choice.labelKey, params) : choice.label,
        type: 'button',
        accelerator: CHOICE_ACC_BASE + i
    }));
    era.printInColRows(buttons);
    const ret = await era.input({hideInput: true});
    await clearLastLine();
    const index = ret - CHOICE_ACC_BASE;
    return index >= 0 && index < choices.length ? choices[index] : null;
}

/** 打出「下一步」并等待点击。 */
async function next() {
    era.printButton(t('ui.next'), NEXT_ACC, {
        width: 8,
        disableContinue: true,
        showAcc: false
    });
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
    era.printButton(t('ui.continue'), CONTINUE_ACC, {
        width: 24,
        align: 'center',
        disableContinue: true,
        showAcc: false
    });
    await era.input({hideInput: true});
    await clearLastLine();
}

module.exports = {run, NEXT_ACC, CONTINUE_ACC, continuePage};
