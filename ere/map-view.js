const era = require('#/era-electron');
const map_data = require('#/map-data');
const layout = require('#/map-layout');

/**
 * 拼凑地图：底座 + 每个节点的图标 + 当前节点高亮，用切分图叠出来。
 *
 * - 底座 `map_base`（res/base.png，干净底图，最底层）。
 * - 图标 `map_<rl>`，和列表图标共用同一个 `<rl>.png` 文件。
 * - 高亮 `hl_<rl>`，叠在当前节点上。
 *
 * 没有底座素材就不显示（不再用整图回退）。
 * 切分图是固定像素、不随窗口缩放；缩放通过 DESIGN.scale +
 * `node tools/build-map-csv.js` 重新生成注册坐标解决。
 */
const BASE = 'map_base';

/**
 * 打印示意图。只在主地图节点上显示。
 * @param {object} node 当前节点
 */
function renderMapView(node) {
    if (!map_data.isMapNode(node)) {
        return;
    }
    if (!era.checkImage(BASE)) {
        return;
    }
    const names = [BASE];
    for (const id of Object.keys(layout.NODES)) {
        const target = map_data.getMapNodeById(id);
        const rl = target && typeof target.rl === 'string' && target.rl ? target.rl : String(id);
        // 缺 <rl>.png 时回退到同位置的 default.png
        names.push(`map_${rl}\tmap_default_${rl}`);
    }
    const current = typeof node.rl === 'string' && node.rl ? node.rl : String(node.id);
    names.push(`hl_${current}\thl_none`);
    era.printImage(...names);
}

module.exports = {BASE, renderMapView};
