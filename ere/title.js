const era = require('#/era-electron');
const util = require('#/util');

function renderTitle() {
    if (era.get("Flags:is_at_title")) {
        era.printMultiColumns([
            {
                content: '新游戏',
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 0),
                config: {width: 24, align: 'center'}
            },
            {
                content: '读取存档',
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 1),
                config: {width: 24, align: 'center'}
            },
            {
                content: '设置',
                type: 'button',
                accelerator: util.numberPrefix(util.titlePrefix, 2),
                config: {width: 24, align: 'center'}
            }]);
    }
}

module.exports = {
    renderTitle,
};
