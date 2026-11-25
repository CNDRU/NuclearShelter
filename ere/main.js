const era = require('#/era-electron');
const maps = require('#/map/MapNodes.json');
const mapHash = new Map();
const mapNodePrefix = "1"
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
    initMapHash()
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
    let x = node.x
    let y = node.y
    let k = 0;
    let list = new Array(9);
    for(let i = x-1; i <= x+1; i++) {
        for (let j = y-1; j <= y+1; j++) {
            printMapNode([i,j],list,k)
            k++
        }
    }
    era.printMultiColumns(list)
    // 标题
    //era.printMultiColumns( [{button: {width: 8}, content: node.name, type: 'button',accelerator: Math.trunc(Math.pow(10,node.id%10))+node.id, config:{align: 'center'}, offset: 8}])
   // era.print(node.name);
    era.print(node.desc);
    era.drawLine();
}
function triggerBuildingEvent(nodeId) {
    era.clear();
    const node = getMapNodeById(nodeId);
    era.print(`你来到了${node.name}`);
    era.printButton("返回地图", renderMapUI);
}

// 根据id找单个节点对象
function getMapNodeById(nodeId){
    for (const [key, node] of Object.entries(maps)){
        const id = node.id;
        if(id === nodeId){
            return node;
        }
    }
    return null;
}
function initMapHash(){
    for(const [key, node] of Object.entries(maps)){
        const pos = `${node.x},${node.y}`
        mapHash.set(pos, node)
    }

}
function printMapNode(pos,list,k){
    let target = mapHash.get(serializePos(pos))
    if(target!==null && target!==undefined){
        list[k]={config: {width: 8}, content: target.name, type: 'button',accelerator:Number(mapNodePrefix+target.id)};
    }else{
        list[k]={config: {width: 8}, content:' ', type: 'text'};
    }
}
function deserializePos(pos){
    let raw = pos.split(',').map(Number)
    return [raw[0],raw[1]];
}
function serializePos(pos){
    return `${pos[0]},${pos[1]}`;
}


