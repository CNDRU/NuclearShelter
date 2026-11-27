const era = require('#/era-electron');
const title = require('#/title');
const player_state = require('#/player-state');
const day_plan = require('#/day-plan');
const backpack = require('#/backpack');
const scene = require('#/scene');
const pause = require('#/page-pause');
const create = require('#/page-create');
const map_renderer = require('#/map-renderer');
const map_data = require('#/map-data');
const movement = require('#/movement');
const attendance = require('#/attendance');
const action_registry = require('#/actions');
const screen = require('#/screen');
const time = require('#/time');

/**
 * 游戏入口，必须导出 async 函数（引擎会把 module.exports 当作入口调用）。
 *
 * 回合约定：
 * - 每次输入解析后先 era.clear()，再处理动作，最后重绘页面。
 * - 所有按钮的加速键都由 screen 每屏临时分配，输入只按这张表分发；
 *   节点 id / 动作 id 本身永远不会成为可输入的按键。
 * - 移动会先进「叙述页」：只显示基本信息（不含地图）+ 叙述 + 一个「继续」；
 *   点「继续」后清屏，再切到地图页。
 */
module.exports = async () => {
    init();
    await era.clear();
    await render();
    let running = true;
    while (running) {
        const ret = await era.input({hideInput: true});
        await era.clear();
        const target = screen.resolve(ret);
        if (target === null) {
            await render();
            continue;
        }
        if (target.kind === 'status') {
            era.set("Flags:render_player_state", !era.get("Flags:render_player_state"));
        } else if (target.kind === 'dayPlan') {
            day_plan.toggle();
        } else if (target.kind === 'backpack') {
            backpack.toggle();
        } else if (target.kind === 'pause') {
            await pause.openPause();
            await era.clear();
        } else if (target.kind === 'titleNew') {
            const season = await create.createCharacter();
            await era.clear();
            startNewGame(season.month);
        } else if (target.kind === 'titleLoad') {
            if (await pause.openLoad()) {
                await era.clear();
            }
        } else if (target.kind === 'move') {
            const cost = movement.costOf(target.id);
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
            }
        } else if (target.kind === 'action') {
            const actionDef = action_registry.get(target.id);
            if (actionDef !== null) {
                await actionDef.run();
                await era.clear();
            }
        }
        await render();
    }
};

async function render() {
    screen.reset();
    player_state.renderPlayerState();
    day_plan.renderDayPlan();
    backpack.renderBackpack();
    map_renderer.renderMapUI();
    title.renderTitle();
}

function init() {
    map_data.initMapHash();
    map_data.validateMapData().forEach((issue) => console.warn(`[map] ${issue}`));
    era.set("Flags:is_at_title", true);
}

/**
 * 开始新游戏。
 * @param {number} month 开始月份 1-4（由捏人界面选择）
 */
function startNewGame(month) {
    era.set("Flags:is_at_title", false);
    era.set("Flags:cur_map_node", map_data.START_NODE_ID);
    era.set("Flags:render_player_state", false);
    era.set("Flags:time_minutes", time.monthStartMinutes(month));
    era.set("Flags:weekday_offset", time.weekdayOffsetForMonth(month));
    era.set("Flags:schedule_open", 1);
    era.set("Flags:backpack_open", 0);
    era.set("Flags:inventory", {});
    era.set("Flags:gunmu",0 );
    // 250 μSv，按 1/60 μSv 为单位存成整数（见 movement.js）
    era.set("Flags:radiation", 250 * 60);
}
