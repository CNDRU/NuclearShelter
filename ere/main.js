const era = require('#/era-electron');
const maps = require('#/map/MapNodes.json');
module.exports = async () => {
    era.set("Flags:cur_map_node",0);
    let nowNodeId = era.get("Flags:cur_map_node");
    await era.clear()
    renderState()
    renderMapUI()
};

function renderState(){
    era.printMultiColumns([
        { config: { width: 24 }, content: '状态', type: 'text' },
        { config: { width: 4 }, content: '精力', type: 'text' },
        { config: { width: 4 }, content: '焦虑', type: 'text' },
        { config: { width: 4 }, content: '强迫', type: 'text' },
        { config: { width: 4 }, content: '抑郁', type: 'text' },
        { config: { width: 4 }, content: '创伤', type: 'text' },
        { config: { width: 4 }, content: '辐射', type: 'text' },
        { config: { width: 24, content: '' }, type: 'divider' },
        { config: { width: 24 }, content: '属性', type: 'text' },
        { config: { width: 4 }, content: '诡术', type: 'text' },
        { config: { width: 4 }, content: '意识形态', type: 'text' },
        { config: { width: 4 }, content: '力量', type: 'text' },
        { config: { width: 4 }, content: '灵巧', type: 'text' },
        { config: { width: 4 }, content: '医术', type: 'text' },
        { config: { width: 4 }, content: '知识', type: 'text' },
    ])
}

function renderMapUI() {
    const nowId = era.get("Flags:cur_map_node");
    const node = getMapNodeById(nowId);
    if (node === null) {
        era.print("地图节点不存在！");
        return;
    }
    // 标题
    era.print(node.name);
    era.print(node.desc);
    era.drawLine();
    /*
        // ========== 相邻节点：例如A节点右侧跳夜莺街 ==========
        if (`MapNodes:${id}:${neighbor_right}` !== undefined) {
            const rightNode = getMapNodeById(`MapNodes:id:neighbor_right`);

            if (id.neighbor_left !== undefined) {
                const leftNode = getMapNodeById(`MapNodes:${id}:neighbor_left`);

                    era.printButton(`←前往左侧：MapNodes:${id}:neighbor_left:title`, () => {
                        era.set("Flags:cur_map_node", leftNode);
                        renderMapUI();
                    })

            }

            era.drawLine();
            // ========== 子节点：进入嵌套下层（大地图→街道，街道→建筑） ==========
            for (const childId of id.children) {
                const childNode = getMapNodeById(childId);
                era.printButton(`进入：${childNode.name}`, () => {
                    era.set("Flags:cur_map_node", childId);
                    renderMapUI();
                })
            }

            era.drawLine();
            // ========== 返回上一级（父节点） ==========
            if (id.parent !== -1) {
                const parentNode = getMapNodeById(id.parent);
                era.printButton(`← 返回：${parentNode.name}`, () => {
                    era.set("Flags:cur_map_node", id.parent);
                    renderMapUI();
                })
            }

            // 如果是最底层建筑，可以增加【进入建筑事件】按钮
            if (id.level === 2) {
                era.printButton("【进入建筑触发事件】", () => {
                    triggerBuildingEvent(id.id);
                })
            }
        }


    }
     */
}
function triggerBuildingEvent(nodeId) {
    era.clear();
    const node = getMapNodeById(nodeId);
    era.print(`你来到了${node.name}`);
    era.printButton("返回地图", renderMapUI);
}
function getAllMapKeysStatic(){
    return maps;
}
// 根据id找单个节点对象
function getMapNodeById(nodeId){
    const maps = getAllMapKeysStatic();
    for (const [key, node] of Object.entries(maps)){
        const id = node.id;
        if(id === nodeId){
            return node;
        }
    }
    return null;
}