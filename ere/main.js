const era = require('#/era-electron');
const title = require('#/title');
const util = require('#/util');
const player_state = require('#/player-state');
const map_renderer = require('#/map-renderer');
const map_data = require('#/map-data');

/**
 * 游戏入口，必须导出 async 函数（引擎会把 module.exports 当作入口调用）。
 */
module.exports = async () => {
    init();
    await render();
    let flag = true;
    while (flag) {
        const ret = await era.input();
        if (ret === -1) {
            era.set("Flags:render_player_state", !era.get("Flags:render_player_state"));
            await render();
        }
        if (ret === util.numberPrefix(util.titlePrefix, 0)) {
            startNewGame();
            await render();
        }
    }
};

async function render() {
    await era.clear();
    player_state.renderPlayerState();
    map_renderer.renderMapUI();
    title.renderTitle();
}

function init() {
    map_data.initMapHash();
    era.set("Flags:is_at_title", true);
}

function startNewGame() {
    era.set("Flags:is_at_title", false);
    era.set("Flags:cur_map_node", 0);
    era.set("Flags:render_player_state", false);
}
