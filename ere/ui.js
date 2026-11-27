/**
 * 按钮外观。
 * 目前用链接样式（isButton: false + color），因为真实按钮只能用 Element 的
 * 固定主题色，没法用自定义的 #79bbff。
 *
 * 想改回普通按钮：把 isButton 改成 true，去掉 color，改回 buttonType 即可。
 */
const COLORS = {
    primary: '#79bbff',
    danger: '#f56c6c',
    warning: '#e6a23c',
    success: '#67c23a',
    info: '#909399'
};

/**
 * 生成按钮配置。
 * @param {string} [type] primary / danger / warning / success / info
 * @param {object} [overrides]
 */
function buttonConfig(type, overrides) {
    return Object.assign({
        isButton: false,
        color: COLORS[type] || COLORS.primary
    }, overrides || {});
}

module.exports = {COLORS, buttonConfig};
