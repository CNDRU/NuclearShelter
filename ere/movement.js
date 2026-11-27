const era = require('#/era-electron');
const {t} = require('#/i18n');
const map_data = require('#/map-data');
const time = require('#/time');
const action = require('#/action');
const events = require('#/events');

const {TRAVEL} = require('#/data/encounters');

/** 同层走一格的耗时（分钟）。 */
const MOVE_MINUTES = 15;

/** 进出建筑不耗时。 */
const ENTER_MINUTES = 0;

function sameLayer(from, to) {
    return String(from.parent) === String(to.parent);
}

/**
 * 本次移动的耗时（分钟）。
 * @param {number|string} nodeId
 * @returns {number|null} 不能移动时返回 null
 */
function costOf(nodeId) {
    const from = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    const to = map_data.getMapNodeById(nodeId);
    if (from === null || to === null || String(from.id) === String(to.id)) {
        return null;
    }
    return sameLayer(from, to) ? MOVE_MINUTES : ENTER_MINUTES;
}

/**
 * 移动到目标节点。走 perform()，自动带上时间消耗与街头事件。
 * @param {number|string} nodeId
 * @returns {Promise<boolean>} 是否真的移动了
 */
async function moveTo(nodeId) {
    const from = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    const to = map_data.getMapNodeById(nodeId);
    if (from === null || to === null || String(from.id) === String(to.id)) {
        return false;
    }

    const fromName = t(from.name);
    const toName = t(to.name);
    // 事件挂在目标节点上；没写就用同层移动的默认表
    const table = events.tableOf(to) || (sameLayer(from, to) ? TRAVEL : null);

    if (sameLayer(from, to)) {
        await action.perform({
            label: t('travel.heading', {to: toName}),
            minutes: MOVE_MINUTES,
            context: {from, to},
            startText: t('travel.leave', {from: fromName}),
            endText: (total) => t('travel.arrive', {
                duration: time.formatDuration(total),
                to: toName
            }),
            encounters: table,
            move: to.id
        });
        return true;
    }

    const entering = String(to.parent) === String(from.id);
    const leaving = String(from.parent) === String(to.id);
    await action.perform({
        label: entering
            ? t('travel.enter_heading', {to: toName})
            : t('travel.return_heading', {to: toName}),
        minutes: ENTER_MINUTES,
        context: {from, to},
        endText: entering
            ? t('travel.enter', {to: toName})
            : (leaving
                ? t('travel.return', {to: toName})
                : t('travel.arrive_other', {to: toName})),
        encounters: table,
        move: to.id
    });
    return true;
}

module.exports = {MOVE_MINUTES, ENTER_MINUTES, costOf, moveTo};
