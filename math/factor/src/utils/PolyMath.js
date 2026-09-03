// Helper math functions for polynomial generation

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randNonZeroInt = (min, max) => {
  let v = 0;
  while (v === 0) { v = randInt(min, max); }
  return v;
};

const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// A term signature is a parsed object of variables to exponents, e.g., {x: 2, y: 1}
// Format it into a string like "x^2y"
const formatSignature = (sigObj) => {
  const vars = Object.keys(sigObj).sort();
  let res = "";
  for (let v of vars) {
    if (sigObj[v] === 0) continue;
    if (sigObj[v] === 1) res += v;
    else res += `${v}^${sigObj[v]}`;
  }
  return res;
};

// Format a single term (e.g. 1x -> x, -1x -> -x, 0x -> 0)
const formatTerm = (coeff, sigStr) => {
  if (coeff === 0) return '';
  if (coeff === 1 && sigStr !== '') return sigStr;
  if (coeff === -1 && sigStr !== '') return `-${sigStr}`;
  return `${coeff}${sigStr}`;
};

// Format a polynomial from an array of terms {c: number, sig: string}
const formatPoly = (terms) => {
  let res = '';
  let first = true;
  for (let t of terms) {
    if (t.c === 0) continue;
    
    let termStr = formatTerm(t.c, t.sig);
    
    if (first) {
      res += termStr;
      first = false;
    } else {
      if (t.c > 0) {
        res += ` + ${termStr}`;
      } else {
        res += ` - ${formatTerm(Math.abs(t.c), t.sig)}`;
      }
    }
  }
  return res === '' ? '0' : res;
};

// Combine like terms
const simplifyTerms = (terms) => {
  const map = {};
  for (let t of terms) {
    if (!map[t.sig]) map[t.sig] = 0;
    map[t.sig] += t.c;
  }
  // Sort variables for consistent output, put constant '' at the end
  const sigs = Object.keys(map).sort((a, b) => {
    if (a === '') return 1;
    if (b === '') return -1;
    // Count total degree or length for sorting
    return b.length - a.length || a.localeCompare(b);
  });
  
  const res = [];
  for (let sig of sigs) {
    if (map[sig] !== 0) {
      res.push({c: map[sig], sig});
    }
  }
  return res;
};

// Generate pool of term signatures based on varCount
const generateSignaturePool = (varCount) => {
  const vars = ['x', 'y', 'z'].slice(0, varCount);
  const pool = [];
  
  if (varCount === 1) {
    pool.push({x: 1}, {x: 2}, {x: 3}, {});
  } else if (varCount === 2) {
    pool.push(
      {x: 1}, {y: 1}, {x: 2}, {y: 2},
      {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}, {}
    );
  } else {
    pool.push(
      {x: 1}, {y: 1}, {z: 1},
      {x: 1, y: 1}, {y: 1, z: 1}, {x: 1, z: 1},
      {x: 2, y: 1}, {x: 1, y: 2}, {x: 1, y: 1, z: 1}, {}
    );
  }
  
  return pool.map(formatSignature);
};

// Multiply two signature strings
const multiplySignatures = (sig1, sig2) => {
  // Parse sig1
  const parseSig = (str) => {
    const obj = {};
    if (!str) return obj;
    // Regex matches variables and optional exponents: e.g., x^2 or y
    const matches = str.match(/[a-z](\^\d+)?/g);
    if (matches) {
      for (let m of matches) {
        const parts = m.split('^');
        obj[parts[0]] = parts[1] ? parseInt(parts[1]) : 1;
      }
    }
    return obj;
  };
  
  const o1 = parseSig(sig1);
  const o2 = parseSig(sig2);
  const res = {...o1};
  for (let k in o2) {
    res[k] = (res[k] || 0) + o2[k];
  }
  return formatSignature(res);
};


export class PolyGenerator {
  
  // Type 1: Like Terms
  static generateLikeTerms(varCount, nested) {
    const fullPool = generateSignaturePool(varCount);
    
    // Pick 2 to 4 random signatures from the pool to act as "like terms" basis
    const numSigs = randInt(2, Math.min(4, fullPool.length));
    const basisSigs = [];
    
    // Force at least one complex signature for 2 or 3 vars
    if (varCount > 1) {
      const complexSigs = fullPool.filter(s => s.length >= 2); // e.g. "xy", "x^2y"
      if (complexSigs.length > 0) {
        basisSigs.push(randChoice(complexSigs));
      }
    }
    
    while (basisSigs.length < numSigs) {
      const s = randChoice(fullPool);
      if (!basisSigs.includes(s)) basisSigs.push(s);
    }
    
    // Generate 4 to 6 terms using the basis signatures
    let numTerms = randInt(4, 6);
    let terms = [];
    for(let i=0; i<numTerms; i++) {
      terms.push({
        c: randNonZeroInt(-9, 9),
        sig: randChoice(basisSigs)
      });
    }
    
    let q = "";
    let ansTerms = JSON.parse(JSON.stringify(terms)); // deep copy
    
    if (!nested) {
      q = formatPoly(terms);
    } else {
      const bracketLen = randInt(2, Math.min(3, numTerms - 1));
      const outTerms = terms.slice(0, numTerms - bracketLen);
      const inTerms = terms.slice(numTerms - bracketLen);
      
      const isNeg = randChoice([true, false]);
      
      q = formatPoly(outTerms);
      if (isNeg) {
        q += ` - (${formatPoly(inTerms)})`;
        // update ansTerms
        for (let i = numTerms - bracketLen; i < numTerms; i++) {
          ansTerms[i].c *= -1;
        }
      } else {
        q += ` + (${formatPoly(inTerms)})`;
      }
    }
    
    const simplified = simplifyTerms(ansTerms);
    const ans = formatPoly(simplified);
    
    return { q, ans };
  }

  // Type 2: Monomial x Polynomial
  static generateDistributive(varCount) {
    const fullPool = generateSignaturePool(varCount);
    let monomialSigs = fullPool.filter(s => s !== '');
    if (varCount > 1) {
      const complexSigs = monomialSigs.filter(s => s.length >= 2);
      if (complexSigs.length > 0) {
        monomialSigs = complexSigs; // Force monomial to be complex like "xy", "x^2"
      }
    }
    const monomialSig = randChoice(monomialSigs);
    const coeff1 = randNonZeroInt(-5, 5);
    
    const polyTerms = [];
    const numPoly = randInt(2, 3);
    for(let i=0; i<numPoly; i++) {
      polyTerms.push({
        c: randNonZeroInt(-5, 5),
        sig: randChoice(fullPool)
      });
    }
    
    const uniquePoly = simplifyTerms(polyTerms);
    if(uniquePoly.length < 2) uniquePoly.push({c: randNonZeroInt(1, 4), sig: randChoice(fullPool)});
    
    const q = `${formatTerm(coeff1, monomialSig)}(${formatPoly(uniquePoly)})`;
    
    const ansTerms = [];
    for (let t of uniquePoly) {
      ansTerms.push({
        c: coeff1 * t.c,
        sig: multiplySignatures(monomialSig, t.sig)
      });
    }
    
    return { q, ans: formatPoly(simplifyTerms(ansTerms)) };
  }

  // Type 3: Poly x Poly
  static generatePolyPoly(varCount) {
    // Stick primarily to 1 or 2 vars for Poly x Poly so it doesn't get unreadable
    const vc = Math.min(varCount, 2);
    const v1 = 'x';
    const v2 = vc === 2 ? 'y' : '';
    
    // Create binomial 1: (Ax + By) or (Ax + C)
    const a = randNonZeroInt(-3, 3);
    const b = randNonZeroInt(-5, 5);
    const sig1A = v1;
    const sig1B = v2 !== '' ? v2 : '';
    
    // Create binomial 2: (Cx + Dy) or (Cx + E)
    const c = randNonZeroInt(-3, 3);
    const d = randNonZeroInt(-5, 5);
    const sig2A = v1;
    const sig2B = v2 !== '' ? v2 : '';
    
    const binom1 = formatPoly([{c:a, sig:sig1A}, {c:b, sig:sig1B}]);
    const binom2 = formatPoly([{c:c, sig:sig2A}, {c:d, sig:sig2B}]);
    
    const q = `(${binom1})(${binom2})`;
    
    const t1 = {c: a*c, sig: multiplySignatures(sig1A, sig2A)};
    const t2 = {c: a*d, sig: multiplySignatures(sig1A, sig2B)};
    const t3 = {c: b*c, sig: multiplySignatures(sig1B, sig2A)};
    const t4 = {c: b*d, sig: multiplySignatures(sig1B, sig2B)};
    
    const ans = formatPoly(simplifyTerms([t1, t2, t3, t4]));
    
    return { q, ans };
  }

  // Type 4: Poly ÷ Monomial
  static generateDivideMonomial(varCount) {
    // E.g. (15x^3y^2 - 10x^2y^3) / 5xy
    const vc = Math.min(varCount, 2);
    const v1 = 'x';
    const v2 = vc === 2 ? 'y' : '';
    
    // Divisor
    const a = randNonZeroInt(2, 5);
    const divSigObj = {x: randInt(1, 2)};
    if (v2) divSigObj.y = randInt(1, 2);
    const divisorSig = formatSignature(divSigObj);
    const divisorStr = formatTerm(a, divisorSig);
    
    // Quotient
    const qTerms = [];
    const numQ = randInt(2, 3);
    for (let i = 0; i < numQ; i++) {
      const qObj = {x: randInt(0, 2)};
      if (v2) qObj.y = randInt(0, 2);
      qTerms.push({c: randNonZeroInt(-5, 5), sig: formatSignature(qObj)});
    }
    const uniqueQ = simplifyTerms(qTerms);
    
    // Multiply
    const dividendTerms = [];
    for (let t of uniqueQ) {
      dividendTerms.push({
        c: a * t.c,
        sig: multiplySignatures(divisorSig, t.sig)
      });
    }
    
    const dividendStr = formatPoly(dividendTerms);
    const ans = formatPoly(uniqueQ);
    const q = `(${dividendStr}) \\div (${divisorStr})`;
    
    return { q, ans };
  }

  // Type 5: Poly ÷ Binomial (Long/Synthetic Division)
  static generateDivideBinomial(varCount) {
    // Division by binomial is best kept in 1 variable
    const v = 'x';
    
    const c = randNonZeroInt(1, 3); 
    const d = randNonZeroInt(-5, 5);
    const divisorStr = formatPoly([{c, sig: v}, {c: d, sig: ''}]);
    
    const qa = randNonZeroInt(-3, 3);
    const qb = randNonZeroInt(-4, 4);
    const qe = randNonZeroInt(-5, 5);
    
    const div3 = c * qa;
    const div2 = c * qb + d * qa;
    const div1 = c * qe + d * qb;
    const div0 = d * qe;
    
    const dividendTerms = [
      {c: div3, sig: `${v}^3`},
      {c: div2, sig: `${v}^2`},
      {c: div1, sig: v},
      {c: div0, sig: ''}
    ];
    
    const dividendStr = formatPoly(simplifyTerms(dividendTerms));
    
    const ansTerms = [
      {c: qa, sig: `${v}^2`},
      {c: qb, sig: v},
      {c: qe, sig: ''}
    ];
    const ans = formatPoly(simplifyTerms(ansTerms));
    
    const q = `(${dividendStr}) \\div (${divisorStr})`;
    
    return { q, ans };
  }
}
