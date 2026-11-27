const era = require('#/era-electron');
const {t} = require('#/i18n');
const time = require('#/time');
const util = require('#/util');
const map_data = require('#/map-data');
const day_plan = require('#/day-plan');
const screen = require('#/screen');

/** 存档栏位上限，与 ere.config.json 的 system.saveFiles 保持一致。 */
const SLOT_MAX = 128;

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
    return [
        button(screen.assign({kind: 'yes'}), t('ui.yes'), 'center', 12),
        button(screen.assign({kind: 'no'}), t('ui.no'), 'center', 12)
    ];
}

/**
 * 暂停菜单：保存 / 读取 / 查看信息 / 返回游戏。
 */
async function openPause() {
    let running = true;
    while (running) {
        await era.clear();
        screen.reset();
        era.drawLine({content: t('pause.title')});
        era.print(t('info.time', {clock: time.formatClock()}));
        era.print(t('info.place', {place: placeName()}));
        era.printMultiColumns([
            button(screen.assign({kind: 'pauseSave'}), t('pause.save'), 'center'),
            button(screen.assign({kind: 'pauseLoad'}), t('pause.load'), 'center'),
            button(screen.assign({kind: 'pauseInfo'}), t('pause.info'), 'center'),
            button(screen.assign({kind: 'pauseResume'}), t('pause.resume'), 'center')
        ]);
        const target = screen.resolve(await era.input({hideInput: true}));
        if (target === null) {
            continue;
        }
        if (target.kind === 'pauseSave') {
            await openSave();
        } else if (target.kind === 'pauseLoad') {
            if (await openLoad()) {
                return;
            }
        } else if (target.kind === 'pauseInfo') {
            await openInfo();
        } else if (target.kind === 'pauseResume') {
            running = false;
        }
    }
}

/**
 * 询问存档名。默认名是存档瞬间的本地时间。
 * @param {string} defaultName
 * @returns {Promise<string|null>} null 表示取消
 */
async function askName(defaultName) {
    await era.clear();
    screen.reset();
    era.drawLine({content: t('save.name_title')});
    era.print(t('save.default_name', {name: defaultName}));
    era.printMultiColumns([
        button(screen.assign({kind: 'nameDefault'}), t('save.use_default'), 'center', 12),
        button(screen.assign({kind: 'nameCustom'}), t('save.custom_name'), 'center', 12)
    ]);
    era.printButton(t('ui.cancel'), screen.assign({kind: 'back'}), {
        width: 24,
        align: 'center',
        showAcc: false
    });
    const target = screen.resolve(await era.input({hideInput: true}));
    if (target === null || target.kind === 'back') {
        return null;
    }
    if (target.kind === 'nameDefault') {
        return defaultName;
    }
    if (target.kind !== 'nameCustom') {
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
        screen.reset();
        era.drawLine({content: t('save.title')});
        const cells = existingSlots()
            .filter((slot) => slot.index >= 1)
            .map((slot) => button(
                screen.assign({kind: 'saveSlot', index: slot.index}),
                `${slot.index}. ${slot.comment}`
            ));
        cells.push(button(screen.assign({kind: 'saveNew'}), t('save.new'), 'center'));
        cells.push(button(screen.assign({kind: 'back'}), t('ui.back'), 'right'));
        era.printMultiColumns(cells);

        const target = screen.resolve(await era.input({hideInput: true}));
        if (target === null) {
            continue;
        }
        if (target.kind === 'back') {
            running = false;
            continue;
        }
        if (target.kind === 'saveNew') {
            const slot = nextFreeSlot();
            if (slot === null) {
                era.notify(t('save.full'), t('pause.title'), 'error');
                continue;
            }
            const name = await askName(util.formatLocalTime());
            if (name === null) {
                continue;
            }
            const ok = await era.saveData(slot, name);
            era.notify(ok ? t('save.done', {slot}) : t('save.failed'), t('pause.title'), ok ? 'success' : 'error');
        } else if (target.kind === 'saveSlot') {
            const slot = target.index;
            if (commentOf(slot) !== null) {
                await era.clear();
                screen.reset();
                era.print(t('save.overwrite', {slot}));
                era.printMultiColumns(yesNoButtons());
                const answer = screen.resolve(await era.input({hideInput: true}));
                if (answer === null || answer.kind !== 'yes') {
                    continue;
                }
            }
            const name = await askName(util.formatLocalTime());
            if (name === null) {
                continue;
            }
            const ok = await era.saveData(slot, name);
            era.notify(ok ? t('save.done', {slot}) : t('save.failed'), t('pause.title'), ok ? 'success' : 'error');
        }
    }
}

/**
 * 读取界面：列出已有存档，每行带删除按钮。
 * @returns {Promise<boolean>} 是否读档成功
 */
async function openLoad() {
    let running = true;
    while (running) {
        await era.clear();
        screen.reset();
        era.drawLine({content: t('load.version', {version: gameVersion()})});
        const cells = [];
        for (const slot of existingSlots()) {
            const lost = isLost(slot.comment);
            const cell = button(
                screen.assign({kind: 'loadSlot', index: slot.index}),
                `${slot.index}. ${slot.comment}`,
                'left',
                20
            );
            cell.config.disabled = lost;
            cells.push(cell);
            cells.push(button(
                screen.assign({kind: 'deleteSlot', index: slot.index}),
                t('load.delete'),
                'right',
                4
            ));
        }
        cells.push(button(screen.assign({kind: 'back'}), t('ui.back'), 'right'));
        era.printMultiColumns(cells);

        const target = screen.resolve(await era.input({hideInput: true}));
        if (target === null) {
            continue;
        }
        if (target.kind === 'back') {
            running = false;
            continue;
        }
        if (target.kind === 'deleteSlot') {
            await era.clear();
            screen.reset();
            era.print(t('load.delete_confirm', {slot: target.index}));
            era.printMultiColumns(yesNoButtons());
            const answer = screen.resolve(await era.input({hideInput: true}));
            if (answer !== null && answer.kind === 'yes') {
                await era.rmData(target.index);
                era.notify(t('load.deleted', {slot: target.index}), t('pause.title'), 'success');
            }
            continue;
        }
        if (target.kind === 'loadSlot') {
            if (isLost(commentOf(target.index))) {
                continue;
            }
            if (await era.loadData(target.index)) {
                return true;
            }
            era.notify(t('load.failed'), t('pause.title'), 'error');
        }
    }
    return false;
}

/**
 * 信息界面：时间、位置、今日安排。
 */
async function openInfo() {
    await era.clear();
    screen.reset();
    era.drawLine({content: t('info.title')});
    const now = time.now();
    era.print(t('info.time', {clock: time.formatClock()}));
    era.print(t('info.place', {place: placeName()}));
    era.print(t('info.plan', {weekday: now.weekdayName}));
    day_plan.renderPlanItems(now);
    era.printButton(t('ui.back'), screen.assign({kind: 'back'}), {
        width: 24,
        align: 'center',
        showAcc: false
    });
    await era.input({hideInput: true});
}

module.exports = {SLOT_MAX, openPause, openSave, openLoad, openInfo};
