const era = require('#/era-electron');
const {t} = require('#/i18n');
const screen = require('#/screen');

function renderTitle() {
    if (!era.get("Flags:is_at_title")) {
        return;
    }
    era.printMultiColumns([
        {
            content: t('title.new_game'),
            type: 'button',
            accelerator: screen.assign({kind: 'titleNew'}),
            config: {width: 24, align: 'center'}
        },
        {
            content: t('title.load'),
            type: 'button',
            accelerator: screen.assign({kind: 'titleLoad'}),
            config: {width: 24, align: 'center'}
        },
        {
            content: t('title.settings'),
            type: 'button',
            accelerator: screen.assign({kind: 'titleSettings'}),
            config: {width: 24, align: 'center'}
        }
    ]);
}

module.exports = {
    renderTitle,
};
