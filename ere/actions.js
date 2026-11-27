const condition = require('#/condition');
const sleep = require('#/page-sleep');

/**
 * 节点动作表：MapNodes.json 里的 "actions": ["lockpick"] 按这里的 id 解析。
 * 每个动作有：
 *   textKey      按钮文本
 *   minutes      可选，耗时（分钟）；括号里会自动带上耗时和这段时间的辐射增量
 *   info()       可选，返回括号里的其他片段：[{text, tone}]，按 tone 上色
 *   when()       可选，返回按钮是否可见（参数是 {node, now}）
 *   rl           可选，图标资源位置；false 表示不要图标
 *   events       可选，触发的事件表（表名或表对象）
 *   buttonType   可选，按钮颜色（primary / danger / …）
 *   run()        执行动作
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
 * 取某个节点当前可见的动作，带上动作 id。
 * @param {object} node
 * @param {object} [context] 默认是 {node}
 */
function actionsFor(node, context) {
    const params = context || {node};
    return (node.actions || [])
        .filter((id) => registry[id] !== undefined)
        .map((id) => ({id, ...registry[id]}))
        .filter((action) => condition.test(action.when, params));
}

/**
 * 按动作 id 取注册项，找不到返回 null。
 * @param {string} id
 */
function get(id) {
    return registry[id] === undefined ? null : registry[id];
}

module.exports = {registry, actionsFor, get};
