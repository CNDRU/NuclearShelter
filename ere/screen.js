/**
 * 本屏按钮的临时加速键。
 *
 * 每次重绘前 reset，渲染时给每个可点目标分配一个数字（从 1 开始）；
 * 主循环按这个数字查表得到"移动到哪个节点 / 执行哪个动作"。
 * 节点 id 本身不再参与输入，所以敲 id 无法瞬移。
 */
const TOKEN_BASE = 1;

let next = TOKEN_BASE;
let targets = new Map();

/** 重绘前清空。 */
function reset() {
    next = TOKEN_BASE;
    targets = new Map();
}

/**
 * 给一个目标分配本屏的加速键。
 * @param {{kind:'move'|'action', id:string|number}} target
 * @returns {number}
 */
function assign(target) {
    const accelerator = next++;
    targets.set(accelerator, target);
    return accelerator;
}

/**
 * 按加速键取回目标，找不到返回 null。
 * @param {number} accelerator
 */
function resolve(accelerator) {
    const target = targets.get(accelerator);
    return target === undefined ? null : target;
}

module.exports = {reset, assign, resolve};
