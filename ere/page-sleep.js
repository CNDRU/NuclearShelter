const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const util = require('#/util');
const action = require('#/action');
const scene = require('#/scene');
const keys = require('#/keys');
const {HOURS} = require('#/data/sleep');

const CANCEL_ACC = keys.back;

/**
 * 睡觉：选时长 → 推进时间 → 自动存档到 0 号位 → 叙述页。
 * @returns {Promise<boolean>} 是否真的睡了
 */
async function openSleep() {
    await era.clear();
    era.drawLine({content: t('sleep.title')});
    era.print(t('sleep.prompt'));
    era.printMultiColumns(HOURS.map((hours) => ({
        config: {width: 8, align: 'center'},
        content: t('sleep.hours', {n: hours}),
        type: 'button',
        accelerator: hours
    })));
    era.printButton(t('ui.cancel'), CANCEL_ACC, {width: 24, align: 'center', showAcc: false});

    const hours = await era.input({hideInput: true});
    if (!HOURS.includes(hours)) {
        return false;
    }

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
