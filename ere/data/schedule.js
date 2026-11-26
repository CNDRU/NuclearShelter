const era = require('#/era-electron');

/**
 * 今日安排表。
 * 键是星期（1 = 星期一 … 7 = 星期日），值是当天的安排数组。
 * 每条：{ time?: '08:30', textKey, missedKey, place }
 *   place 是目标节点 id，到达时会登记考勤。
 */
module.exports = {
    1: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: 1001}],
    2: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: 1001}],
    3: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: 1001}],
    4: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: 1001}],
    5: [{time: '08:00', textKey: 'schedule.labor', missedKey: 'schedule.labor.missed', place: 1004}],
    6: [],
    7: []
};
