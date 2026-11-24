import { sanitizeFloat } from './formatter.ts';

export type AngleUnit = 'deg' | 'rad';

export interface EvalResult {
  ok: true;
  value: number;
  normalizedExpression: string;
}

export interface EvalError {
  ok: false;
  error: string;
}

export type ExpressionEvaluation = EvalResult | EvalError;

type Token =
  | { type: 'number'; value: number; raw: string }
  | { type: 'constant'; name: 'pi' | 'e' }
  | { type: 'func'; name: FuncName }
  | { type: 'op'; op: BinaryOp | UnaryOp }
  | { type: 'lparen' }
  | { type: 'rparen' };

type FuncName =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'sqrt'
  | 'log'
  | 'ln'
  | 'abs';

type BinaryOp = '+' | '-' | '*' | '/' | '^';
type UnaryOp = 'u-' | 'u+' | '!' | '%';
type AnyOp = BinaryOp | UnaryOp;

const FUNCTIONS = new Set<string>([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'log',
  'ln',
  'abs',
]);

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function tokenize(input: string): Token[] {
  const s = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .trim();

  if (!s) {
    throw new Error('Enter an expression to calculate');
  }

  const rawTokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    // Numbers (including scientific notation like 1.5e-3)
    if (isDigit(ch) || ch === '.') {
      let numStr = '';
      let seenDot = false;
      while (i < s.length && (isDigit(s[i]) || s[i] === '.')) {
        if (s[i] === '.') {
          if (seenDot) {
            throw new Error('Invalid number: multiple decimal points');
          }
          seenDot = true;
        }
        numStr += s[i];
        i++;
      }
      if (numStr === '.') {
        throw new Error('Invalid number: lone decimal point');
      }
      if (i < s.length && (s[i] === 'e' || s[i] === 'E')) {
        const expIndex = i;
        let expPart = s[i];
        i++;
        if (i < s.length && (s[i] === '+' || s[i] === '-')) {
          expPart += s[i];
          i++;
        }
        let expDigits = '';
        while (i < s.length && isDigit(s[i])) {
          expDigits += s[i];
          i++;
        }
        if (expDigits.length > 0) {
          numStr += expPart + expDigits;
        } else {
          // Backtrack if 'e' is Euler's constant (e.g., 2e)
          i = expIndex;
        }
      }
      const val = Number(numStr);
      if (!Number.isFinite(val)) {
        throw new Error('Number out of representable range');
      }
      rawTokens.push({ type: 'number', value: val, raw: numStr });
      continue;
    }

    // Identifiers: functions and constants
    if (isLetter(ch)) {
      let ident = '';
      while (i < s.length && isLetter(s[i])) {
        ident += s[i].toLowerCase();
        i++;
      }
      if (ident === 'pi') {
        rawTokens.push({ type: 'constant', name: 'pi' });
      } else if (ident === 'e') {
        rawTokens.push({ type: 'constant', name: 'e' });
      } else if (FUNCTIONS.has(ident)) {
        rawTokens.push({ type: 'func', name: ident as FuncName });
      } else {
        throw new Error(`Unknown identifier "${ident}"`);
      }
      continue;
    }

    if (ch === '(') {
      rawTokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      rawTokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      rawTokens.push({ type: 'op', op: ch });
      i++;
      continue;
    }

    if (ch === '!' || ch === '%') {
      rawTokens.push({ type: 'op', op: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${ch}"`);
  }

  // Insert implicit multiplication and distinguish unary +/-
  const tokens: Token[] = [];
  for (let idx = 0; idx < rawTokens.length; idx++) {
    const curr = rawTokens[idx];
    const prev = tokens[tokens.length - 1];

    const prevProducesValue =
      prev !== undefined &&
      (prev.type === 'number' ||
        prev.type === 'constant' ||
        prev.type === 'rparen' ||
        (prev.type === 'op' && (prev.op === '!' || prev.op === '%')));

    const currStartsValue =
      curr.type === 'number' ||
      curr.type === 'constant' ||
      curr.type === 'func' ||
      curr.type === 'lparen';

    if (prevProducesValue && currStartsValue) {
      tokens.push({ type: 'op', op: '*' });
    }

    if (curr.type === 'op' && (curr.op === '-' || curr.op === '+')) {
      const isUnary =
        prev === undefined ||
        prev.type === 'lparen' ||
        (prev.type === 'op' && prev.op !== '!' && prev.op !== '%');
      if (isUnary) {
        tokens.push({ type: 'op', op: curr.op === '-' ? 'u-' : 'u+' });
        continue;
      }
    }

    tokens.push(curr);
  }

  return tokens;
}

function precedence(op: AnyOp): number {
  switch (op) {
    case '+':
    case '-':
      return 1;
    case '*':
    case '/':
      return 2;
    case 'u-':
    case 'u+':
      return 3;
    case '^':
      return 4;
    case '!':
    case '%':
      return 5;
  }
}

function isRightAssociative(op: AnyOp): boolean {
  return op === '^' || op === 'u-' || op === 'u+';
}

function balanceParentheses(tokens: Token[]): Token[] {
  let openCount = 0;
  for (const t of tokens) {
    if (t.type === 'lparen') openCount++;
    else if (t.type === 'rparen') {
      openCount--;
      if (openCount < 0) {
        throw new Error('Mismatched closing parenthesis ")"');
      }
    }
  }
  if (openCount === 0) return tokens;
  const balanced = [...tokens];
  for (let i = 0; i < openCount; i++) {
    balanced.push({ type: 'rparen' });
  }
  return balanced;
}

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'constant') {
      output.push(token);
    } else if (token.type === 'func') {
      stack.push(token);
    } else if (token.type === 'op') {
      if (token.op === '!' || token.op === '%') {
        // Postfix operators bind immediately to high precedence
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (
            top.type === 'op' &&
            precedence(top.op) >= precedence(token.op)
          ) {
            output.push(stack.pop()!);
          } else {
            break;
          }
        }
        output.push(token);
      } else {
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'func') {
            output.push(stack.pop()!);
          } else if (
            top.type === 'op' &&
            (precedence(top.op) > precedence(token.op) ||
              (precedence(top.op) === precedence(token.op) &&
                !isRightAssociative(token.op)))
          ) {
            output.push(stack.pop()!);
          } else {
            break;
          }
        }
        stack.push(token);
      }
    } else if (token.type === 'lparen') {
      stack.push(token);
    } else if (token.type === 'rparen') {
      while (stack.length > 0 && stack[stack.length - 1].type !== 'lparen') {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      stack.pop(); // pop '('
      if (stack.length > 0 && stack[stack.length - 1].type === 'func') {
        output.push(stack.pop()!);
      }
    }
  }

  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top.type === 'lparen' || top.type === 'rparen') {
      throw new Error('Mismatched parentheses');
    }
    output.push(top);
  }

  return output;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Factorial requires a non-negative integer');
  }
  if (n > 170) {
    throw new Error('Factorial overflow (maximum supported is 170!)');
  }
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

function snapTrig(val: number): number {
  return Math.abs(val) < 1e-12 ? 0 : val;
}

function applyFunction(name: FuncName, x: number, angleUnit: AngleUnit): number {
  const toRad = (v: number) => (angleUnit === 'deg' ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (angleUnit === 'deg' ? (v * 180) / Math.PI : v);

  switch (name) {
    case 'sin':
      return snapTrig(Math.sin(toRad(x)));
    case 'cos':
      return snapTrig(Math.cos(toRad(x)));
    case 'tan': {
      const c = Math.cos(toRad(x));
      if (Math.abs(c) < 1e-12) {
        throw new Error('Undefined (tangent asymptote)');
      }
      return snapTrig(Math.tan(toRad(x)));
    }
    case 'asin':
      if (x < -1 || x > 1) {
        throw new Error('arcsin domain error: input must be between -1 and 1');
      }
      return fromRad(Math.asin(x));
    case 'acos':
      if (x < -1 || x > 1) {
        throw new Error('arccos domain error: input must be between -1 and 1');
      }
      return fromRad(Math.acos(x));
    case 'atan':
      return fromRad(Math.atan(x));
    case 'sqrt':
      if (x < 0) {
        throw new Error('Square root of negative number');
      }
      return Math.sqrt(x);
    case 'log':
      if (x <= 0) {
        throw new Error('Logarithm requires a positive number');
      }
      return Math.log10(x);
    case 'ln':
      if (x <= 0) {
        throw new Error('Natural log requires a positive number');
      }
      return Math.log(x);
    case 'abs':
      return Math.abs(x);
  }
}

export function evaluateExpression(
  input: string,
  angleUnit: AngleUnit = 'deg',
): ExpressionEvaluation {
  try {
    const tokens = balanceParentheses(tokenize(input));
    const rpn = toRPN(tokens);
    const stack: number[] = [];

    for (const token of rpn) {
      if (token.type === 'number') {
        stack.push(token.value);
      } else if (token.type === 'constant') {
        stack.push(token.name === 'pi' ? Math.PI : Math.E);
      } else if (token.type === 'func') {
        if (stack.length < 1) {
          throw new Error(`Missing argument for ${token.name}()`);
        }
        const arg = stack.pop()!;
        stack.push(applyFunction(token.name, arg, angleUnit));
      } else if (token.type === 'op') {
        if (token.op === 'u-') {
          if (stack.length < 1) throw new Error('Invalid expression');
          stack.push(-stack.pop()!);
        } else if (token.op === 'u+') {
          if (stack.length < 1) throw new Error('Invalid expression');
          stack.push(+stack.pop()!);
        } else if (token.op === '!') {
          if (stack.length < 1) throw new Error('Invalid factorial expression');
          stack.push(factorial(stack.pop()!));
        } else if (token.op === '%') {
          if (stack.length < 1) throw new Error('Invalid percentage expression');
          stack.push(stack.pop()! / 100);
        } else {
          if (stack.length < 2) {
            throw new Error('Incomplete expression (trailing operator)');
          }
          const b = stack.pop()!;
          const a = stack.pop()!;
          let res: number;
          switch (token.op) {
            case '+':
              res = a + b;
              break;
            case '-':
              res = a - b;
              break;
            case '*':
              res = a * b;
              break;
            case '/':
              if (b === 0) {
                throw new Error('Cannot divide by zero');
              }
              res = a / b;
              break;
            case '^':
              res = Math.pow(a, b);
              if (!Number.isFinite(res)) {
                throw new Error(
                  Number.isNaN(res)
                    ? 'Undefined power (e.g. negative base with fractional exponent)'
                    : 'Result exceeds finite range',
                );
              }
              break;
          }
          stack.push(res);
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression syntax');
    }

    const result = sanitizeFloat(stack[0]);
    if (!Number.isFinite(result)) {
      throw new Error('Result exceeds finite range');
    }

    return {
      ok: true,
      value: result,
      normalizedExpression: input.trim(),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid expression',
    };
  }
}
