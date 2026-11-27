const era = require('#/era-electron');
const {t} = require('#/i18n');
const util = require('#/util');
const map_data = require('#/map-data');
const action_registry = require('#/actions');
const condition = require('#/condition');
const screen = require('#/screen');
const ui = require('#/ui');
const meta = require('#/meta');
const {MOVE_MINUTES} = require('#/movement');

const CELL_WIDTH = 8;

/** 同层可走的四个方向：上、右、下、左。 */
const NEIGHBOR_OFFSETS = [
    {dx: 0, dy: -1},
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: -1, dy: 0}
];

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
 * 分割线以下：当前位置能做的事。
 * 主地图列出四个方向的邻居（带耗时与辐射），子地图列出返回与子建筑，最后是节点动作。
 * @param {object} node
 */
function printActions(node) {
    const plain = [];
    const rows = [];
    const flushPlain = () => {
        if (plain.length > 0) {
            rows.push(plain.slice());
            plain.length = 0;
        }
    };

    if (!map_data.isMapNode(node)) {
        const parent = map_data.getMapNodeById(node.parent);
        if (parent !== null) {
            plain.push(actionCell(
                t('map.back', {name: t(parent.name)}),
                screen.assign({kind: 'move', id: parent.id})
            ));
        }
    }
    for (const child of map_data.getChildren(node.id)) {
        if (!isVisible(child, node)) {
            continue;
        }
        plain.push(actionCell(
            listName(child),
            screen.assign({kind: 'move', id: child.id})
        ));
    }

    const rate = map_data.radiationOf(node);
    if (map_data.isMapNode(node)) {
        for (const offset of NEIGHBOR_OFFSETS) {
            const target = map_data.getLayerNode(node.parent, node.x + offset.dx, node.y + offset.dy);
            if (target === null || !isVisible(target, node)) {
                continue;
            }
            const link = moveLink(target);
            rows.push([link, meta.spanCell(meta.segments(MOVE_MINUTES, rate, []), 24 - link.config.width)]);
        }
    }

    for (const action of action_registry.actionsFor(node)) {
        const info = typeof action.info === 'function' ? action.info({}) : (action.info || []);
        const parts = meta.segments(action.minutes, rate, info);
        if (parts.length === 0) {
            plain.push(actionCell(
                t(action.textKey),
                screen.assign({kind: 'action', id: action.id})
            ));
        } else {
            flushPlain();
            const link = actionNameCell(action);
            rows.push([link, meta.spanCell(parts, 24 - link.config.width)]);
        }
    }
    flushPlain();

    if (rows.length === 0) {
        era.print(t('map.no_actions'));
        return;
    }
    for (const row of rows) {
        era.printInColRows(row);
    }
}

/**
 * 邻居链接：名字 + 移动目标。
 * @param {object} target
 */
function moveLink(target) {
    const content = listName(target);
    return {
        config: ui.buttonConfig('primary', {width: meta.linkWidth(content), align: 'left'}),
        content,
        type: 'button',
        accelerator: screen.assign({kind: 'move', id: target.id})
    };
}

/**
 * 动作名按钮。
 * @param {object} action
 */
function actionNameCell(action) {
    const content = t(action.textKey);
    return {
        config: ui.buttonConfig(action.buttonType || 'primary', {width: meta.linkWidth(content), align: 'left'}),
        content,
        type: 'button',
        accelerator: screen.assign({kind: 'action', id: action.id})
    };
}

/**
 * 普通动作按钮（没有耗时/辐射时用）。
 * @param {string} content
 * @param {number} accelerator
 */
function actionCell(content, accelerator) {
    return {
        config: ui.buttonConfig('primary', {width: CELL_WIDTH, align: 'center'}),
        content,
        type: 'button',
        accelerator
    };
}

module.exports = {renderMapUI};
