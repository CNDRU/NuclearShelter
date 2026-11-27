const sleep = require('#/page-sleep');

/**
 * 节点动作表：MapNodes.json 里的 "actions": ["sleep"] 按这里的 id 解析。
 * 每个动作有：
 *   textKey  按钮文本
 *   cost()   可选，返回按钮上显示的耗时（如 "0:30"）
 *   run()    执行动作
 *
 * 按钮的加速键由 screen 在本屏临时分配，动作 id 本身不参与输入，
 * 所以敲任何固定数字都不能触发动作。
 */
const registry = {
    sleep: {
        textKey: 'action.sleep',
        run: () => sleep.openSleep()
    }
};

/**
 * 取某个节点可用的动作，带上动作 id。
 * @param {object} node
 */
function actionsFor(node) {
    return (node.actions || [])
        .filter((id) => registry[id] !== undefined)
        .map((id) => ({id, ...registry[id]}));
}

/**
 * 按动作 id 取注册项，找不到返回 null。
 * @param {string} id
 */
function get(id) {
    return registry[id] === undefined ? null : registry[id];
}

module.exports = {registry, actionsFor, get};
