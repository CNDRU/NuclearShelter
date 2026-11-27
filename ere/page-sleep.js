const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const util = require('#/util');
const action = require('#/action');
const scene = require('#/scene');
const screen = require('#/screen');
const map_data = require('#/map-data');
const meta = require('#/meta');
const events = require('#/events');
const ui = require('#/ui');
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
    const node = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    const rate = node === null ? 0 : map_data.radiationOf(node);
    for (const hours of HOURS) {
        era.printMultiColumns(
            ui.optionRow(
                undefined,
                t('sleep.hours', {n: hours}),
                screen.assign({kind: 'sleepHours', hours}),
                meta.segments(hours * 60, rate, [])
            ),
            ui.ROW_CONFIG
        );
    }
    era.printButton(t('ui.cancel'), screen.assign({kind: 'back'}), ui.buttonConfig('primary', {
        width: 24,
        align: 'center',
        showAcc: false
    }));

    const target = screen.resolve(await era.input({hideInput: true}));
    if (target === null || target.kind !== 'sleepHours') {
        return false;
    }
    const hours = target.hours;

    await era.clear();
    await action.perform({
        label: t('sleep.title'),
        minutes: hours * 60,
        context: {node},
        startText: t('sleep.start'),
        endText: () => t('sleep.end', {clock: time.formatClock()}),
        encounters: events.tableOf(node)
    });
    await era.saveData(0, t('save.auto', {stamp: util.formatLocalTime()}));
    await scene.continuePage();
    return true;
}

module.exports = {openSleep};
