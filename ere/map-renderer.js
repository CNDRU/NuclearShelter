const era = require('#/era-electron');
const {t} = require('#/i18n');
const units = require('#/units');
const map_data = require('#/map-data');
const action_registry = require('#/actions');
const condition = require('#/condition');
const screen = require('#/screen');
const ui = require('#/ui');
const meta = require('#/meta');
const map_view = require('#/map-view');
const {MOVE_MINUTES} = require('#/movement');

/** 同层移动的耗时由 movement 提供。 */

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
        value: units.doseRate(map_data.radiationOf(node))
    }));
    era.drawLine();
    printActions(node);
    map_view.renderMapView(node);
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
 * 子地图列出返回与子建筑，然后是同层邻居（手工维护的 neighbors），最后是节点动作。
 * @param {object} node
 */
function printActions(node) {
    const rows = [];
    const rate = map_data.radiationOf(node);

    if (!map_data.isMapNode(node)) {
        const parent = map_data.getMapNodeById(node.parent);
        if (parent !== null) {
            rows.push(ui.optionRow(
                parent.rl,
                t('map.back', {name: t(parent.name)}),
                screen.assign({kind: 'move', id: parent.id})
            ));
        }
    }
    for (const child of map_data.getChildren(node.id)) {
        if (!isVisible(child, node)) {
            continue;
        }
        rows.push(ui.optionRow(
            child.rl,
            listName(child),
            screen.assign({kind: 'move', id: child.id})
        ));
    }
    for (const neighborId of node.neighbors || []) {
        const target = map_data.getMapNodeById(neighborId);
        if (target === null || !isVisible(target, node)) {
            continue;
        }
        rows.push(ui.optionRow(
            target.rl,
            listName(target),
            screen.assign({kind: 'move', id: target.id}),
            meta.segments(MOVE_MINUTES, rate, [])
        ));
    }
    for (const action of action_registry.actionsFor(node)) {
        const info = typeof action.info === 'function' ? action.info({}) : (action.info || []);
        rows.push(ui.optionRow(
            action.rl,
            t(action.textKey),
            screen.assign({kind: 'action', id: action.id}),
            meta.segments(action.minutes, rate, info),
            action.buttonType || 'primary'
        ));
    }

    if (rows.length === 0) {
        era.print(t('map.no_actions'));
        return;
    }
    for (const row of rows) {
        era.printMultiColumns(row, ui.ROW_CONFIG);
    }
}

module.exports = {renderMapUI};
