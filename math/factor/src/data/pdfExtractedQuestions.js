import rawQuestions from '../../pdfdata/questions_all.json';
import questionSummary from '../../pdfdata/questions_summary.json';

// PDF 提取结果包含说明页、截断答案和未恢复的字体控制字符。
// 仅接入能以当前 KaTeX 渲染并具有可用 SymPy 计算答案的因式分解题。
const isUsableMathExpression = (value) => (
  typeof value === 'string'
  && /^[0-9A-Za-z+\-*/^().\s]+$/.test(value)
  && /[A-Za-z]/.test(value)
  && !value.includes(',')
);

const toKatex = (expression) => expression
  .replace(/\*/g, ' \\cdot ')
  .replace(/\s+/g, ' ')
  .trim();

export const pdfQuestionSummary = questionSummary;

export const verifiedPdfQuestions = rawQuestions
  .filter((question) => (
    question.question_type === 'factorization'
    && isUsableMathExpression(question.expression)
    && isUsableMathExpression(question.calculated_answer)
    && question.expression !== question.calculated_answer
  ))
  .map((question) => ({
    id: question.id,
    q: toKatex(question.expression),
    ans: toKatex(question.calculated_answer),
    method: question.category,
    categoryCode: question.category_code,
    source: question.source,
    answerSource: question.is_calculated_answer ? 'SymPy calculated answer' : 'book answer'
  }));
