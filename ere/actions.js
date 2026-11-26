const util = require('#/util');
const sleep = require('#/page-sleep');

/**
 * 节点动作表：MapNodes.json 里的 "actions": ["sleep"] 按这里的 id 解析。
 * 每个动作有：
 *   accelerator  按钮加速键，由 util.numberPrefix(系列前缀, 序号) 生成
 *   textKey      按钮文本
 *   run()        执行动作
 */
const registry = {
    sleep: {
        accelerator: util.numberPrefix(util.actionPrefixes.sleep, 0),
        textKey: 'action.sleep',
        run: () => sleep.openSleep()
    }
};

/** 取某个节点可用的动作。 */
function actionsFor(node) {
    return (node.actions || [])
        .map((id) => registry[id])
        .filter((action) => action !== undefined);
}

/** 按加速键找动作，找不到返回 null。 */
function findByAccelerator(accelerator) {
    return Object.values(registry).find((action) => action.accelerator === accelerator) || null;
}

module.exports = {registry, actionsFor, findByAccelerator};
