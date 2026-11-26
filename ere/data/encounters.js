/**
 * 随机事件表。
 * 只加数据，不改逻辑：
 *   chance  触发概率
 *   entries 事件列表
 *     weight  权重
 *     when    (context) => boolean，可选，用来限定触发条件
 *     steps   事件步骤，交给 scene.run 执行
 *     textKey / labelKey  文本键，查 data/locales/<语言>.json
 */
module.exports = {
    TRAVEL: {
        chance: 0.2,
        entries: [
            {
                id: 'drunk',
                weight: 3,
                steps: [
                    {textKey: 'event.drunk.arrive'},
                    {textKey: 'event.drunk.ask'},
                    {
                        textKey: 'event.drunk.question',
                        choices: [
                            {
                                labelKey: 'event.drunk.choice.fire',
                                steps: [{
                                    textKey: 'event.drunk.fire',
                                    minutes: 5,
                                    effects: {flag: {drunk_helped: 1}}
                                }]
                            },
                            {
                                labelKey: 'event.drunk.choice.ignore',
                                steps: [{textKey: 'event.drunk.ignore'}]
                            },
                            {
                                labelKey: 'event.drunk.choice.push',
                                steps: [{textKey: 'event.drunk.push'}]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'pipe',
                weight: 2,
                steps: [
                    {textKey: 'event.pipe.arrive'},
                    {
                        textKey: 'event.pipe.blocked',
                        choices: [
                            {
                                labelKey: 'event.pipe.choice.climb',
                                steps: [{textKey: 'event.pipe.climb'}]
                            },
                            {
                                labelKey: 'event.pipe.choice.detour',
                                steps: [{
                                    textKey: 'event.pipe.detour',
                                    minutes: 10
                                }]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'footsteps',
                weight: 1,
                steps: [
                    {textKey: 'event.footsteps.arrive'},
                    {textKey: 'event.footsteps.follow'},
                    {
                        textKey: 'event.footsteps.decide',
                        choices: [
                            {
                                labelKey: 'event.footsteps.choice.look',
                                steps: [{textKey: 'event.footsteps.look'}]
                            },
                            {
                                labelKey: 'event.footsteps.choice.hurry',
                                steps: [{textKey: 'event.footsteps.hurry'}]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};
