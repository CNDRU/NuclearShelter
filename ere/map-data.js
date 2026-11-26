const maps = require('#/map/MapNodes.json');

/** 节点 id 固定为 4 位十进制：首位标记地图，后三位是地图内序号。 */
const MAP_ID_LENGTH = 4;

/** 新游戏的起始节点（自己的房间）。 */
const START_NODE_ID = 3000;

/** parent 键 -> Map("x,y" -> 节点)，每一层地图各一份坐标索引。 */
const layerHash = new Map();

/**
 * 是否是主地图节点（顶层，parent === -1）。
 * @param {{parent:number}} node
 */
function isMapNode(node) {
    return node.parent === -1;
}

/**
 * 把节点 id 拆成「地图标记 + 地图内序号」，全部用字符串处理。
 * @param {number|string} nodeId
 * @returns {{map:string, local:string}|null} 长度不是 4 位时返回 null
 */
function splitNodeId(nodeId) {
    const text = String(nodeId);
    if (text.length !== MAP_ID_LENGTH) {
        return null;
    }
    return {map: text.slice(0, 1), local: text.slice(1)};
}

/**
 * 取地图标记（1 为主地图，2-9 为子地图）。
 * @param {number|string} nodeId
 * @returns {string|null}
 */
function mapNoOf(nodeId) {
    const parts = splitNodeId(nodeId);
    return parts === null ? null : parts.map;
}

/**
 * 取地图内序号。
 * @param {number|string} nodeId
 * @returns {string|null}
 */
function localNoOf(nodeId) {
    const parts = splitNodeId(nodeId);
    return parts === null ? null : parts.local;
}

/**
 * 按 parent 分组建立每一层地图的坐标索引。
 */
function initMapHash() {
    layerHash.clear();
    for (const node of Object.values(maps)) {
        const key = String(node.parent);
        if (!layerHash.has(key)) {
            layerHash.set(key, new Map());
        }
        layerHash.get(key).set(`${node.x},${node.y}`, node);
    }
}

/**
 * 取某一层地图上 (x, y) 处的节点。
 * @param {number} parent 该层的 parent 值（主地图为 -1）
 * @param {number} x
 * @param {number} y
 */
function getLayerNode(parent, x, y) {
    const layer = layerHash.get(String(parent));
    if (layer === undefined) {
        return null;
    }
    const node = layer.get(`${x},${y}`);
    return node === undefined ? null : node;
}

/**
 * 取某个节点的下一层子节点，按 id 升序。
 * @param {number} nodeId
 */
function getChildren(nodeId) {
    const key = String(nodeId);
    return Object.values(maps)
        .filter((node) => String(node.parent) === key)
        .sort((a, b) => Number(a.id) - Number(b.id));
}

/**
 * 按节点 id 查找节点，找不到时返回 null。
 * 用字符串比较，兼容 flag / 存档里读回来是字符串的情况。
 * @param {number|string} nodeId
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
 * 校验地图数据的编号、坐标、父子关系与 children 一致性。
 * @returns {string[]} 问题列表，空数组表示没有问题
 */
function validateMapData() {
    const issues = [];
    const idPattern = /^[1-9]\d{3}$/;
    const byId = new Map();
    const childrenByParent = new Map();

    // 第一遍：编号格式、重复、父索引
    Object.entries(maps).forEach(([name, node]) => {
        const idText = String(node.id);
        if (!idPattern.test(idText)) {
            issues.push(`节点「${name}」的 id「${idText}」不合法：必须是 4 位数字且首位为 1-9`);
            return;
        }
        if (byId.has(idText)) {
            issues.push(`节点「${name}」的 id「${idText}」与「${byId.get(idText).name}」重复`);
            return;
        }
        byId.set(idText, {name, node});
        if (!isMapNode(node)) {
            const parentKey = String(node.parent);
            if (!childrenByParent.has(parentKey)) {
                childrenByParent.set(parentKey, []);
            }
            childrenByParent.get(parentKey).push(idText);
        }
    });

    const coords = new Map();

    // 第二遍：层级、parent 存在性、坐标
    byId.forEach(({name, node}, idText) => {
        const mapNo = idText.slice(0, 1);
        if (isMapNode(node)) {
            if (mapNo !== '1') {
                issues.push(`主节点「${name}」的 id「${idText}」首位应为 1`);
            }
        } else {
            const parentInfo = byId.get(String(node.parent));
            if (parentInfo === undefined) {
                issues.push(`节点「${name}」的 parent「${node.parent}」不存在`);
            } else {
                const parentNo = Number(String(parentInfo.node.id).slice(0, 1));
                const expected = parentNo + 1;
                if (Number(mapNo) !== expected) {
                    issues.push(`子节点「${name}」的 id「${idText}」首位应为 ${expected}（父节点「${parentInfo.name}」在第 ${parentNo} 层）`);
                }
            }
        }

        if (!Number.isInteger(node.x) || !Number.isInteger(node.y)) {
            issues.push(`节点「${name}」缺少有效的 x/y 坐标`);
        }
        const scope = isMapNode(node) ? 'main' : String(node.parent);
        const coordKey = `${scope}:${node.x},${node.y}`;
        if (coords.has(coordKey)) {
            issues.push(`节点「${name}」与「${coords.get(coordKey)}」坐标重复（${node.x},${node.y}）`);
        } else {
            coords.set(coordKey, name);
        }
    });

    // 第三遍：children 必须与 parent 关系一致
    byId.forEach(({name, node}, idText) => {
        const listed = Array.isArray(node.children) ? node.children.map(String) : [];
        const derived = childrenByParent.get(idText) || [];
        const missing = derived.filter((id) => !listed.includes(id));
        const extra = listed.filter((id) => !derived.includes(id));
        if (missing.length > 0) {
            issues.push(`节点「${name}」的 children 缺少 ${missing.join(', ')}`);
        }
        if (extra.length > 0) {
            issues.push(`节点「${name}」的 children 多出 ${extra.join(', ')}（这些节点的 parent 不是它）`);
        }
    });

    // 第四遍：parent 链不能成环
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
    MAP_ID_LENGTH,
    START_NODE_ID,
    maps,
    layerHash,
    isMapNode,
    splitNodeId,
    mapNoOf,
    localNoOf,
    initMapHash,
    getLayerNode,
    getChildren,
    getMapNodeById,
    validateMapData,
};
