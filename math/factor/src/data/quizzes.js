export const quizPool = [
  {
    question: "下列哪一步是所有因式分解的最高优先级？",
    options: [
      { text: "十字相乘", isCorrect: false },
      { text: "提取公因式 (GCF)", isCorrect: true },
      { text: "应用平方差公式", isCorrect: false }
    ],
    explanation: "无论多项式长什么样，第一步永远是扫描全局寻找并提取公因式。"
  },
  {
    question: "分解多项式 $x^2 - 81$ 的结果是？",
    options: [
      { text: "$(x-9)(x+9)$", isCorrect: true },
      { text: "$(x-81)(x+1)$", isCorrect: false },
      { text: "$(x-9)^2$", isCorrect: false }
    ],
    explanation: "这是两项式，符合平方差公式 $a^2-b^2=(a-b)(a+b)$，81是9的平方。"
  },
  {
    question: "根据 SOAP 口诀，立方差 $x^3 - 64$ 分解后的第二个因式（二次项）的符号应该是？",
    options: [
      { text: "全部为负 (- -)", isCorrect: false },
      { text: "一正一负 (+ -)", isCorrect: false },
      { text: "全部为正 (+ +)", isCorrect: true }
    ],
    explanation: "SOAP中的 O(Opposite) 和 AP(Always Positive) 说明第二个因式的符号是正、正。"
  },
  {
    question: "分解二次三项式 $x^2 + 6x + 8$，因式是？",
    options: [
      { text: "$(x+2)(x+4)$", isCorrect: true },
      { text: "$(x+1)(x+8)$", isCorrect: false },
      { text: "$(x+3)(x+3)$", isCorrect: false }
    ],
    explanation: "找两个数和为6，积为8。2+4=6, 2*4=8。"
  },
  {
    question: "对于多项式 $2x^2 + 5x - 3$，正确的十字相乘拆分（和为5）是？",
    options: [
      { text: "$(2x-1)(x+3)$", isCorrect: true },
      { text: "$(2x+1)(x-3)$", isCorrect: false },
      { text: "$(2x-3)(x+1)$", isCorrect: false }
    ],
    explanation: "交叉相乘: $2x*3 + (-1)*x = 6x - x = 5x$，匹配中间项。"
  },
  {
    question: "用艾森斯坦判别法判定 $4x^3 + 14x^2 + 7x + 21$，哪个质数能证明它不可约？",
    options: [
      { text: "质数 2", isCorrect: false },
      { text: "质数 7", isCorrect: true },
      { text: "质数 3", isCorrect: false }
    ],
    explanation: "7 不能整除 4；能整除 14, 7, 21；49 不能整除常数项 21。判定成功！"
  }
];
