const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const screen = require('#/screen');
const ui = require('#/ui');

/**
 * 状态区。
 * @param {{interactive?: boolean, clock?: boolean}} [options]
 *   interactive=false 时不打印「状态」按钮（用于叙述页，整屏只留一个「继续」）；
 *   clock=false 时不打印时钟（叙述页结束后再显示正确时间）。
 */
function renderPlayerState(options) {
    const opts = options || {};
    const interactive = opts.interactive !== false;
    const showClock = opts.clock !== false;

    if (era.get("Flags:is_at_title")) {
        return;
    }
    if (showClock) {
        era.printMultiColumns([
            {
                config: {width: 12, align: 'left'},
                content: t('ui.gunmu', {n: Number(era.get("Flags:gunmu")) || 0}),
                type: 'text'
            },
            {
                config: {width: 12, align: 'right'},
                content: time.formatClock(),
                type: 'text'
            }
        ]);
    }
    if (interactive) {
        era.printMultiColumns([
            {content: t('ui.status'), type: 'button', accelerator: screen.assign({kind: 'status'}), config: ui.buttonConfig('primary', {width: 12, align: 'center'})},
            {content: t('ui.pause'), type: 'button', accelerator: screen.assign({kind: 'pause'}), config: ui.buttonConfig('primary', {width: 12, align: 'center'})},
        ]);
    }
    if (era.get("Flags:render_player_state")) {
        era.printMultiColumns([
            {config: {width: 4}, content: t('stat.energy'), type: 'text'},
            {config: {width: 4}, content: t('stat.anxiety'), type: 'text'},
            {config: {width: 4}, content: t('stat.compulsion'), type: 'text'},
            {config: {width: 4}, content: t('stat.depression'), type: 'text'},
            {config: {width: 4}, content: t('stat.trauma'), type: 'text'},
            {config: {width: 4}, content: t('stat.radiation') + Math.floor((Number(era.get("Flags:radiation")) || 0) / 60) + "μSv", type: 'text'},
            {config: {width: 24}, content: t('ui.attributes'), type: 'text'},
            {config: {width: 4}, content: t('attr.trickery'), type: 'text'},
            {config: {width: 4}, content: t('attr.ideology'), type: 'text'},
            {config: {width: 4}, content: t('attr.strength'), type: 'text'},
            {config: {width: 4}, content: t('attr.dexterity'), type: 'text'},
            {config: {width: 4}, content: t('attr.medicine'), type: 'text'},
            {config: {width: 4}, content: t('attr.knowledge'), type: 'text'},
        ]);
    }
}

module.exports = {renderPlayerState};
