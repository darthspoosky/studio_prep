import { validateMcqs } from '../newspaper-analysis-flow';

describe('validateMcqs', () => {
  test('passes for a valid MCQ block', () => {
    const txt = `<mcq question="Q" difficultyScore="7">\n<option correct="true">1</option>\n<option>2</option>\n<option>3</option>\n<option>4</option>\n</mcq>`;
    expect(validateMcqs(txt)).toEqual({ valid: true, errors: [] });
  });

  test('detects missing option tags', () => {
    const txt = `<mcq question="Q" difficultyScore="7">\n<option correct="true">1</option>\n<option>2</option>\n</mcq>`;
    const result = validateMcqs(txt);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('4 <option>'))).toBe(true);
  });

  test('detects multiple correct answers', () => {
    const txt = `<mcq question="Q" difficultyScore="7">\n<option correct="true">1</option>\n<option correct="true">2</option>\n<option>3</option>\n<option>4</option>\n</mcq>`;
    const result = validateMcqs(txt);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exactly one correct option'))).toBe(true);
  });

  test('detects absent difficulty score', () => {
    const txt = `<mcq question="Q">\n<option correct="true">1</option>\n<option>2</option>\n<option>3</option>\n<option>4</option>\n</mcq>`;
    const result = validateMcqs(txt);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('difficultyScore'))).toBe(true);
  });

  test('passes when no MCQs present', () => {
    expect(validateMcqs('plain text')).toEqual({ valid: true, errors: [] });
  });
});
