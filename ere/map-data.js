const maps = require('#/map/MapNodes.json');

const mapHash = new Map();

/**
 * 以 "x,y" 为键建立坐标到节点的索引，供地图渲染使用。
 */
function initMapHash() {
    for (const [, node] of Object.entries(maps)) {
        mapHash.set(`${node.x},${node.y}`, node);
    }
}

/**
 * 按节点 id 查找节点，找不到时返回 null。
 * @param {number} nodeId
 */
function getMapNodeById(nodeId) {
    for (const [, node] of Object.entries(maps)) {
        if (node.id === nodeId) {
            return node;
        }
    }
    return null;
}

module.exports = { maps, mapHash, initMapHash, getMapNodeById };
