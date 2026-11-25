const era = require('#/era-electron');
const util = require('#/util');
const map_data = require('#/map-data');

function renderMapUI() {
    if (!era.get("Flags:is_at_title")) {
        const nowId = era.get("Flags:cur_map_node");
        const node = map_data.getMapNodeById(nowId);
        if (node === null) {
            era.print("地图节点不存在！");
            return;
        }
        const x = node.x;
        const y = node.y;
        let k = 0;
        const list = new Array(9);
        for (let j = y - 1; j <= y + 1; j++) {
            for (let i = x - 1; i <= x + 1; i++) {
                printMapNode([i, j], list, k);
                k++;
            }
        }
        era.printMultiColumns(list);
        era.print(node.desc);
        era.drawLine();
    }
}

function printMapNode(pos, list, k) {
    const target = map_data.mapHash.get(util.serializePos(pos));
    if (target !== null && target !== undefined) {
        list[k] = {
            config: {width: 8},
            content: target.name,
            type: 'button',
            accelerator: util.numberPrefix(util.mapNodePrefix, target.id)
        };
    } else {
        list[k] = {config: {width: 8}, content: ' ', type: 'text'};
    }
}

module.exports = {renderMapUI};
