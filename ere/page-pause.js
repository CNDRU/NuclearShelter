const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const util = require('#/util');
const keys = require('#/keys');
const map_data = require('#/map-data');
const day_plan = require('#/day-plan');

/** 存档栏位上限，与 ere.config.json 的 system.saveFiles 保持一致。 */
const SLOT_MAX = 128;

/** 各子界面的「返回」。 */
const BACK_ACC = keys.back;

/** 「新建存档」按钮。 */
const NEW_ACC = keys.newSave;

/** 删除按钮的加速键偏移（1000 + 栏位号）。 */
const DELETE_BASE = keys.deleteBase;

const YES_ACC = 1;
const NO_ACC = 2;

function placeName() {
    const node = map_data.getMapNodeById(era.get("Flags:cur_map_node"));
    return node === null ? '' : t(node.name);
}

/** 当前游戏版本（GameBase 的版本号）。 */
function gameVersion() {
    const base = era.get('gamebase') || {};
    if (base.versionName !== undefined) {
        return String(base.versionName);
    }
    const version = Number(base.version);
    return Number.isFinite(version) ? (version / 1000).toFixed(3) : '0.000';
}

function commentOf(index) {
    const comment = era.get(`global:saves:${index}`);
    return comment === undefined ? null : String(comment);
}

function isLost(comment) {
    return comment === null || comment.startsWith('(FILE LOST) ');
}

/** 已存在的存档栏位（含 0 号自动存档），按栏位号升序。 */
function existingSlots() {
    const list = [];
    for (let i = 0; i <= SLOT_MAX; i++) {
        const comment = commentOf(i);
        if (comment !== null) {
            list.push({index: i, comment});
        }
    }
    return list;
}

/** 手动存档的下一个空栏位（1 号起）。 */
function nextFreeSlot() {
    for (let i = 1; i <= SLOT_MAX; i++) {
        if (commentOf(i) === null) {
            return i;
        }
    }
    return null;
}

function button(accelerator, content, align, width) {
    return {
        config: {width: width || 24, align: align || 'left'},
        content,
        type: 'button',
        accelerator
    };
}

function yesNoButtons() {
    return [button(YES_ACC, t('ui.yes'), 'center', 12), button(NO_ACC, t('ui.no'), 'center', 12)];
}

/**
 * 暂停菜单：保存 / 读取 / 查看信息 / 返回游戏。
 */
async function openPause() {
    let running = true;
    while (running) {
        await era.clear();
        era.drawLine({content: t('pause.title')});
        era.print(t('info.time', {clock: time.formatClock()}));
        era.print(t('info.place', {place: placeName()}));
        era.printMultiColumns([
            button(1, t('pause.save'), 'center'),
            button(2, t('pause.load'), 'center'),
            button(3, t('pause.info'), 'center'),
            button(BACK_ACC, t('pause.resume'), 'center')
        ]);
        const ret = await era.input({hideInput: true});
        if (ret === 1) {
            await openSave();
        } else if (ret === 2) {
            if (await openLoad()) {
                return;
            }
        } else if (ret === 3) {
            await openInfo();
        } else if (ret === BACK_ACC) {
            running = false;
        }
    }
}

/**
 * 询问存档名。默认名是存档瞬间的时间。
 * @param {string} defaultName
 * @returns {Promise<string|null>} null 表示取消
 */
async function askName(defaultName) {
    await era.clear();
    era.drawLine({content: t('save.name_title')});
    era.print(t('save.default_name', {name: defaultName}));
    era.printMultiColumns([
        button(1, t('save.use_default'), 'center', 12),
        button(2, t('save.custom_name'), 'center', 12)
    ]);
    era.printButton(t('ui.cancel'), BACK_ACC, {width: 24, align: 'center', showAcc: false});
    const ret = await era.input({hideInput: true});
    if (ret === BACK_ACC) {
        return null;
    }
    if (ret === 1) {
        return defaultName;
    }
    if (ret !== 2) {
        return null;
    }

    await era.clear();
    era.print(t('save.input_name'));
    const typed = await era.input();
    const name = String(typed === undefined ? '' : typed).trim();
    return name.length > 0 ? name.slice(0, 24) : defaultName;
}

/**
 * 保存界面：列出已有存档 + 新建存档；点已有存档先确认覆盖，再询问名称。
 */
async function openSave() {
    let running = true;
    while (running) {
        await era.clear();
        era.drawLine({content: t('save.title')});
        const cells = existingSlots()
            .filter((slot) => slot.index >= 1)
            .map((slot) => button(slot.index, `${slot.index}. ${slot.comment}`));
        cells.push(button(NEW_ACC, t('save.new'), 'center'));
        cells.push(button(BACK_ACC, t('ui.back'), 'right'));
        era.printMultiColumns(cells);

        const ret = await era.input({hideInput: true});
        if (ret === BACK_ACC) {
            running = false;
            continue;
        }

        let slot = null;
        if (ret === NEW_ACC) {
            slot = nextFreeSlot();
        } else if (ret >= 1 && ret <= SLOT_MAX) {
            slot = ret;
        }
        if (slot === null) {
            if (ret === NEW_ACC) {
                era.notify(t('save.full'), t('pause.title'), 'error');
            }
            continue;
        }

        if (commentOf(slot) !== null) {
            await era.clear();
            era.print(t('save.overwrite', {slot}));
            era.printMultiColumns(yesNoButtons());
            if ((await era.input({hideInput: true})) !== YES_ACC) {
                continue;
            }
        }

        const name = await askName(util.formatLocalTime());
        if (name === null) {
            continue;
        }
        const ok = await era.saveData(slot, name);
        era.notify(
            ok ? t('save.done', {slot}) : t('save.failed'),
            t('pause.title'),
            ok ? 'success' : 'error'
        );
    }
}

/**
 * 读取界面：列出已有存档，每行带删除按钮；空栏位不显示。
 * @returns {Promise<boolean>} 是否读档成功
 */
async function openLoad() {
    let running = true;
    while (running) {
        await era.clear();
        era.drawLine({content: t('load.version', {version: gameVersion()})});
        const cells = [];
        for (const slot of existingSlots()) {
            const lost = isLost(slot.comment);
            cells.push(button(slot.index, `${slot.index}. ${slot.comment}`, 'left', 20));
            cells[cells.length - 1].config.disabled = lost;
            cells.push(button(DELETE_BASE + slot.index, t('load.delete'), 'right', 4));
        }
        cells.push(button(BACK_ACC, t('ui.back'), 'right'));
        era.printMultiColumns(cells);

        const ret = await era.input({hideInput: true});
        if (ret === BACK_ACC) {
            running = false;
            continue;
        }
        if (ret >= DELETE_BASE) {
            const index = ret - DELETE_BASE;
            await era.clear();
            era.print(t('load.delete_confirm', {slot: index}));
            era.printMultiColumns(yesNoButtons());
            if ((await era.input({hideInput: true})) === YES_ACC) {
                await era.rmData(index);
                era.notify(t('load.deleted', {slot: index}), t('pause.title'), 'success');
            }
            continue;
        }

        const slot = existingSlots().find((item) => item.index === ret);
        if (slot === undefined || isLost(slot.comment)) {
            continue;
        }
        if (await era.loadData(ret)) {
            return true;
        }
        era.notify(t('load.failed'), t('pause.title'), 'error');
    }
    return false;
}

/**
 * 信息界面：时间、位置、今日安排。
 */
async function openInfo() {
    await era.clear();
    era.drawLine({content: t('info.title')});
    const now = time.now();
    era.print(t('info.time', {clock: time.formatClock()}));
    era.print(t('info.place', {place: placeName()}));
    era.print(t('info.plan', {weekday: now.weekdayName}));
    day_plan.renderPlanItems(now);
    era.printButton(t('ui.back'), BACK_ACC, {width: 24, align: 'center', showAcc: false});
    await era.input({hideInput: true});
}

module.exports = {NEW_ACC, BACK_ACC, SLOT_MAX, openPause, openSave, openLoad, openInfo};
