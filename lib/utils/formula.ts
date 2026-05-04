export function evaluateFormula(formula: string | null, context: { L: number; A: number; P: number; E: number }): number {
  if (!formula) return 0
  try {
    const { L, A, P, E } = context
    // Replace variables with their values
    let evalStr = formula
      .replace(/L/g, L.toString())
      .replace(/A/g, A.toString())
      .replace(/P/g, P.toString())
      .replace(/E/g, E.toString())
    
    // Simple math evaluation
    // eslint-disable-next-line no-eval
    return eval(evalStr)
  } catch (error) {
    console.error('Error evaluating formula:', formula, error)
    return 0
  }
}
