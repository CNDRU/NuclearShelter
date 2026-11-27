/**
 * 每周安排表。
 * 键是星期（1 = 星期一 … 7 = 星期日），值是当天的安排数组。
 * 每条：{ time?, textKey, missedKey, place, school?, seasons? }
 *   place    目标节点 id（父子路径字符串），到达时登记考勤
 *   school   是否是"上学"（用于提醒"明天不用上学"）
 *   seasons  只在指定季节出现（不写表示全年）
 */
const WEEK = {
    1: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: '1001', school: true, seasons: ['spring', 'autumn']}],
    2: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: '1001', school: true, seasons: ['spring', 'autumn']}],
    3: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: '1001', school: true, seasons: ['spring', 'autumn']}],
    4: [{time: '08:30', textKey: 'schedule.school', missedKey: 'schedule.school.missed', place: '1001', school: true, seasons: ['spring', 'autumn']}],
    5: [{time: '08:00', textKey: 'schedule.labor', missedKey: 'schedule.labor.missed', place: '1004'}],
    6: [],
    7: []
};

/**
 * 取某个星期、某个季节的安排。
 * @param {number} weekday 1-7
 * @param {string} season spring / summer / autumn / winter
 */
function itemsFor(weekday, season) {
    return (WEEK[weekday] || []).filter((item) =>
        item.seasons === undefined || item.seasons.includes(season));
}

module.exports = {WEEK, itemsFor};
