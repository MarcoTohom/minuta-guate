/**
 * Evaluador seguro de expresiones para campos calculados (computed).
 *
 * Soporta:
 *  - sum(clave) donde el valor es una lista de números u objetos con
 *    `valor`, `monto`, `aporte` o `subtotal`.
 *  - aritmética básica: + - * / y paréntesis, con identificadores de campo
 *    y números literales.
 *
 * Nunca usa eval() ni Function().
 */

interface Token {
  type: 'number' | 'identifier' | 'op' | 'lparen' | 'rparen' | 'comma';
  value: string;
}

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i += 1;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[A-Za-z0-9_.]/.test(input[i])) {
        ident += input[i];
        i += 1;
      }
      tokens.push({ type: 'identifier', value: ident });
      continue;
    }
    if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch });
      i += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\sQ%]/g, '');
    if (cleaned === '') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sumValue(value: unknown): number | null {
  if (Array.isArray(value)) {
    let total = 0;
    for (const item of value) {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const candidate =
          numericValue(obj.valor) ??
          numericValue(obj.monto) ??
          numericValue(obj.aporte) ??
          numericValue(obj.subtotal) ??
          numericValue(obj.total);
        if (candidate === null) return null;
        total += candidate;
      } else {
        const candidate = numericValue(item);
        if (candidate === null) return null;
        total += candidate;
      }
    }
    return total;
  }
  return null;
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly values: Record<string, unknown>,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parse(): number | null {
    if (this.tokens.length === 0) return null;
    const value = this.parseExpression();
    if (value === null || this.pos !== this.tokens.length) return null;
    return value;
  }

  private parseExpression(): number | null {
    let left = this.parseTerm();
    if (left === null) return null;
    let token = this.peek();
    while (token && token.type === 'op' && (token.value === '+' || token.value === '-')) {
      this.next();
      const right = this.parseTerm();
      if (right === null) return null;
      left = token.value === '+' ? left + right : left - right;
      token = this.peek();
    }
    return left;
  }

  private parseTerm(): number | null {
    let left = this.parseFactor();
    if (left === null) return null;
    let token = this.peek();
    while (token && token.type === 'op' && (token.value === '*' || token.value === '/')) {
      this.next();
      const right = this.parseFactor();
      if (right === null) return null;
      if (token.value === '/' && right === 0) return null;
      left = token.value === '*' ? left * right : left / right;
      token = this.peek();
    }
    return left;
  }

  private parseFactor(): number | null {
    const token = this.peek();
    if (!token) return null;

    if (token.type === 'op' && (token.value === '-' || token.value === '+')) {
      this.next();
      const value = this.parseFactor();
      if (value === null) return null;
      return token.value === '-' ? -value : value;
    }

    if (token.type === 'number') {
      this.next();
      const value = Number(token.value);
      return Number.isFinite(value) ? value : null;
    }

    if (token.type === 'lparen') {
      this.next();
      const value = this.parseExpression();
      const closing = this.next();
      if (value === null || !closing || closing.type !== 'rparen') return null;
      return value;
    }

    if (token.type === 'identifier') {
      this.next();
      const name = token.value;
      const inner = this.peek();
      if (inner && inner.type === 'lparen') {
        this.next();
        const argToken = this.next();
        if (!argToken || (argToken.type !== 'identifier' && argToken.type !== 'number')) return null;
        const closing = this.next();
        if (!closing || closing.type !== 'rparen') return null;
        if (name === 'sum') {
          const listValue = this.values[argToken.value];
          return sumValue(listValue);
        }
        return null;
      }
      return numericValue(this.values[name]);
    }

    return null;
  }
}

/** Evalúa una expresión de cálculo. Devuelve null si no es posible. */
export function evaluateExpression(
  expression: string | null | undefined,
  values: Record<string, unknown>,
): number | null {
  if (!expression || !expression.trim()) return null;
  const tokens = tokenize(expression);
  if (!tokens) return null;
  return new Parser(tokens, values).parse();
}
