const era = require('#/era-electron');
const title = require('#/title');
const util = require('#/util');
const player_state = require('#/player-state');
const day_plan = require('#/day-plan');
const scene = require('#/scene');
const pause = require('#/page-pause');
const map_renderer = require('#/map-renderer');
const map_data = require('#/map-data');
const keys = require('#/keys');
const movement = require('#/movement');
const attendance = require('#/attendance');
const action_registry = require('#/actions');
const time = require('#/time');

/**
 * 游戏入口，必须导出 async 函数（引擎会把 module.exports 当作入口调用）。
 *
 * 回合约定：
 * - 每次输入解析后先 era.clear()，再处理动作，最后重绘页面。
 * - 移动会先进「叙述页」：只显示基本信息（不含地图）+ 叙述 + 一个「继续」；
 *   点「继续」后清屏，再切到地图页。
 */
module.exports = async () => {
    init();
    await era.clear();
    await render();
    let flag = true;
    while (flag) {
        const ret = await era.input({hideInput: true});
        await era.clear();
        if (ret === keys.status) {
            era.set("Flags:render_player_state", !era.get("Flags:render_player_state"));
        } else if (ret === keys.dayPlan) {
            day_plan.toggle();
        } else if (ret === keys.pause) {
            await pause.openPause();
            await era.clear();
        } else if (ret === util.numberPrefix(util.titlePrefix, 1)) {
            if (await pause.openLoad()) {
                await era.clear();
            }
        } else if (ret === util.numberPrefix(util.titlePrefix, 0)) {
            startNewGame();
        } else {
            const target = map_data.getMapNodeById(ret);
            const cost = target === null ? null : movement.costOf(target.id);
            if (cost !== null) {
                if (cost > 0) {
                    player_state.renderPlayerState({interactive: false, clock: false});
                }
                await movement.moveTo(target.id);
                attendance.markArrival(target.id);
                if (cost > 0) {
                    await scene.continuePage();
                    await era.clear();
                }
            } else {
                const actionDef = action_registry.findByAccelerator(ret);
                if (actionDef !== null) {
                    await actionDef.run();
                    await era.clear();
                }
            }
        }
        await render();
    }
};

async function render() {
    player_state.renderPlayerState();
    day_plan.renderDayPlan();
    map_renderer.renderMapUI();
    title.renderTitle();
}

function init() {
    map_data.initMapHash();
    map_data.validateMapData().forEach((issue) => console.warn(`[map] ${issue}`));
    era.set("Flags:is_at_title", true);
}

function startNewGame() {
    era.set("Flags:is_at_title", false);
    era.set("Flags:cur_map_node", map_data.START_NODE_ID);
    era.set("Flags:render_player_state", false);
    era.set("Flags:time_minutes", time.START_MINUTES);
    era.set("Flags:schedule_open", 1);
}
