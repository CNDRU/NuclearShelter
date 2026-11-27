const era = require('#/era-electron');
const {t} = require('#/i18n');
const screen = require('#/screen');
const ui = require('#/ui');

/** 可选的开始季节，按日历顺序。 */
const SEASONS = [
    {id: 'spring', month: 1},
    {id: 'summer', month: 2},
    {id: 'autumn', month: 3},
    {id: 'winter', month: 4}
];

/** 默认开始季节。 */
const DEFAULT_SEASON = 'autumn';

/**
 * 捏人界面（目前只有开始季节）。
 * 多选一：点选项切换，点「开始」确认。
 * @returns {Promise<{id:string, month:number}>}
 */
async function createCharacter() {
    let selected = DEFAULT_SEASON;
    let running = true;
    while (running) {
        await era.clear();
        screen.reset();
        era.drawLine({content: t('create.title')});
        era.print(t('create.prompt'));
        const buttons = SEASONS.map((season) => ({
            config: ui.buttonConfig('primary', {width: 6, align: 'center'}),
            content: `${selected === season.id ? '[✓]' : '[ ]'} ${t(`time.season.${season.id}`)}`,
            type: 'button',
            accelerator: screen.assign({kind: 'season', id: season.id})
        }));
        buttons.push({
            config: ui.buttonConfig('primary', {width: 24, align: 'center'}),
            content: t('create.confirm'),
            type: 'button',
            accelerator: screen.assign({kind: 'createConfirm'})
        });
        era.printMultiColumns(buttons);

        const target = screen.resolve(await era.input({hideInput: true}));
        if (target === null) {
            continue;
        }
        if (target.kind === 'season') {
            selected = target.id;
        } else if (target.kind === 'createConfirm') {
            running = false;
        }
    }
    return SEASONS.find((season) => season.id === selected);
}

module.exports = {createCharacter, SEASONS, DEFAULT_SEASON};
