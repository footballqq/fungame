/* js/scenario.js - 游戏剧情文字脚本与推进逻辑 */
/* codex: 2026-06-06 增加剧情跳转方法 jumpToPhase 以加载 localStorage 进度 */

class ScenarioEngine {
    constructor(gameState) {
        this.state = gameState;
    }

    // 启动游戏剧情入口
    startStory() {
        this.state.updateHeaderTime();
        this.triggerStage1();
    }

    // 跳转至特定阶段（调试与加载进度）
    jumpToPhase(phaseNum) {
        this.state.updateHeaderTime();
        if (phaseNum === 1) this.triggerStage1();
        else if (phaseNum === 2) this.triggerStage2();
        else if (phaseNum === 3) this.triggerStage3();
        else if (phaseNum === 4) this.triggerStage4();
        else if (phaseNum === 5) this.triggerStage5();
        else if (phaseNum === 6) this.triggerStage6();
        else if (phaseNum === 7) this.triggerStage7();
        else this.triggerStage1();
    }

    // ==================== 阶段 1：降温降功准备 ====================
    triggerStage1() {
        this.state.currentPhase = 1;
        document.getElementById('game-phase-tag').textContent = "试验准备";
        this.state.switchView('view-reactor');

        this.state.showDialogue(
            "阿纳托利·迪亚特洛夫 (副总工程师)",
            "阿基莫夫，今天我们要对4号机组进行例行停机，并在此时执行发电机惰转测试。这是极其关键的安全试验！立刻通过棒组控制将热功率降低至 700 - 1000 MWth 的试验额定区间。然后，手动断开应急堆芯冷却系统（ECCS）！",
            [
                {
                    text: "阿基莫夫: 收到，我们立刻按程序开始降低反应堆功率。",
                    callback: () => {
                        this.state.power = 1600; // 快速降低到中间功率
                        this.state.addMinutes(120); // 时间跳过2小时
                        this.triggerECCSQuestion();
                    }
                },
                {
                    text: "阿基莫夫: 迪亚特洛夫同志，反应堆状态目前还不算稳定，且断开ECCS等于拔掉了唯一的应急水泵。这违背了操作规程！",
                    callback: () => {
                        this.state.showDialogue(
                            "阿纳托利·迪亚特洛夫",
                            "规程？这台反应堆是我看着建起来的！在西伯利亚，我经手的反应堆比你吃过的面包还多！基辅电网已经催了无数次。你现在只有两个选择：听从我的命令，立刻断开ECCS；或者我撤销你的值班长职务，换个听话的人来签字。你那点微薄的退休金和前途，自己掂量吧！",
                            [
                                { text: "阿基莫夫: （低头）服从命令，开始降功并断开系统...", callback: () => {
                                    this.state.power = 1600;
                                    this.state.addMinutes(120);
                                    this.triggerECCSQuestion();
                                }},
                                { text: "坚决拒绝执行违规操作", callback: () => {
                                    this.state.triggerGameOver("你拒绝了迪亚特洛夫的命令。你被当场免职，剥夺了值班长资格并被记录档案。你虽然失去工作，但成功避免成为爆炸的直接操作者。");
                                }}
                            ]
                        );
                    }
                }
            ]
        );
    }

    triggerECCSQuestion() {
        this.state.showDialogue(
            "系统提示",
            "现在功率已降至 1600 MW。为了防止测试启动时系统误判定并自动向核心灌入水流而破坏试验数据，必须手动关闭应急堆芯冷却系统 (ECCS)。这等于彻底剥夺了反应堆对失控过热时的自我防御能力。",
            [
                {
                    text: "（合上电闸）手动切断 ECCS 并等待电网命令",
                    callback: () => {
                        this.state.addMinutes(600); // 蒙太奇，九小时电网延误
                        this.triggerStage2();
                    }
                }
            ]
        );
    }

    // ==================== 阶段 2：电网延误与SKALA查询 ====================
    triggerStage2() {
        this.state.currentPhase = 2;
        document.getElementById('game-phase-tag').textContent = "电网延误";
        this.state.switchView('view-skala');
        
        // 初始化SKALA终端
        window.skala.init();

        this.state.showDialogue(
            "旁白",
            "4月25日 14:00。就在你断开冷却系统后，基辅电网调度员突然来电，咆哮着称工业区用电吃紧，命令你必须维持反应堆输出，严禁测试停机！由于体制的死板调度，反应堆在“无冷却防御”状态下滞留在 1600 MW 长达 9 个小时。在这绝望的九小时里，堆芯里的中子强吸收剂——氙-135 正在堆芯中大量积聚。反应堆正滑向致命的“反应堆毒化阱”...\n\n深夜 23:04，基辅终于同意测试。为了判断当前反应性余度（ORM），你需要通过计算机查询核心数据。\n\n【交互任务】：点击下方选项或者在终端中直接点击快捷指令运行 00000302，调用 PRIZMA 计算反应堆 ORM 值。",
            [
                {
                    text: "⌨ 运行指令 00000302 (启动 PRIZMA 计算 ORM)",
                    callback: () => {
                        const inputEl = document.getElementById('skala-input');
                        if (inputEl) inputEl.value = "00000302";
                        window.skala.executeCommand("00000302");
                    }
                }
            ]
        );
    }

    // SKALA查询完ORM后触发
    onPrizmaQueried() {
        this.state.showDialogue(
            "列昂尼德·托普图诺夫 (操作员)",
            "阿基莫夫同志！数据出来了……这太可怕了！计算显示我们的 ORM（操作反应性裕度）已经跌到了 12.0 根控制棒！安全红线是 15 根！核心已经被氙-135严重‘毒死’，对控制棒响应极其迟钝。此时我们必须立刻停堆，等待24小时直到氙衰退完毕！",
            [
                {
                    text: "阿基莫夫: 我同意。迪亚特洛夫同志，堆芯毒性太大，不能再试验了！",
                    callback: () => {
                        this.state.showDialogue(
                            "阿纳托利·迪亚特洛夫",
                            "一派胡言！你们这些刚从学校出来的毛头小子根本不懂大修！ORM只是计算滞后的估算。物理学规律在核电站里也是要服从党和计划的！如果现在停机，今年的劳动红旗就没了，整个轮班组也会被剥夺工程师头衔！把自动控制关闭，手动拔出控制棒，把功率强行给我拉上去！",
                            [
                                {
                                    text: "无奈顺从：切入手动，强行拔出控制棒，功率艰难稳定在 200 MW",
                                    callback: () => {
                                        this.state.power = 200;
                                        this.state.orm = 6.0; // 危险的ORM
                                        this.state.addMinutes(15);
                                        this.triggerStage3();
                                    }
                                },
                                {
                                    text: "阿基莫夫: 这违反了核安全绝对禁令，我坚决拒绝执行命令！",
                                    callback: () => {
                                        this.state.triggerGameOver("你坚决拒绝拔出控制棒。愤怒的迪亚特洛夫强行推开了你，命令托普图诺夫动手。你虽然保全了自己的生命，但未能阻止灾难的发生。");
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    }

    // ==================== 阶段 3：测试与爆炸 ====================
    triggerStage3() {
        this.state.currentPhase = 3;
        document.getElementById('game-phase-tag').textContent = "断电测试";
        this.state.switchView('view-reactor');
        
        // 激活滑动条，并将初始控制棒拔出率设为 93% 以匹配极低的 ORM (6.0)
        const rodSlider = document.getElementById('rod-slider');
        if (rodSlider) {
            rodSlider.value = 93;
            rodSlider.disabled = false;
        }
        window.reactor.rodPosition = 93;
        
        // 保持AZ-5停堆按钮锁定 (必须先拉开安全罩!)
        document.getElementById('btn-az5').disabled = true;
        
        // 保证安全罩复位为闭合状态
        const shield = document.getElementById('az5-shield');
        if (shield) {
            shield.classList.remove('open');
            shield.querySelector('.shield-label').textContent = "AZ-5 安全罩";
        }
        
        // 初始化反应堆物理环路
        window.reactor.start();

        this.state.showDialogue(
            "阿纳托利·迪亚特洛夫",
            "很好，功率稳定在 200 MW。一切尽在掌控。01:23:04，关闭汽轮机蒸汽阀门！涡轮惰转测试正式开始！",
            [
                {
                    text: "切断发电机汽轮机蒸汽阀门，开始断电惰转",
                    callback: () => {
                        // 汽轮发电机减速，主泵流量暴跌
                        window.reactor.coolantFlow = 24000; 
                        window.reactor.az5Unlockable = true; // 触发事故，解锁 AZ-5 安全防误触罩
                        this.state.showDialogue(
                            "列昂尼德·托普图诺夫",
                            "不好了！水泵减速导致核心温度急剧上升，水正在剧烈沸腾！蒸汽空泡份额呈指数级暴增！正空泡反馈激活了！天啊，热功率正在疯长！300... 600... 1200 MW！核心中子通量闪烁，反应堆局部过热！快，阿基莫夫，按下紧急停堆！",
                            []
                        );
                    }
                }
            ]
        );
    }

    // 反应堆爆炸后触发
    onReactorExplode() {
        // 停止物理计算与警报声
        window.reactor.stop();
        if (window.audio) {
            window.audio.stopAlarm();
            window.audio.stopGeigerStatic();
            window.audio.playBeep(200, 0.8, 0.4); // 轰鸣巨响
        }

        this.state.addSeconds(58); // 时间跳跃到 1:23:58 爆炸

        this.state.showDialogue(
            "系统提示",
            "1:23:58。当 AZ-5 按键被按下的那一刻，控制棒底部的石墨置换端头瞬间排开了管内的水，不仅没有熄灭反应堆，反而诱发了极端的'正停堆效应'，核心在一瞬间超载了数百倍！一声剧烈的蒸汽爆炸将重达 2000 吨的生物屏蔽盖掀飞。放射性物质倾泻到夜空之中。\n\n灾难已经铸就。",
            [
                {
                    text: "探查控制室废墟...",
                    callback: () => this.triggerStage4()
                }
            ]
        );
    }

    // ==================== 阶段 4：盖革探测 ====================
    triggerStage4() {
        document.body.classList.remove('screen-shake');
        this.state.currentPhase = 4;
        document.getElementById('game-phase-tag').textContent = "辐射评估";
        this.state.switchView('view-geiger');
        
        window.geiger.init();

        this.state.showDialogue(
            "迪亚特洛夫",
            "控制室的常备辐射计显示只有 3.6 伦琴/小时。一定是氢气水箱炸了，堆芯没有坏。你，立刻手持盖革探测器，去走廊深处探明情况！如果有必要，打开角落的保险柜取回高量程仪器。",
            []
        );
    }

    // 玩家在保险箱中找出仪器并探测到15000伦琴
    onSafeUnlocked(realDose) {
        this.state.showDialogue(
            "旁白",
            `你成功输入密码，取出了被锁在铁柜里的高量程电离室探测器。当你走近爆心废墟走廊时，仪器表盘指针瞬间爆表，发出令人毛骨悚然的电子撕裂爆鸣音！\n\n真实数值读数：${realDose.toLocaleString()} 伦琴/小时！(普通仪器的数千倍！)`,
            [
                {
                    text: "向厂长布留哈诺夫报告：堆芯已炸毁，辐射高达1.5万伦琴！",
                    callback: () => {
                        this.state.showDialogue(
                            "厂长 布留哈诺夫",
                            "胡说八道！你的高量程仪器一定坏了，RBMK反应堆是不可能爆炸的！我已经向莫斯科报告了：辐射水平为安全上限的 3.6 伦琴。不算太好，但也算不上可怕。为了不扩散谣言，我们必须切断普里皮亚季的一切外部通讯！",
                            [
                                { text: "接受命令，协助信息管制", callback: () => this.triggerStage5() }
                            ]
                        );
                    }
                }
            ]
        );
    }

    // ==================== 阶段 5：封锁与大巴撤离 ====================
    triggerStage5() {
        this.state.currentPhase = 5;
        document.getElementById('game-phase-tag').textContent = "城市隔离";
        this.state.switchView('view-evacuation');

        window.evacuation.initPatchPanel();

        this.state.showDialogue(
            "克格勃主管",
            "为了国家安全，切断普里皮亚季长途通讯总板！防止破坏分子和境外特工在基辅或莫斯科造谣散布恐慌。\n\n【交互任务】：点击插孔，拔出标红的三个长途连线插孔。",
            []
        );
    }

    // 长途连线切断后
    onPhonesCut() {
        document.getElementById('patchpanel-box').style.display = 'none';
        
        this.state.showDialogue(
            "旁白",
            "4月27日 14:00。距离爆炸已经过去了整整 36 个小时。致命的放射性羽流终于突破了官僚的推诿墙，全城放射性超标数十万倍。当局终于下达了36小时迟到的疏散指令：允许4.9万平民临时携带三天干粮，乘车撤离。\n\n【互动任务】：派遣空闲大巴前往各个社区接回市民，大巴行驶时注意避开东北方向红色的高辐射羽流云！",
            [
                {
                    text: "启动普里皮亚季大巴撤离调度",
                    callback: () => {
                        window.evacuation.initEvacuationMap();
                    }
                }
            ]
        );
    }

    // 撤离完成
    onEvacuationCompleted(dose) {
        if (window.audio) window.audio.stopGeigerStatic();
        
        this.state.showDialogue(
            "官方广播 (女声重现)",
            "‘注意！注意！普里皮亚季市的居民们请注意……由于切尔诺贝利核电站发生事故，本市的辐射情况正在恶化。必须对市民进行临时疏散……请带齐必要文件和生活用品……’\n\n49,000名平民排队登车，看着空旷的家园，他们深知，这是永别。本次调度平民累积额外吸收辐射剂量：" + dose.toFixed(1) + " mSv。",
            [
                { text: "视角切换：北欧瑞典实验室", callback: () => this.triggerStage6() }
            ]
        );
    }

    // ==================== 阶段 6：瑞典福斯马克 ====================
    triggerStage6() {
        this.state.currentPhase = 6;
        document.getElementById('game-phase-tag').textContent = "国际风暴";
        this.state.switchView('view-forsmark');
        
        window.forsmark.initSpectrometer();

        this.state.showDialogue(
            "克里夫·罗宾逊",
            "4月28日清晨，瑞典福斯马克核电站。我刚走进车间，入口大门的辐射测量仪突然发出刺耳的啸叫。但我今天还没有接触过任何反应堆介质。在确认我们本站没有泄漏后，唯一的可能就是，有外源性核尘埃沾染了我的鞋底。我需要立刻对尘埃颗粒进行锗光谱分析，看看这些是什么元素。\n\n【互动任务】：选择参考同位素，平移参考波形，重合实测能谱，验证三大元素成分。",
            []
        );
    }

    // 每次验证出一个同位素
    onIsotopeAnalyzed(msg) {
        this.state.showDialogue(
            "分析仪器反馈",
            msg,
            []
        );
    }

    // 气流地图锁定后
    onSourceLocked() {
        this.state.showDialogue(
            "瑞典国家安全委员会",
            "风向轨迹反向追溯完毕！轨迹穿过波罗的海，源头精确指向苏联乌克兰切尔诺贝利区域。这是明显的堆芯熔毁产物。瑞典外交部立即向苏联发出最强硬抗议，逼迫克里姆林宫在当晚的电视新闻上，首度承认事故。切尔诺贝利的谎言大坝被全球舆论彻底冲垮。",
            [
                { text: "进入救援行动：清理者战役", callback: () => this.triggerStage7() }
            ]
        );
    }

    // ==================== 阶段 7：清理者行动 ====================
    triggerStage7() {
        this.state.currentPhase = 7;
        document.getElementById('game-phase-tag').textContent = "清理行动";
        this.state.switchView('view-liquidators');
        
        // 绑定清理者各微游戏的激活选择
        const buttons = document.querySelectorAll('.btn-liq-select');
        buttons.forEach(b => {
            b.replaceWith(b.cloneNode(true));
        });
        
        // 重新获取并绑定事件
        document.querySelectorAll('.btn-liq-select').forEach(b => {
            b.addEventListener('click', (e) => {
                const sub = b.getAttribute('data-subgame');
                window.liquidators.startSubgame(sub);
            });
        });

        window.liquidators.showMenu();

        this.state.showDialogue(
            "尼古拉·塔拉卡诺夫 少将",
            "同志们！反应堆废墟正在源源不断向欧亚大陆喷洒毒物。为了消灭这只原子怪兽，祖国派出了我们六十万军民。这是人类历史上最壮烈的清理战役。从直升机封堵、水池排水，到楼顶人工清理石墨，我们没有退路！完成这三项任务，把反应堆永久封存！",
            []
        );
    }

    // 屋顶清理圆满完成 (游戏大结局)
    onRoofCleaned() {
        if (window.audio) {
            window.audio.stopGeigerStatic();
        }

        this.state.showDialogue(
            "大结局：向清理者致敬",
            "Masha屋顶清理完毕，最后一个高危放射源被扔回了炉心。随后，六十万军民建造了巨大的混凝土石棺，将其永久包裹。\n\n这场物理学与体制谎言的灾难在清理者无私的英雄主义奉献中宣告落幕。无数年轻的清理者为了拯救欧罗巴，将他们的健康与生命留在了这片死寂的土地上。\n\n历史不会忘记他们。切尔诺贝利的钟声长鸣，警示后世：真相的代价，是任何人也无法逃避的。\n\n【模拟成功】",
            [
                {
                    text: "重新载入模拟",
                    callback: () => {
                        window.location.reload();
                    }
                }
            ]
        );
    }
}

// 挂载至全局
window.ScenarioEngine = ScenarioEngine;
