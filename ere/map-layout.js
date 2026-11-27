/**
 * 拼凑地图的布局：手工维护。
 *
 * 坐标是设计尺寸下的像素（左上角为原点），图标左上角对齐。
 * 底座是 res/base.png（干净的底图，不含图标），图标叠在它上面，
 * 当前节点再叠一层高亮。
 *
 * 改 DESIGN.scale 后运行 `node tools/build-map-csv.js` 重新生成注册表
 * （切分图是固定像素，引擎不支持运行时缩放）。
 */
const DESIGN = {
    width: 960,
    height: 540,
    scale: 1
};

/** 图标边长（px）。 */
const ICON_SIZE = 48;

/** 高亮圈边长（px）。 */
const HIGHLIGHT_SIZE = 64;

/** 主地图节点的位置：图标左上角坐标。 */
const NODES = {
    '1006': {x: 120, y: 240},
    '1002': {x: 240, y: 240},
    '1000': {x: 360, y: 240},
    '1001': {x: 480, y: 240},
    '1008': {x: 600, y: 240},
    '1007': {x: 240, y: 132},
    '1004': {x: 360, y: 132},
    '1003': {x: 360, y: 348},
    '1005': {x: 480, y: 348}
};

module.exports = {DESIGN, ICON_SIZE, HIGHLIGHT_SIZE, NODES};
