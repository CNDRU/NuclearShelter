const tones = require('#/tones');
const icons = require('#/icons');
const meta = require('#/meta');

/**
 * 按钮外观。
 * 目前用链接样式（isButton: false + color），因为真实按钮只能用 Element 的
 * 固定主题色，没法用自定义的 #79bbff。
 *
 * 想改回普通按钮：把 isButton 改成 true，去掉 color，改回 buttonType 即可。
 */
const COLORS = {
    primary: tones.COLORS.time,
    danger: tones.COLORS.negative,
    warning: tones.COLORS['chance-medium'],
    success: tones.COLORS.positive,
    info: tones.COLORS.neutral
};

/** 选项行统一垂直居中，让图标中线与文字中线对齐。 */
const ROW_CONFIG = {verticalAlign: 'middle'};

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

/**
 * 一个选项行：图标（可省）+ 名字链接 + 括号内容（可省）。
 * @param {string|boolean|undefined} rl 资源位置
 * @param {string} label
 * @param {number} accelerator
 * @param {Array<{text:string, color:string}>} [parts] 括号片段
 * @param {string} [type] 按钮颜色
 */
function optionRow(rl, label, accelerator, parts, type) {
    const resource = icons.resourceOf(rl);
    const iconCell = resource === null ? null : icons.cell(resource, icons.WIDTH);
    const iconWidth = iconCell === null ? 0 : icons.WIDTH;
    const available = 24 - iconWidth;
    const hasMeta = Array.isArray(parts) && parts.length > 0;
    const linkWidth = hasMeta ? Math.min(available, meta.linkWidth(label)) : available;

    const cells = iconCell === null ? [] : [iconCell];
    cells.push({
        config: buttonConfig(type || 'primary', {width: linkWidth, align: 'left'}),
        content: label,
        type: 'button',
        accelerator,
        rl: resource
    });
    if (hasMeta) {
        cells.push(meta.spanCell(parts, available - linkWidth));
    }
    return cells;
}

module.exports = {COLORS, ROW_CONFIG, buttonConfig, optionRow};
