const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const schedule = require('#/data/schedule');
const attendance = require('#/attendance');
const school = require('#/school');
const screen = require('#/screen');
const ui = require('#/ui');
const tones = require('#/tones');

/** 迟到 / 没去 / 提醒的文字颜色。 */
const LATE_COLOR = tones.colorOf('late');
const MISSED_COLOR = tones.colorOf('missed');
const REMINDER_COLOR = tones.colorOf('reminder');

/**
 * 打印当天的安排（带考勤状态）。
 * @param {object} [now] 可选，默认取当前时间
 */
function renderPlanItems(now) {
    const current = now || time.now();
    const items = schedule.itemsFor(current.weekday, current.season);
    if (items.length === 0) {
        era.print(t('ui.no_plan'));
        return;
    }
    items.forEach((item, index) => {
        const status = attendance.statusOf(index, item);
        if (status === 'late') {
            era.print(t('schedule.late'), {color: LATE_COLOR});
        } else if (status === 'missed') {
            era.print(t(item.missedKey), {color: MISSED_COLOR});
        } else {
            era.print(t('plan.item', {
                time: item.time ? `${item.time} ` : '',
                text: t(item.textKey)
            }));
        }
    });
}

/**
 * 提醒区：
 * - 今天没安排、明天有安排 → 「明天要…」；
 * - 春秋：明天没课就提示「明天不用上学」；
 * - 冬夏：提示新学期还有几天。
 * @param {object} now
 */
function renderReminder(now) {
    const tomorrow = now.weekday % 7 + 1;
    const todayItems = schedule.itemsFor(now.weekday, now.season);
    const tomorrowItems = schedule.itemsFor(tomorrow, now.season);
    if (todayItems.length === 0) {
        for (const item of tomorrowItems) {
            era.print(t('reminder.tomorrow', {text: t(item.textKey)}), {color: REMINDER_COLOR});
        }
    }
    if (school.isSchoolSeason(now.season)) {
        if (!school.hasSchoolTomorrow()) {
            era.print(t('reminder.no_school_tomorrow'), {color: REMINDER_COLOR});
        }
        return;
    }
    era.print(t('reminder.new_term', {days: school.daysToNextTerm()}), {color: REMINDER_COLOR});
}

/**
 * 今日安排折叠栏：标题始终显示星期，展开后列出当天的安排，再下面一行提醒。
 */
function renderDayPlan() {
    if (era.get("Flags:is_at_title")) {
        return;
    }
    const open = Boolean(era.get("Flags:schedule_open"));
    const now = time.now();
    era.printMultiColumns([{
        config: ui.buttonConfig('primary', {width: 24, align: 'left'}),
        content: t('plan.title', {
            mark: open ? '▼' : '▶',
            weekday: now.weekdayName
        }),
        type: 'button',
        accelerator: screen.assign({kind: 'dayPlan'})
    }]);
    if (open) {
        renderPlanItems(now);
    }
    renderReminder(now);
}

/** 切换折叠状态。 */
function toggle() {
    era.set("Flags:schedule_open", !era.get("Flags:schedule_open"));
}

module.exports = {renderDayPlan, renderPlanItems, renderReminder, toggle};
