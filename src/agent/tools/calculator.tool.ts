import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function createCalculatorTool() {
  return new DynamicStructuredTool({
    name: 'calculator',
    description: `Perform accurate mathematical calculations for financial analysis, valuations, equity calculations, and ROI analysis.
    
Use this tool for:
- Valuation calculations (e.g., "If asking $100k for 10%, what's the valuation?")
- Equity math (e.g., "What percentage is $200k of $2M valuation?")
- ROI calculations
- Revenue projections
- Deal comparisons
- Percentage calculations
- Any mathematical operations

Supports: +, -, *, /, %, ^, sqrt, parentheses, and common math functions.

Examples:
- "100000 / 0.10" (valuation from ask and equity)
- "(500000 - 200000) / 200000 * 100" (ROI percentage)
- "sqrt(1000000)" (square root)`,
    
    schema: z.object({
      expression: z.string().describe('Mathematical expression to evaluate (e.g., "100000 / 0.10" or "(500000 - 200000) / 200000 * 100")'),
    }),

    func: async ({ expression }) => {
      try {
        // Sanitize the expression to prevent code injection
        const sanitized = expression
          .replace(/[^0-9+\-*/().%^sqrtlogsincostan\s]/gi, '')
          .trim();

        if (!sanitized) {
          return JSON.stringify({
            success: false,
            error: 'Invalid expression',
            message: 'The expression contains invalid characters.',
          });
        }

        // Safe evaluation using Function constructor with limited scope
        const safeEval = (expr: string): number => {
          // Replace common math functions
          let processed = expr
            .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
            .replace(/log\(([^)]+)\)/g, 'Math.log($1)')
            .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
            .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
            .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)')
            .replace(/\^/g, '**'); // Power operator

          // Create a safe evaluation context
          const func = new Function('Math', `"use strict"; return (${processed});`);
          return func(Math);
        };

        const result = safeEval(sanitized);

        // Check for invalid results
        if (!isFinite(result)) {
          return JSON.stringify({
            success: false,
            error: 'Invalid result',
            message: 'The calculation resulted in infinity or NaN. Check your expression.',
          });
        }

        // Format result based on magnitude
        let formattedResult: string;
        if (Math.abs(result) >= 1000000) {
          formattedResult = `$${(result / 1000000).toFixed(2)}M`;
        } else if (Math.abs(result) >= 1000) {
          formattedResult = `$${(result / 1000).toFixed(2)}K`;
        } else if (Number.isInteger(result)) {
          formattedResult = result.toString();
        } else {
          formattedResult = result.toFixed(2);
        }

        return JSON.stringify({
          success: true,
          expression: expression,
          result: result,
          formatted: formattedResult,
          explanation: `${expression} = ${result}`,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to evaluate the expression. Please check the syntax.',
        });
      }
    },
  });
}
