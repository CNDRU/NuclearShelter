const era = require('#/era-electron');
const {t} = require('#/i18n');
const util = require('#/util');
const map_data = require('#/map-data');
const action_registry = require('#/actions');
const condition = require('#/condition');
const screen = require('#/screen');
const {MOVE_MINUTES} = require('#/movement');

const CELL_WIDTH = 8;

function renderMapUI() {
    if (era.get("Flags:is_at_title")) {
        return;
    }
    const node = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    if (node === null) {
        era.print(t('map.node_missing'));
        return;
    }
    if (map_data.isMapNode(node)) {
        printNeighborhood(node);
    } else {
        era.print(displayName(node), {align: 'center'});
    }
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
 * 节点显示名：有译文就"译文 + 原文"两行，没译文只显示原文。
 * @param {object} node
 */
function displayName(node) {
    const translated = t(node.name);
    return translated === node.name ? translated : `${translated}\n${node.name}`;
}

/**
 * 打印当前节点所在那一层的 3×3 十字：中心是自己（不可点击），上下左右是同层邻居。
 * @param {object} node
 */
function printNeighborhood(node) {
    const cells = new Array(9);
    let k = 0;
    for (let j = node.y - 1; j <= node.y + 1; j++) {
        for (let i = node.x - 1; i <= node.x + 1; i++) {
            if (i !== node.x && j !== node.y) {
                cells[k] = blankCell();
            } else if (i === node.x && j === node.y) {
                cells[k] = currentCell(node);
            } else {
                const target = map_data.getLayerNode(node.parent, i, j);
                cells[k] = target === null || !isVisible(target, node) ? blankCell() : nodeCell(target);
            }
            k++;
        }
    }
    era.printMultiColumns(cells, {verticalAlign: 'middle'});
}

/**
 * 分割线以下：当前位置能做的事（返回上级 + 进入下一层子地图 + 节点动作）。
 * 以后要加别的动作，写进 MapNodes 的 actions 即可。
 * @param {object} node
 */
function printActions(node) {
    const buttons = [];
    if (!map_data.isMapNode(node)) {
        const parent = map_data.getMapNodeById(node.parent);
        if (parent !== null) {
            buttons.push(actionCell(
                t('map.back', {name: t(parent.name)}),
                screen.assign({kind: 'move', id: parent.id})
            ));
        }
    }
    for (const child of map_data.getChildren(node.id)) {
        if (!isVisible(child, node)) {
            continue;
        }
        buttons.push(actionCell(
            displayName(child),
            screen.assign({kind: 'move', id: child.id})
        ));
    }
    for (const action of action_registry.actionsFor(node)) {
        buttons.push(actionCell(
            t(action.textKey),
            screen.assign({kind: 'action', id: action.id}),
            action.cost ? action.cost() : null
        ));
    }
    if (buttons.length === 0) {
        era.print(t('map.no_actions'));
        return;
    }
    era.printInColRows(buttons);
}

/** 邻居：可点击的按钮，名字后面带同层移动的耗时。加速键用本屏临时编号。 */
function nodeCell(node) {
    const lines = displayName(node).split('\n');
    lines[0] = `${lines[0]} (${util.formatCost(MOVE_MINUTES)})`;
    return {
        config: {width: CELL_WIDTH, align: 'center'},
        content: lines.join('\n'),
        type: 'button',
        accelerator: screen.assign({kind: 'move', id: node.id})
    };
}

/** 当前位置：纯文本，不可点击。 */
function currentCell(node) {
    return {
        config: {width: CELL_WIDTH, align: 'center'},
        content: displayName(node),
        type: 'text'
    };
}

/**
 * 动作按钮。costText 不为空时在文字后面加 (耗时)。
 * @param {string} content
 * @param {number} accelerator
 * @param {string|null} [costText]
 */
function actionCell(content, accelerator, costText) {
    return {
        config: {width: CELL_WIDTH, align: 'center'},
        content: costText ? `${content} (${costText})` : content,
        type: 'button',
        accelerator: accelerator
    };
}

function blankCell() {
    return {config: {width: CELL_WIDTH}, content: ' ', type: 'text'};
}

module.exports = {renderMapUI};
