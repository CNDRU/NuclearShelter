/**
 * 界面按钮的加速键。
 * 负数段：状态 / 今日 / 暂停；正数段：返回 / 新建 / 删除。
 * 动作系列的前缀在 util.actionPrefixes 里，用 numberPrefix 生成。
 */
module.exports = {
    status: -1,
    dayPlan: -2,
    pause: -3,
    back: 999,
    newSave: 998,
    deleteBase: 1000
};
