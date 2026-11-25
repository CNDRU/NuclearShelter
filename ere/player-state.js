const era = require('#/era-electron');

function renderPlayerState() {
    if(!era.get("Flags:is_at_title")){
        era.printMultiColumns([
            {content: '状态', type: 'button', accelerator: -1, config: {width: 24, align: 'center'}},
        ]);
        if (era.get("Flags:render_player_state")) {
            era.printMultiColumns([
                {config: {width: 4}, content: '精力', type: 'text'},
                {config: {width: 4}, content: '焦虑', type: 'text'},
                {config: {width: 4}, content: '强迫', type: 'text'},
                {config: {width: 4}, content: '抑郁', type: 'text'},
                {config: {width: 4}, content: '创伤', type: 'text'},
                {config: {width: 4}, content: '辐射', type: 'text'},
                {config: {width: 24}, content: '属性', type: 'text'},
                {config: {width: 4}, content: '诡术', type: 'text'},
                {config: {width: 4}, content: '意识形态', type: 'text'},
                {config: {width: 4}, content: '力量', type: 'text'},
                {config: {width: 4}, content: '灵巧', type: 'text'},
                {config: {width: 4}, content: '医术', type: 'text'},
                {config: {width: 4}, content: '知识', type: 'text'},
            ]);
        }
    }
}

module.exports = {renderPlayerState};
