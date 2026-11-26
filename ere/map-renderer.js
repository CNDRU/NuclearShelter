const era = require('#/era-electron');
const {t} = require('#/i18n');
const map_data = require('#/map-data');
const action_registry = require('#/actions');

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
    printNeighborhood(node);
    era.print(t(node.desc));
    era.drawLine();
    printActions(node);
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
                cells[k] = target === null ? blankCell() : nodeCell(target);
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
            buttons.push(actionCell(t('map.back', {name: t(parent.name)}), parent.id));
        }
    }
    for (const child of map_data.getChildren(node.id)) {
        buttons.push(actionCell(displayName(child), child.id));
    }
    for (const action of action_registry.actionsFor(node)) {
        buttons.push(actionCell(t(action.textKey), action.accelerator));
    }
    if (buttons.length === 0) {
        era.print(t('map.no_actions'));
        return;
    }
    era.printInColRows(buttons);
}

/** 邻居：可点击的按钮。 */
function nodeCell(node) {
    return {
        config: {width: CELL_WIDTH, align: 'center'},
        content: displayName(node),
        type: 'button',
        accelerator: node.id
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

function actionCell(content, accelerator) {
    return {
        config: {width: CELL_WIDTH, align: 'center'},
        content: content,
        type: 'button',
        accelerator: accelerator
    };
}

function blankCell() {
    return {config: {width: CELL_WIDTH}, content: ' ', type: 'text'};
}

module.exports = {renderMapUI};
