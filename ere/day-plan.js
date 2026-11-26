const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const schedule = require('#/data/schedule');
const attendance = require('#/attendance');
const keys = require('#/keys');

const TOGGLE_ACC = keys.dayPlan;

/** 迟到 / 没去的文字颜色。 */
const LATE_COLOR = '#e6a23c';
const MISSED_COLOR = '#f56c6c';

/**
 * 打印当天的安排（带考勤状态）。
 * @param {object} [now] 可选，默认取当前时间
 */
function renderPlanItems(now) {
    const current = now || time.now();
    const items = schedule[current.weekday] || [];
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
 * 今日安排折叠栏：标题始终显示星期，展开后列出当天的安排。
 */
function renderDayPlan() {
    if (era.get("Flags:is_at_title")) {
        return;
    }
    const open = Boolean(era.get("Flags:schedule_open"));
    const now = time.now();
    era.printMultiColumns([{
        config: {width: 24, align: 'left'},
        content: t('plan.title', {
            mark: open ? '▼' : '▶',
            weekday: now.weekdayName
        }),
        type: 'button',
        accelerator: TOGGLE_ACC
    }]);
    if (!open) {
        return;
    }
    renderPlanItems(now);
}

/** 切换折叠状态。 */
function toggle() {
    era.set("Flags:schedule_open", !era.get("Flags:schedule_open"));
}

module.exports = {renderDayPlan, renderPlanItems, toggle};
