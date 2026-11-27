const era = require('#/era-electron');
const time = require('#/time');
const schedule = require('#/data/schedule');

/** 超过计划时间多久仍未到场，就算「没去」（分钟）。 */
const LATE_WINDOW = 180;

function dayIndex() {
    return Math.floor(time.now().total / time.DAY_MINUTES);
}

function todayItems() {
    const current = time.now();
    return schedule.itemsFor(current.weekday, current.season);
}

function minuteOfDay() {
    return time.now().total % time.DAY_MINUTES;
}

function parseTime(text) {
    if (typeof text !== 'string') {
        return null;
    }
    const parts = text.split(':').map(Number);
    if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
        return null;
    }
    return parts[0] * 60 + parts[1];
}

/** 当天的考勤记录：{day, items: {日程序号: 到场分钟}}，跨天自动作废。 */
function record() {
    const today = dayIndex();
    const raw = era.get("Flags:attendance");
    if (raw !== null && typeof raw === 'object' && raw.day === today && raw.items !== undefined) {
        return raw;
    }
    return {day: today, items: {}};
}

/**
 * 到达某个节点时登记考勤：当天该地点的日程项还没到场过，就记下当前分钟。
 * @param {number|string} nodeId
 */
function markArrival(nodeId) {
    const data = record();
    let changed = false;
    todayItems().forEach((item, index) => {
        if (String(item.place) === String(nodeId) && data.items[index] === undefined) {
            data.items[index] = minuteOfDay();
            changed = true;
        }
    });
    if (changed) {
        era.set("Flags:attendance", data);
    }
}

/**
 * 日程项状态：
 *   normal 未到时间；
 *   done   准时到了；
 *   late   迟到了（已到但晚于计划，或已过计划仍在宽限内没到）；
 *   missed 宽限内一直没到。
 * @param {number} index
 * @param {object} item
 */
function statusOf(index, item) {
    const scheduled = parseTime(item.time);
    if (scheduled === null) {
        return 'normal';
    }
    const now = minuteOfDay();
    const arrived = record().items[index];
    if (arrived !== undefined) {
        return arrived <= scheduled ? 'done' : 'late';
    }
    if (now < scheduled) {
        return 'normal';
    }
    if (now >= scheduled && String(era.get("Flags:cur_map_node")) === String(item.place)) {
        return 'done';
    }
    if (now < scheduled + LATE_WINDOW) {
        return 'late';
    }
    return 'missed';
}

module.exports = {LATE_WINDOW, markArrival, statusOf};
