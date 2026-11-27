const time = require('#/time');
const schedule = require('#/data/schedule');

/** 需要上学的季节。 */
const SCHOOL_SEASONS = ['spring', 'autumn'];

/** @param {string} season */
function isSchoolSeason(season) {
    return SCHOOL_SEASONS.includes(season);
}

/**
 * 下一个开学季还有几天（只用于冬夏）。
 * 夏天等今年的秋，冬天等明年的春。
 */
function daysToNextTerm() {
    const current = time.now();
    const dayIndex = Math.floor(current.total / time.DAY_MINUTES);
    const yearIndex = Math.floor(dayIndex / time.DAYS_PER_YEAR);
    let target;
    if (current.month === 2) {
        target = yearIndex * time.DAYS_PER_YEAR + 2 * time.DAYS_PER_MONTH;
    } else {
        target = (yearIndex + 1) * time.DAYS_PER_YEAR;
    }
    return target - dayIndex;
}

/** 明天有没有课（只用于春秋）。 */
function hasSchoolTomorrow() {
    const current = time.now();
    const tomorrow = current.weekday % 7 + 1;
    return schedule.itemsFor(tomorrow, current.season).some((item) => item.school);
}

module.exports = {SCHOOL_SEASONS, isSchoolSeason, daysToNextTerm, hasSchoolTomorrow};
