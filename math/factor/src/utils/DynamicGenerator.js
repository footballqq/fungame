const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randNonZeroInt = (min, max) => {
  let v = 0;
  while (v === 0) { v = randInt(min, max); }
  return v;
};
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// --- Generators ---

const genLikeTerms = () => {
  const a = randNonZeroInt(-10, 10);
  const b = randNonZeroInt(-10, 10);
  const varName = randChoice(['x', 'y', 'a', 'ab', 'x^2']);
  
  const q = `${a}${varName} ${b > 0 ? '+' : ''}${b}${varName}`;
  const correctVal = a + b;
  const correctText = correctVal === 0 ? '0' : (correctVal === 1 && varName !== '') ? varName : (correctVal === -1 && varName !== '') ? `-${varName}` : `${correctVal}${varName}`;
  
  // Wrong options
  const wrongVal1 = a - b;
  const wrong1Text = wrongVal1 === 0 ? '0' : `${wrongVal1}${varName}`;
  const wrongVal2 = Math.abs(a) + Math.abs(b);
  const wrong2Text = `${wrongVal2}${varName}`;
  const wrong3Text = `${correctVal}`; // Forgot variable
  
  const options = [
    { text: `$${correctText}$`, isCorrect: true, explanation: `正确！$${a} ${b > 0 ? '+' : ''} ${b} = ${correctVal}$。` },
    { text: `$${wrong1Text}$`, isCorrect: false, explanation: `符号算错啦。` },
    { text: `$${wrong2Text}$`, isCorrect: false, explanation: `不要只看绝对值，要注意正负号。` }
  ];
  if (correctVal !== 0) options.push({ text: `$${wrong3Text}$`, isCorrect: false, explanation: `漏掉字母部分了！同类项合并，字母是不变的。` });

  return {
    type: 'choice',
    question: `合并同类项：$${q}$`,
    options: shuffle(options.slice(0, 3))
  };
};

const genDistributive = () => {
  const a = randNonZeroInt(-5, 5);
  const b = randNonZeroInt(1, 5);
  const c = randNonZeroInt(-5, 5);
  const v = randChoice(['x', 'a']);
  
  // a(b v + c)
  const q = `${a === -1 ? '-' : a === 1 ? '' : a}(${b === 1 ? v : b+v} ${c > 0 ? '+' : ''}${c})`;
  
  const term1 = a * b;
  const term2 = a * c;
  const correctText = `${term1}${v} ${term2 > 0 ? '+' : ''}${term2}`;
  
  // Wrong options
  // Forgot to multiply c
  const wrong1 = `${term1}${v} ${c > 0 ? '+' : ''}${c}`;
  // Sign error on c
  const wrong2 = `${term1}${v} ${-term2 > 0 ? '+' : ''}${-term2}`;
  // Added instead of multiply
  const wrong3 = `${a+b}${v} ${a+c > 0 ? '+' : ''}${a+c}`;

  const options = [
    { text: `$${correctText}$`, isCorrect: true, explanation: `完美！外面的 ${a} 乘遍了里面的每一项。` },
    { text: `$${wrong1}$`, isCorrect: false, explanation: `漏乘了常数项！外面的数字也要乘给它。` },
    { text: `$${wrong2}$`, isCorrect: false, explanation: `符号出错了！要注意负号的乘法。` },
    { text: `$${wrong3}$`, isCorrect: false, explanation: `这是乘法分配律，不是加法哦。` }
  ];

  return {
    type: 'choice',
    question: `展开表达式：$${q}$`,
    options: shuffle(options)
  };
};

const genDiffSquares = () => {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  const v = randChoice(['x', 'm', 'p']);
  
  const q = `${a === 1 ? '' : a*a}${v}^2 - ${b*b}`;
  const termA = a === 1 ? v : `${a}${v}`;
  
  return {
    type: 'input',
    question: `分解平方差：$${q}$`,
    correctAnswers: [
      `(${termA}-${b})(${termA}+${b})`,
      `(${termA}+${b})(${termA}-${b})`
    ],
    displayAnswer: `$(${termA}+${b})(${termA}-${b})$`,
    explanation: `项数雷达：两项！底数分别是 $${termA}$ 和 $${b}$。根据 $a^2-b^2=(a+b)(a-b)$ 拆分。`
  };
};

const genPerfectSquare = () => {
  const a = 1; // Keep it simple a=1 for now
  const b = randNonZeroInt(-9, 9);
  const v = 'x';
  
  const b2 = b * b;
  const mid = 2 * a * b;
  const q = `${v}^2 ${mid > 0 ? '+' : ''}${mid}${v} + ${b2}`;
  
  return {
    type: 'input',
    question: `分解完全平方式：$${q}$`,
    correctAnswers: [`(${v}${b>0?'+':''}${b})^2`, `(${v}${b>0?'+':''}${b})(${v}${b>0?'+':''}${b})`],
    displayAnswer: `$(${v}${b>0?'+':''}${b})^2$`,
    explanation: `首项是 $${v}^2$，末项是 $${Math.abs(b)}^2$。中间项恰好是 $2 \\times ${Math.abs(b)} \\times ${v}$，并且符号为 ${b>0?'正':'负'}。`
  };
};

const genTrinomial = () => {
  const r1 = randNonZeroInt(-9, 9);
  const r2 = randNonZeroInt(-9, 9);
  const b = r1 + r2;
  const c = r1 * r2;
  
  let q = `x^2`;
  if (b !== 0) q += ` ${b > 0 ? '+' : ''}${b === 1 ? 'x' : b === -1 ? '-x' : b+'x'}`;
  if (c !== 0) q += ` ${c > 0 ? '+' : ''}${c}`;
  
  return {
    type: 'input',
    question: `十字相乘分解：$${q}$`,
    correctAnswers: [
      `(x${r1>0?'+':''}${r1})(x${r2>0?'+':''}${r2})`,
      `(x${r2>0?'+':''}${r2})(x${r1>0?'+':''}${r1})`
    ],
    displayAnswer: `$(x${r1>0?'+':''}${r1})(x${r2>0?'+':''}${r2})$`,
    explanation: `寻找和为 $${b}$，积为 $${c}$ 的两个数。它们是 $${r1}$ 和 $${r2}$。`
  };
};

export const generateDynamicQuiz = () => {
  const generators = [
    genLikeTerms,
    genDistributive,
    genDiffSquares,
    genPerfectSquare,
    genTrinomial,
    genTrinomial // weight trinomial more
  ];
  
  const generator = randChoice(generators);
  return generator();
};
