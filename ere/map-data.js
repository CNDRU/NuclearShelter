const maps = require('#/map/MapNodes.json');

/**
 * 节点 id 是「父子路径」字符串：
 *   1000          主地图节点
 *   1000-1        1000 的子节点 1
 *   1000-1-1      1000-1 的子节点 1
 * 前缀就是父节点 id，父层级无歧义；每个父节点下的序号不限量，深度也不限量。
 */

/** 新游戏的起始节点（自己的房间）。 */
const START_NODE_ID = '1000-1-1';

/**
 * 是否是主地图节点（顶层，parent === -1）。
 * @param {{parent:number}} node
 */
function isMapNode(node) {
    return node.parent === -1;
}

/** @param {string|number} nodeId */
function idSegments(nodeId) {
    return String(nodeId).split('-');
}

/**
 * 层数（主地图 = 1）。
 * @param {string|number} nodeId
 */
function idDepth(nodeId) {
    return idSegments(nodeId).length;
}

/**
 * 自己那一段的序号。
 * @param {string|number} nodeId
 */
function idLocal(nodeId) {
    const segments = idSegments(nodeId);
    return segments[segments.length - 1];
}

/**
 * 父节点 id；主地图节点返回 null。
 * @param {string|number} nodeId
 */
function parentIdOf(nodeId) {
    const segments = idSegments(nodeId);
    return segments.length > 1 ? segments.slice(0, -1).join('-') : null;
}

/**
 * 是否是合法节点 id：正整数的 '-' 路径，每段不带前导零。
 * @param {string|number} nodeId
 */
function isValidNodeId(nodeId) {
    return /^[1-9]\d*(-[1-9]\d*)*$/.test(String(nodeId));
}

/**
 * 节点的背景辐射（μSv/h）。必须显式声明，没写时校验会报警，这里按 0 处理。
 * @param {object} node
 */
function radiationOf(node) {
    const value = Number(node.radiation);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * 取某个节点的下一层子节点，按序号升序。
 * @param {number|string} nodeId
 */
function getChildren(nodeId) {
    const key = String(nodeId);
    return Object.values(maps)
        .filter((node) => String(node.parent) === key)
        .sort((a, b) => Number(idLocal(a.id)) - Number(idLocal(b.id)));
}

/**
 * 按节点 id 查找节点，找不到时返回 null。
 * 用字符串比较，兼容 flag / 存档里读回来是字符串的情况。
 * @param {string|number} nodeId
 */
function getMapNodeById(nodeId) {
    const key = String(nodeId);
    for (const node of Object.values(maps)) {
        if (String(node.id) === key) {
            return node;
        }
    }
    return null;
}

/**
 * 校验地图数据的编号、父子关系、邻居与辐射。
 * @returns {string[]} 问题列表，空数组表示没有问题
 */
function validateMapData() {
    const issues = [];
    const byId = new Map();

    // 第一遍：编号格式、重复
    Object.entries(maps).forEach(([name, node]) => {
        const idText = String(node.id);
        if (!isValidNodeId(idText)) {
            issues.push(`节点「${name}」的 id「${idText}」不合法：应为父子路径，例如 1000 / 1000-1 / 1000-1-1`);
            return;
        }
        if (byId.has(idText)) {
            issues.push(`节点「${name}」的 id「${idText}」与「${byId.get(idText).name}」重复`);
            return;
        }
        byId.set(idText, {name, node});
    });

    // 第二遍：父子路径一致性、邻居、辐射
    byId.forEach(({name, node}, idText) => {
        const depth = idDepth(idText);
        if (isMapNode(node)) {
            if (depth !== 1) {
                issues.push(`主节点「${name}」的 id「${idText}」不应带父路径`);
            }
        } else {
            const parentInfo = byId.get(String(node.parent));
            if (parentInfo === undefined) {
                issues.push(`节点「${name}」的 parent「${node.parent}」不存在`);
            } else {
                const expected = parentIdOf(idText);
                if (String(node.parent) !== String(expected)) {
                    issues.push(`节点「${name}」的 id「${idText}」前缀应是父节点「${expected}」，实际写的是「${node.parent}」`);
                }
                if (idDepth(parentInfo.node.id) !== depth - 1) {
                    issues.push(`节点「${name}」的父节点在第 ${idDepth(parentInfo.node.id)} 层，自己应在第 ${idDepth(parentInfo.node.id) + 1} 层`);
                }
            }
        }

        if (!Number.isInteger(Number(node.radiation)) || Number(node.radiation) < 0) {
            issues.push(`节点「${name}」的 radiation 必须是整数（μSv/h）`);
        }

        if (node.neighbors !== undefined) {
            if (!Array.isArray(node.neighbors)) {
                issues.push(`节点「${name}」的 neighbors 必须是数组`);
                return;
            }
            const seen = new Set();
            for (const neighborId of node.neighbors) {
                const key = String(neighborId);
                if (key === idText) {
                    issues.push(`节点「${name}」的 neighbors 不能包含自己`);
                    continue;
                }
                if (seen.has(key)) {
                    issues.push(`节点「${name}」的 neighbors 重复：${key}`);
                    continue;
                }
                seen.add(key);
                const target = byId.get(key);
                if (target === undefined) {
                    issues.push(`节点「${name}」的 neighbors 指向不存在的节点「${key}」`);
                } else if (String(target.node.parent) !== String(node.parent)) {
                    issues.push(`节点「${name}」的 neighbors「${key}」不在同一层`);
                }
            }
        }
    });

    // 第三遍：parent 链不能成环
    byId.forEach(({name, node}, idText) => {
        const seen = new Set([idText]);
        let current = node;
        while (!isMapNode(current)) {
            const parentKey = String(current.parent);
            if (seen.has(parentKey)) {
                issues.push(`节点「${name}」的 parent 链存在环：${[...seen].join(' -> ')} -> ${parentKey}`);
                break;
            }
            const parent = byId.get(parentKey);
            if (parent === undefined) {
                break;
            }
            seen.add(parentKey);
            current = parent.node;
        }
    });

    return issues;
}

module.exports = {
    START_NODE_ID,
    maps,
    isMapNode,
    idDepth,
    idLocal,
    parentIdOf,
    isValidNodeId,
    radiationOf,
    getChildren,
    getMapNodeById,
    validateMapData,
};
