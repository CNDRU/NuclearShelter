const {t} = require('#/i18n');
const tones = require('#/tones');
const util = require('#/util');

/**
 * 括号里的片段：耗时、辐射、额外信息。
 * 每段都带颜色，供 spanCell 组装成带颜色的文本片段。
 * @param {number} minutes
 * @param {number} rate 当地辐射（μSv/h）
 * @param {Array<{text:string, tone:string}>} [info]
 * @returns {Array<{text:string, color:string}>}
 */
function segments(minutes, rate, info) {
    const value = Math.round(Number(minutes) || 0);
    const parts = [];
    if (value > 0) {
        parts.push({text: util.formatCost(value), color: tones.colorOf('time')});
        parts.push({
            text: t('meta.radiation', {n: util.radiationGain(value, rate)}),
            color: tones.colorOf('negative')
        });
    }
    for (const item of info || []) {
        parts.push({text: item.text, color: tones.colorOf(item.tone)});
    }
    if (parts.length === 0) {
        return [];
    }
    const out = [{text: '(', color: tones.colorOf('neutral')}];
    parts.forEach((part, index) => {
        if (index > 0) {
            out.push({text: '|', color: tones.colorOf('neutral')});
        }
        out.push(part);
    });
    out.push({text: ')', color: tones.colorOf('neutral')});
    return out;
}

/**
 * 显示宽度：中日韩字符按 2 计。
 * @param {string} text
 */
function visualLength(text) {
    let width = 0;
    for (const char of String(text)) {
        width += /[\u3000-\u9fff\uff00-\uffef]/.test(char) ? 2 : 1;
    }
    return Math.max(1, width);
}

/**
 * 链接列宽：按名字长度 + 加速键估算，让括号紧跟在名字后面。
 * @param {string} text
 */
function linkWidth(text) {
    const lines = String(text).split('\n');
    const longest = Math.max(...lines.map(visualLength));
    return Math.max(2, Math.min(12, Math.ceil((longest + 4) / 5)));
}

/**
 * 括号内容：单个文本单元，内部用带颜色的片段，紧跟在名字后面。
 * @param {Array<{text:string, color:string}>} parts
 * @param {number} width
 */
function spanCell(parts, width) {
    return {
        config: {width, align: 'left'},
        content: parts.map((part) => ({content: part.text, color: part.color})),
        type: 'text'
    };
}

module.exports = {segments, visualLength, linkWidth, spanCell};
