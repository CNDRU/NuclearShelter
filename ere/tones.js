/**
 * 按钮旁信息片段的颜色。
 * tone 由动作的 info() 给出，渲染层只负责上色。
 */
const COLORS = {
    neutral: '#909399',
    time: '#79bbff',
    positive: '#67c23a',
    negative: '#f56c6c',
    illegal: '#f56c6c',
    late: '#e6a23c',
    missed: '#f56c6c',
    reminder: '#ffffff',
    'chance-high': '#67c23a',
    'chance-medium': '#e6a23c',
    'chance-low': '#f56c6c'
};

/**
 * @param {string} [tone]
 * @returns {string}
 */
function colorOf(tone) {
    return COLORS[tone] || COLORS.neutral;
}

module.exports = {COLORS, colorOf};
