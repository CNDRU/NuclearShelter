const era = require('#/era-electron');
const {t} = require('#/i18n');
const map_data = require('#/map-data');
const time = require('#/time');
const action = require('#/action');

const {TRAVEL} = require('#/data/encounters');

/** 同层走一格的耗时（分钟）。 */
const MOVE_MINUTES = 15;

/** 进出建筑不耗时。 */
const ENTER_MINUTES = 0;

function sameLayer(from, to) {
    return String(from.parent) === String(to.parent);
}

/**
 * 按出发地的背景辐射累积到玩家身上。
 * Flags:radiation 的单位是 1/60 μSv（= 1 μSv/h × 1 分钟），保证整数：
 *   剂量 += 出发地速率（μSv/h）× 本次耗时（分钟）
 * 1 小时 = 60 单位 = 1 μSv。
 * @param {object} from 出发地节点
 * @param {number} minutes 本次移动实际耗时
 */
function addRadiation(from, minutes) {
    if (!(minutes > 0)) {
        return;
    }
    const current = Number(era.get("Flags:radiation")) || 0;
    era.set("Flags:radiation", current + map_data.radiationOf(from) * minutes);
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

    if (sameLayer(from, to)) {
        const total = await action.perform({
            label: t('travel.heading', {to: toName}),
            minutes: MOVE_MINUTES,
            context: {from, to},
            startText: t('travel.leave', {from: fromName}),
            endText: (total) => t('travel.arrive', {
                duration: time.formatDuration(total),
                to: toName
            }),
            encounters: TRAVEL,
            onDone: () => era.set("Flags:cur_map_node", to.id)
        });
        addRadiation(from, total);
        return true;
    }

    const entering = String(to.parent) === String(from.id);
    const leaving = String(from.parent) === String(to.id);
    const total = await action.perform({
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
        onDone: () => era.set("Flags:cur_map_node", to.id)
    });
    addRadiation(from, total);
    return true;
}

module.exports = {MOVE_MINUTES, ENTER_MINUTES, costOf, moveTo, addRadiation};
