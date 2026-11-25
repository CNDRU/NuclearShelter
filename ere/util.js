const mapNodePrefix = "100";
const titlePrefix = "-100";

function deserializePos(pos) {
    const raw = pos.split(',').map(Number);
    return [raw[0], raw[1]];
}

function serializePos(pos) {
    return `${pos[0]},${pos[1]}`;
}

function numberPrefix(prefix, num) {
    return Number(prefix + num);
}

module.exports = {
    mapNodePrefix,
    titlePrefix,
    serializePos,
    numberPrefix,
    deserializePos,
};
