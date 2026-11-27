const era = require('#/era-electron');
const {t} = require('#/i18n');
const util = require('#/util');
const map_data = require('#/map-data');
const action_registry = require('#/actions');
const condition = require('#/condition');
const screen = require('#/screen');
const ui = require('#/ui');
const meta = require('#/meta');
const icons = require('#/icons');
const {MOVE_MINUTES} = require('#/movement');

/** 同层可走的四个方向：上、右、下、左。 */
const NEIGHBOR_OFFSETS = [
    {dx: 0, dy: -1},
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: -1, dy: 0}
];

/** 图标占的列数。 */
const ICON_WIDTH = 1;

/** 所有选项行统一垂直居中，让图标中线与文字中线对齐。 */
const ROW_CONFIG = {verticalAlign: 'middle'};

function renderMapUI() {
    if (era.get("Flags:is_at_title")) {
        return;
    }
    const node = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    if (node === null) {
        era.print(t('map.node_missing'));
        return;
    }
    era.print(displayName(node), {align: 'left'});
    era.print(t(node.desc));
    era.print(t('map.radiation', {
        value: util.formatRadiation(map_data.radiationOf(node))
    }));
    era.drawLine();
    printActions(node);
}

/**
 * 节点是否可见：node.when 可以是条件 id 或函数，不写表示永远可见。
 * @param {object} node
 * @param {object} current
 */
function isVisible(node, current) {
    return condition.test(node.when, {node, current});
}

/**
 * 列表里的节点名：只显示译文一行，保证名字和括号挨得紧。
 * @param {object} node
 */
function listName(node) {
    return t(node.name);
}

/**
 * 节点显示名：有译文就"译文 + 原文"两行，没译文只显示原文。
 * @param {object} node
 */
function displayName(node) {
    const translated = t(node.name);
    return translated === node.name ? translated : `${translated}\n${node.name}`;
}

/**
 * 分割线以下：当前位置能做的事，每行一个选项：图标 + 名字 + 括号。
 * 主地图列出四个方向的邻居，子地图列出返回与子建筑，最后是节点动作。
 * @param {object} node
 */
function printActions(node) {
    const rows = [];
    const rate = map_data.radiationOf(node);

    if (!map_data.isMapNode(node)) {
        const parent = map_data.getMapNodeById(node.parent);
        if (parent !== null) {
            rows.push(optionRow(parent.rl, t('map.back', {name: t(parent.name)}), {kind: 'move', id: parent.id}));
        }
    }
    for (const child of map_data.getChildren(node.id)) {
        if (!isVisible(child, node)) {
            continue;
        }
        rows.push(optionRow(child.rl, listName(child), {kind: 'move', id: child.id}));
    }
    if (map_data.isMapNode(node)) {
        for (const offset of NEIGHBOR_OFFSETS) {
            const target = map_data.getLayerNode(node.parent, node.x + offset.dx, node.y + offset.dy);
            if (target === null || !isVisible(target, node)) {
                continue;
            }
            rows.push(optionRow(
                target.rl,
                listName(target),
                {kind: 'move', id: target.id},
                meta.segments(MOVE_MINUTES, rate, [])
            ));
        }
    }
    for (const action of action_registry.actionsFor(node)) {
        const info = typeof action.info === 'function' ? action.info({}) : (action.info || []);
        rows.push(optionRow(
            action.rl,
            t(action.textKey),
            {kind: 'action', id: action.id},
            meta.segments(action.minutes, rate, info)
        ));
    }

    if (rows.length === 0) {
        era.print(t('map.no_actions'));
        return;
    }
    for (const row of rows) {
        era.printMultiColumns(row, ROW_CONFIG);
    }
}

/**
 * 一个选项行：图标（可省）+ 名字链接 + 括号内容（可省）。
 * @param {string|boolean|undefined} rl 资源位置
 * @param {string} label
 * @param {{kind:string, id:string}} target
 * @param {Array<{text:string, color:string}>} [parts]
 */
function optionRow(rl, label, target, parts) {
    const resource = icons.resourceOf(rl);
    const iconCell = resource === null ? null : icons.cell(resource, ICON_WIDTH);
    const iconWidth = iconCell === null ? 0 : ICON_WIDTH;
    const available = 24 - iconWidth;
    const hasMeta = Array.isArray(parts) && parts.length > 0;
    const linkWidth = hasMeta ? Math.min(available, meta.linkWidth(label)) : available;

    const cells = iconCell === null ? [] : [iconCell];
    cells.push({
        config: ui.buttonConfig('primary', {width: linkWidth, align: 'left'}),
        content: label,
        type: 'button',
        accelerator: screen.assign(target),
        rl: resource
    });
    if (hasMeta) {
        cells.push(meta.spanCell(parts, available - linkWidth));
    }
    return cells;
}

module.exports = {renderMapUI};
