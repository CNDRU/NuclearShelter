const era = require('#/era-electron');
const {t} = require('#/i18n');

/** 一天的分钟数。 */
const DAY_MINUTES = 1440;

/** 每月天数（统一 28 天，正好 4 周）。 */
const DAYS_PER_MONTH = 28;

/** 一年月数：春 / 夏 / 秋 / 冬。 */
const MONTHS_PER_YEAR = 4;

/** 一年天数：4 × 28 = 112。 */
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

/** 纪元年份：时间从 1968 年春月 1 日 00:00 起算。 */
const EPOCH_YEAR = 1968;

/** 每月 1 日的起始时间：07:00。 */
const START_MINUTES = 7 * 60;

/** 月份对应的季节代码。 */
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

function pad2(num) {
    return String(num).padStart(2, '0');
}

/**
 * 当前时间。存档里只存一个整数：从 1968 春月 1 日 00:00 起的总分钟数。
 * 历法：一年 4 个月（春/夏/秋/冬），每月 28 天，共 112 天。
 * 星期每 7 天一轮；偏移量由开局季节决定，保证开局第一天是周日。
 * @returns {{total:number, year:number, month:number, season:string, seasonName:string,
 *            day:number, weekday:number, weekdayName:string, hour:number, minute:number}}
 */
function now() {
    const raw = Number(era.get("Flags:time_minutes"));
    const total = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
    const dayIndex = Math.floor(total / DAY_MINUTES);
    const dayOfYear = dayIndex % DAYS_PER_YEAR;
    const month = Math.floor(dayOfYear / DAYS_PER_MONTH) + 1;
    const season = SEASONS[month - 1];
    const offsetRaw = Number(era.get("Flags:weekday_offset"));
    const offset = Number.isFinite(offsetRaw) ? offsetRaw : 6;
    const weekday = ((dayIndex + offset) % 7 + 7) % 7 + 1;
    return {
        total,
        year: EPOCH_YEAR + Math.floor(dayIndex / DAYS_PER_YEAR),
        month,
        season,
        seasonName: t(`time.season.${season}`),
        day: dayOfYear % DAYS_PER_MONTH + 1,
        weekday,
        weekdayName: t(`time.weekday.${weekday}`),
        hour: Math.floor((total % DAY_MINUTES) / 60),
        minute: total % 60,
    };
}

/** @returns {string} 形如 "1968 年 春月 1 日 08:05" */
function formatClock() {
    const current = now();
    return t('time.clock', {
        year: current.year,
        season: current.seasonName,
        day: current.day,
        hour: pad2(current.hour),
        minute: pad2(current.minute),
    });
}

/**
 * 0 → "片刻"；45 → "45 分钟"；75 → "1 小时 15 分钟"。
 * @param {number} minutes
 */
function formatDuration(minutes) {
    const value = Math.max(0, Math.round(minutes));
    if (value === 0) {
        return t('time.duration.instant');
    }
    if (value < 60) {
        return t('time.duration.minutes', {n: value});
    }
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest === 0
        ? t('time.duration.hours', {n: hours})
        : t('time.duration.hours_minutes', {h: hours, m: rest});
}

/**
 * 某个月 1 日 08:00 的绝对分钟数。
 * @param {number} month 1-4
 */
function monthStartMinutes(month) {
    return (month - 1) * DAYS_PER_MONTH * DAY_MINUTES + START_MINUTES;
}

/**
 * 让某个月 1 日落在周日的星期偏移量。
 * @param {number} month 1-4
 */
function weekdayOffsetForMonth(month) {
    const dayIndex = (month - 1) * DAYS_PER_MONTH;
    return ((6 - dayIndex % 7) % 7 + 7) % 7;
}

/**
 * 推进时间。只有这里能写 Flags:time_minutes。
 * @param {number} minutes
 * @returns {{dayPassed:boolean, now:object}}
 */
function advance(minutes) {
    const before = now();
    const total = before.total + Math.max(0, Math.round(minutes));
    era.set("Flags:time_minutes", total);
    const after = now();
    const dayIndex = (value) => Math.floor(value.total / DAY_MINUTES);
    return {dayPassed: dayIndex(after) !== dayIndex(before), now: after};
}

module.exports = {
    DAY_MINUTES,
    DAYS_PER_MONTH,
    MONTHS_PER_YEAR,
    DAYS_PER_YEAR,
    EPOCH_YEAR,
    SEASONS,
    START_MINUTES,
    now,
    formatClock,
    formatDuration,
    monthStartMinutes,
    weekdayOffsetForMonth,
    advance,
};
