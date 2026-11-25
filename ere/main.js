const era = require('#/era-electron');
const maps = require('#/map/MapNodes.json');
module.exports = async () => {
   // let nowNodeId = era.get("Flags:cur_map_node");
    init()
    render()
    let flag = true
    while(flag) {
        const ret = await era.input();
        if (ret === -1) {
            era.set("Flags:render_player_state", !era.get("Flags:render_player_state"))
            render()
        }
    }
};
function render(){
    era.clear()
    renderState()
    renderMapUI()
}
function init(){
    era.set("Flags:cur_map_node",0);
    era.set("Flags:render_player_state",false);
}

function renderState(){
    era.printMultiColumns( [{button: {width: 24}, content: '状态', type: 'button',accelerator: -1, config:{align: 'center'}}])
    if(era.get("Flags:render_player_state")) {
        era.printMultiColumns([
            {config: {width: 4}, content: '精力', type: 'text'},
            {config: {width: 4}, content: '焦虑', type: 'text'},
            {config: {width: 4}, content: '强迫', type: 'text'},
            {config: {width: 4}, content: '抑郁', type: 'text'},
            {config: {width: 4}, content: '创伤', type: 'text'},
            {config: {width: 4}, content: '辐射', type: 'text'},
            //{ config: { width: 24, content: '' }, type: 'divider' },
            {config: {width: 24}, content: '属性', type: 'text'},
            {config: {width: 4}, content: '诡术', type: 'text'},
            {config: {width: 4}, content: '意识形态', type: 'text'},
            {config: {width: 4}, content: '力量', type: 'text'},
            {config: {width: 4}, content: '灵巧', type: 'text'},
            {config: {width: 4}, content: '医术', type: 'text'},
            {config: {width: 4}, content: '知识', type: 'text'},
        ])
    }
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


