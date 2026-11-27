/**
 * 生成拼凑地图的注册表。
 *
 * 用法：node tools/build-map-csv.js
 * 改 ere/map-layout.js 的 DESIGN.scale 或 NODES 后重新跑一次即可。
 *
 * 图标只保留一份文件 <rl>.png，同时注册给两处：
 *   res/icons.csv  <rl>,<rl>.png            列表里的整图图标
 *   res/map.csv    map_<rl>,<rl>.png        地图上的切分图图标
 *
 * 地图注册表（res/map.csv）：
 *   map_base,base.png              底座（干净底图，最底层）
 *   map_<rl>,<rl>.png              街道图标
 *   map_default_<rl>,default.png   图标缺失时的同位置兜底
 *   hl_<rl>,glow.png               当前节点高亮
 *
 * 需要的图片（放在 res/，和 csv 同目录）：
 *   base.png      底图（默认 960×540，不画图标）
 *   <rl>.png      每个街道一张图标（默认 48×48），rl 见 MapNodes.json
 *   glow.png      高亮圈（默认 64×64）
 *   default.png   兜底图标（48×48）
 *
 * 只注册当前真实存在的文件，避免引擎加载时报「找不到图片」。
 */
const fs = require('fs');
const path = require('path');

const layout = require('../ere/map-layout.js');
const maps = require('../ere/map/MapNodes.json');

const {DESIGN, ICON_SIZE, HIGHLIGHT_SIZE, NODES} = layout;
const scale = DESIGN.scale;
const ids = Object.keys(NODES);

const byId = {};
for (const node of Object.values(maps)) {
    byId[String(node.id)] = node;
}

/** 节点的可读资源名（rl），没写就用 id。 */
function rlOf(id) {
    const node = byId[String(id)];
    return node && typeof node.rl === 'string' && node.rl ? node.rl : String(id);
}

const folder = path.join(__dirname, '..', 'res');
const has = (file) => fs.existsSync(path.join(folder, file));
const round = (value) => Math.round(value * scale);

/** 写文件；没有内容就删掉，避免引擎读到空表。 */
function writeCsv(name, lines) {
    const target = path.join(folder, name);
    if (lines.length === 0) {
        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
        }
        return;
    }
    fs.writeFileSync(target, `${lines.join('\n')}\n`, 'utf8');
}

// 列表用的整图图标：和地图共用同一个文件
const iconLines = [];
ids.forEach((id) => {
    const rl = rlOf(id);
    if (has(`${rl}.png`)) {
        iconLines.push(`${rl},${rl}.png`);
    }
});
writeCsv('icons.csv', iconLines);

// 地图用的切分图
const mapLines = [];
if (has('base.png')) {
    mapLines.push(`map_base,base.png,0,0,${round(DESIGN.width)},${round(DESIGN.height)},0,0`);
}
ids.forEach((id) => {
    const {x, y} = NODES[id];
    const rl = rlOf(id);
    const displayX = round(x);
    const displayY = round(y);
    if (has(`${rl}.png`)) {
        mapLines.push(`map_${rl},${rl}.png,0,0,${ICON_SIZE},${ICON_SIZE},${displayX},${displayY}`);
    }
    if (has('default.png')) {
        mapLines.push(`map_default_${rl},default.png,0,0,${ICON_SIZE},${ICON_SIZE},${displayX},${displayY}`);
    }
});
if (has('glow.png')) {
    const offset = (HIGHLIGHT_SIZE - ICON_SIZE) / 2;
    ids.forEach((id) => {
        const {x, y} = NODES[id];
        mapLines.push(`hl_${rlOf(id)},glow.png,0,0,${HIGHLIGHT_SIZE},${HIGHLIGHT_SIZE},${round(x - offset)},${round(y - offset)}`);
    });
}
writeCsv('map.csv', mapLines);

console.log(`icons.csv: ${iconLines.length} lines, map.csv: ${mapLines.length} lines (scale ${scale})`);
