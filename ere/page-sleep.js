const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const util = require('#/util');
const action = require('#/action');
const scene = require('#/scene');
const screen = require('#/screen');
const {HOURS} = require('#/data/sleep');

/**
 * 睡觉：选时长 → 推进时间 → 自动存档到 0 号位 → 叙述页。
 * @returns {Promise<boolean>} 是否真的睡了
 */
async function openSleep() {
    await era.clear();
    screen.reset();
    era.drawLine({content: t('sleep.title')});
    era.print(t('sleep.prompt'));
    era.printMultiColumns(HOURS.map((hours) => ({
        config: {width: 8, align: 'center'},
        content: `${t('sleep.hours', {n: hours})} (${util.formatCost(hours * 60)})`,
        type: 'button',
        accelerator: screen.assign({kind: 'sleepHours', hours})
    })));
    era.printButton(t('ui.cancel'), screen.assign({kind: 'back'}), {
        width: 24,
        align: 'center',
        showAcc: false
    });

    const target = screen.resolve(await era.input({hideInput: true}));
    if (target === null || target.kind !== 'sleepHours') {
        return false;
    }
    const hours = target.hours;

    await era.clear();
    await action.perform({
        label: t('sleep.title'),
        minutes: hours * 60,
        startText: t('sleep.start'),
        endText: () => t('sleep.end', {clock: time.formatClock()})
    });
    await era.saveData(0, t('save.auto', {stamp: util.formatLocalTime()}));
    await scene.continuePage();
    return true;
}

module.exports = {openSleep};
