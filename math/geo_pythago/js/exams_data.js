/**
 * 模拟考场试卷配置（2 套真题模拟卷，覆盖全部 8 大招式）
 */
(function (global) {
  'use strict';

  var EXAMS = [
    {
      id: 'exam_a',
      title: '模拟卷 A · 80 分达标基础卷',
      desc: '覆盖剪拼、勾股必考、内外弦图、穿外衣与内线十字，限时 20 分钟，答对 6 题（75 分以上）即稳过 80 分线！',
      durationMin: 20,
      passScore: 80,
      puzzleIds: ['P01', 'P04', 'P06', 'P09', 'P15', 'P18', 'P22', 'P26']
    },
    {
      id: 'exam_b',
      title: '模拟卷 B · 弦图辅助线与 95+ 冲刺卷',
      desc: '专攻老师笔记压轴题：勾股斜切、折叠平方差、60°作高、等腰梯形穿外衣、双直角五边形与 4 倍旋转大弦图！',
      durationMin: 25,
      passScore: 80,
      puzzleIds: ['P03', 'P13', 'P16', 'P20', 'P24', 'P25', 'P28', 'P30']
    }
  ];

  global.GeoExamsData = {
    EXAMS: EXAMS
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.GeoExamsData;
  }
})(typeof window !== 'undefined' ? window : globalThis);
