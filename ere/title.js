const era = require('#/era-electron');
const {t} = require('#/i18n');
const util = require('#/util');

function renderTitle() {
    if (era.get("Flags:is_at_title")) {
        era.printMultiColumns([
            {
                content: t('title.new_game'),
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 0),
                config: {width: 24, align: 'center'}
            },
            {
                content: t('title.load'),
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 1),
                config: {width: 24, align: 'center'}
            },
            {
                content: t('title.settings'),
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 2),
                config: {width: 24, align: 'center'}
            }]);
    }
}

module.exports = {
    renderTitle,
};
