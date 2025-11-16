/**
 * CSS Sanitizer Utility
 * 
 * Sanitizes custom CSS to prevent XSS attacks and ensures proper scoping
 * to prevent global CSS pollution.
 */

/**
 * Dangerous patterns that should be removed from CSS
 */
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /expression\s*\(/gi,
  /import\s+/gi,
  /@import/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

/**
 * Sanitize CSS by removing dangerous patterns and scoping selectors
 */
export function sanitizeCSS(css: string, scope: string = 'branded-app'): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let sanitized = css;

  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Scope all selectors
  sanitized = scopeSelectors(sanitized, scope);

  return sanitized;
}

/**
 * Scope CSS selectors to prevent global pollution
 * Example: ".btn" becomes ".branded-app .btn"
 */
function scopeSelectors(css: string, scope: string): string {
  // Split CSS into rules
  const rules: string[] = [];
  let currentRule = '';
  let braceDepth = 0;
  let inAtRule = false;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    currentRule += char;

    if (char === '{') {
      braceDepth++;
      if (braceDepth === 1) {
        // Check if this is an @rule
        const trimmed = currentRule.trim();
        inAtRule = trimmed.startsWith('@');
      }
    } else if (char === '}') {
      braceDepth--;
      if (braceDepth === 0) {
        rules.push(currentRule);
        currentRule = '';
        inAtRule = false;
      }
    }
  }

  // Add any remaining content
  if (currentRule.trim()) {
    rules.push(currentRule);
  }

  // Process each rule
  const scopedRules = rules.map(rule => {
    const trimmed = rule.trim();
    
    // Don't scope @rules (media queries, keyframes, etc.)
    if (trimmed.startsWith('@')) {
      return rule;
    }

    // Find the selector (everything before the first {)
    const openBraceIndex = rule.indexOf('{');
    if (openBraceIndex === -1) {
      return rule;
    }

    const selector = rule.substring(0, openBraceIndex).trim();
    const body = rule.substring(openBraceIndex);

    // Split multiple selectors
    const selectors = selector.split(',').map(s => s.trim());
    
    // Scope each selector
    const scopedSelectors = selectors.map(sel => {
      // Don't scope if already scoped
      if (sel.startsWith(`.${scope}`)) {
        return sel;
      }
      
      // Don't scope :root or html/body
      if (sel === ':root' || sel === 'html' || sel === 'body') {
        return sel;
      }

      // Add scope prefix
      return `.${scope} ${sel}`;
    });

    return scopedSelectors.join(', ') + ' ' + body;
  });

  return scopedRules.join('\n');
}

/**
 * Validate CSS syntax and check for dangerous patterns
 */
export function validateCSS(css: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!css || typeof css !== 'string') {
    return { valid: true, errors: [] };
  }

  // Check for balanced braces
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in CSS');
  }

  // Check for dangerous patterns
  if (/javascript:/i.test(css)) {
    errors.push('JavaScript URLs are not allowed');
  }

  if (/expression\s*\(/i.test(css)) {
    errors.push('CSS expressions are not allowed');
  }

  if (/@import/i.test(css)) {
    errors.push('@import statements are not allowed');
  }

  if (/behavior\s*:/i.test(css)) {
    errors.push('CSS behavior property is not allowed');
  }

  if (/-moz-binding\s*:/i.test(css)) {
    errors.push('XBL bindings are not allowed');
  }

  if (/vbscript:/i.test(css)) {
    errors.push('VBScript URLs are not allowed');
  }

  if (/data:text\/html/i.test(css)) {
    errors.push('Data URLs with HTML are not allowed');
  }

  // Check for basic CSS syntax
  if (css.includes('{{') || css.includes('}}')) {
    errors.push('Invalid CSS syntax: double braces');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Minify CSS by removing comments and unnecessary whitespace
 */
export function minifyCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let minified = css;

  // Remove comments
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove unnecessary whitespace
  minified = minified.replace(/\s+/g, ' ');
  minified = minified.replace(/\s*{\s*/g, '{');
  minified = minified.replace(/\s*}\s*/g, '}');
  minified = minified.replace(/\s*:\s*/g, ':');
  minified = minified.replace(/\s*;\s*/g, ';');
  minified = minified.replace(/\s*,\s*/g, ',');

  // Remove trailing semicolons before }
  minified = minified.replace(/;}/g, '}');

  return minified.trim();
}
