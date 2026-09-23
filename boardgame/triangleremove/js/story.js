// codex: 2026-09-23 沉浸式星阵封印故事剧情系统：角色对白、打字机动效、章节推进与世界观演出
(function(root) {
  'use strict';

  class StoryManager {
    constructor(audio) {
      this.audio = audio;
      this.currentChapterIndex = 0;
      this.currentDialogueIndex = 0;
      this.isTyping = false;
      this.typingTimer = null;
      this.onDialogueChange = null;

      this.chapters = [
        {
          id: 'prologue',
          title: '序章：失控的三角座星阵',
          bgDesc: '星穹天文台 · 深夜',
          dialogues: [
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '糟糕了！观测镜里……三角座·新星（Triangulum Nova）的以太能量读数正在狂飙！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '咕咕！艾尔，那是古代贤者布下的“正三角星阵”！每当任意三颗星核构成等边三角形，魔力就会发生剧烈共鸣！'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '如果共鸣回路继续闭合，整个天文台都会被以太海啸吞没！我们必须用星光权杖熄灭一些星核！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '但是切记，星核是维持结界的珍贵能源，我们必须以【最少数量】的星核破坏全部正三角形回路！让我们从基础星阵开始排查！'
            }
          ]
        },
        {
          id: 'chapter1',
          title: '第一章：初试权杖 (3点阵)',
          bgDesc: '试炼法阵 · 3枚星核',
          dialogues: [
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '看，这是最基础的 3 颗星核，它们刚好围成 1 个正三角形。'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '我明白了！三角形由 3 个顶点决定，只要拿掉其中任何 1 颗，这个三角形就无法成立了！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '完全正确！熄灭 1 颗星石，让初阶共鸣平息吧！'
            }
          ]
        },
        {
          id: 'chapter2',
          title: '第二章：倒立与复合 (6点阵)',
          bgDesc: '初级祭坛 · 6枚星核',
          dialogues: [
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '星阵扩展到了 6 颗星石！除了 3 个正向的小三角形，中间居然还衍生出一个倒立的三角形！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '别忘了最外圈由三个角构成的边长 2 的大正三角形！一共是 5 个正三角形。'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '如果盲目乱点，可能要熄灭 3~4 颗星石；但如果精准选择公共交点，2 颗就足够了！'
            }
          ]
        },
        {
          id: 'chapter3',
          title: '第三章：倾斜的幽灵 (10点阵)',
          bgDesc: '星核中枢 · 10枚星核',
          dialogues: [
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '奇怪……我已经把所有正立和倒立的三角形顶点都打乱了，为什么警报还在响？！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '咕咕咕！睁大眼睛！点阵里藏着【倾斜的边长 √3 正三角形】！它们就像暗影幽灵一样斜跨在六边形骨架上！'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '竟然还有斜着形成的正三角形！这太神奇了，几何学原来如此深邃！'
            }
          ]
        },
        {
          id: 'chapter4',
          title: '第四章：十五星宿大决战 (15点原题)',
          bgDesc: '天穹王座 · 15枚星核全开',
          dialogues: [
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '警告！警告！15 颗核心星石全部被激活了！多达 35 组正三角形共鸣波正在撕裂空间！'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '正向、倒向、边长√3倾斜、边长√7倾斜……交织成了一张巨大的魔力天网！'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '鸽巢原理告诉我们，至少需要 5 颗星石；但要切断全部 35 重共鸣，必须极其精准！'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '交给我吧！星辰守望者的使命，就是用最完美的数学智慧守护星穹和平！'
            }
          ]
        },
        {
          id: 'epilogue',
          title: '终章：星穹永恒守望',
          bgDesc: '星穹天文台 · 黎明曙光',
          dialogues: [
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '成功了！35 重共鸣全部平息！星石不再有任何多余的狂暴链接！'
            },
            {
              speaker: '艾尔',
              role: '星学者学徒',
              avatar: '🧙‍♂️',
              text: '正好熄灭了 7 颗星石！完美的 120 度三重旋转对称，宛如大自然的奇迹。'
            },
            {
              speaker: '波波',
              role: '以太灵鸮',
              avatar: '🦉',
              text: '恭喜你，艾尔！你已经掌握了极值组合学的精髓，正式晋升为【星穹大几何贤者】！'
            }
          ]
        }
      ];
    }

    getChapter(index) {
      if (index < 0) index = 0;
      if (index >= this.chapters.length) index = this.chapters.length - 1;
      return this.chapters[index];
    }

    setChapter(index) {
      this.currentChapterIndex = index;
      this.currentDialogueIndex = 0;
      return this.getCurrentDialogue();
    }

    getCurrentDialogue() {
      const chapter = this.getChapter(this.currentChapterIndex);
      return {
        chapterTitle: chapter.title,
        bgDesc: chapter.bgDesc,
        dialogue: chapter.dialogues[this.currentDialogueIndex],
        dialogueIndex: this.currentDialogueIndex,
        totalDialogues: chapter.dialogues.length,
        hasPrev: this.currentDialogueIndex > 0,
        hasNext: this.currentDialogueIndex < chapter.dialogues.length - 1
      };
    }

    nextDialogue() {
      const chapter = this.getChapter(this.currentChapterIndex);
      if (this.currentDialogueIndex < chapter.dialogues.length - 1) {
        this.currentDialogueIndex++;
        return this.getCurrentDialogue();
      }
      return null; // 本章结束
    }

    prevDialogue() {
      if (this.currentDialogueIndex > 0) {
        this.currentDialogueIndex--;
        return this.getCurrentDialogue();
      }
      return null;
    }

    /**
     * 打字机效果呈现对白文本
     */
    typewriteText(element, fullText, onDone) {
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }

      this.isTyping = true;
      element.textContent = '';
      let charIdx = 0;

      this.typingTimer = setInterval(() => {
        if (charIdx < fullText.length) {
          element.textContent += fullText[charIdx];
          charIdx++;
          if (this.audio && charIdx % 2 === 0) {
            this.audio.playStoryTyping();
          }
        } else {
          clearInterval(this.typingTimer);
          this.typingTimer = null;
          this.isTyping = false;
          if (typeof onDone === 'function') onDone();
        }
      }, 26);
    }

    fastForward(element, fullText) {
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
      this.isTyping = false;
      element.textContent = fullText;
    }
  }

  root.StoryManager = StoryManager;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryManager };
  }
})(typeof window !== 'undefined' ? window : globalThis);
