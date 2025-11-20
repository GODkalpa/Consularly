# Email Alias Examples - Final Format

## Format: First-Last Name

The system generates email aliases using the **first two words** of the organization name.

## Examples

### Two-Word Organizations
```
Organization Name          →  Email Alias
─────────────────────────────────────────────────────────
Sumedha Education         →  sumedha-education@consularly.com
Acme Corporation          →  acme-corporation@consularly.com
Global Tech               →  global-tech@consularly.com
Oxford Consultancy        →  oxford-consultancy@consularly.com
EduPrep Academy           →  eduprep-academy@consularly.com
Bright Future             →  bright-future@consularly.com
Elite Coaching            →  elite-coaching@consularly.com
```

### Three+ Word Organizations (Takes First Two)
```
Organization Name                →  Email Alias
──────────────────────────────────────────────────────────────
Global Tech Solutions           →  global-tech@consularly.com
Acme Corporation International  →  acme-corporation@consularly.com
Oxford University Prep          →  oxford-university@consularly.com
Elite Coaching Services Ltd     →  elite-coaching@consularly.com
```

### Single-Word Organizations
```
Organization Name    →  Email Alias
─────────────────────────────────────────
Microsoft           →  microsoft@consularly.com
Amazon              →  amazon@consularly.com
Google              →  google@consularly.com
Apple               →  apple@consularly.com
```

### Special Characters (Automatically Removed)
```
Organization Name          →  Email Alias
─────────────────────────────────────────────────────────
Sumedha & Co.             →  sumedha-co@consularly.com
Acme (UK) Ltd             →  acme-uk@consularly.com
Global Tech, Inc.         →  global-tech@consularly.com
O'Brien Education         →  obrien-education@consularly.com
Smith's Academy           →  smiths-academy@consularly.com
```

### Numbers in Names
```
Organization Name          →  Email Alias
─────────────────────────────────────────────────────────
24/7 Education            →  247-education@consularly.com
A1 Coaching               →  a1-coaching@consularly.com
Top10 Academy             →  top10-academy@consularly.com
```

## Manual Customization

You can always manually set a different alias:

```
Organization: Sumedha Education

Auto-generated:  sumedha-education@consularly.com
Manual options:  sumedha@consularly.com
                 sumedha-edu@consularly.com
                 sumedha-academy@consularly.com
                 education-sumedha@consularly.com
```

## Reserved Names (Cannot Use)

These are reserved for system use:
- `info@consularly.com`
- `admin@consularly.com`
- `support@consularly.com`
- `noreply@consularly.com`
- `contact@consularly.com`
- `help@consularly.com`
- `sales@consularly.com`

## Validation Rules

✅ **Valid**:
- Lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-)
- Must end with `@consularly.com`

❌ **Invalid**:
- Uppercase letters
- Spaces
- Special characters (except hyphens)
- Starting or ending with hyphen
- Consecutive hyphens (--)
- Reserved names

## Testing

Test the generation:

```bash
# Example 1: Two words
Organization: "Sumedha Education"
Generated: sumedha-education@consularly.com

# Example 2: Three words (takes first two)
Organization: "Global Tech Solutions"
Generated: global-tech@consularly.com

# Example 3: Single word
Organization: "Microsoft"
Generated: microsoft@consularly.com

# Example 4: With special characters
Organization: "Acme & Co."
Generated: acme-co@consularly.com
```

## In Hostinger Panel

When creating the alias in Hostinger:

1. **Alias field**: Enter just the part before @
   - For `sumedha-education@consularly.com`
   - Enter: `sumedha-education`

2. **Forward to**: `info@consularly.com`

3. **Save**

## Quick Reference

| Scenario | Example | Result |
|----------|---------|--------|
| 2 words | "Sumedha Education" | `sumedha-education@consularly.com` |
| 3+ words | "Global Tech Solutions" | `global-tech@consularly.com` |
| 1 word | "Microsoft" | `microsoft@consularly.com` |
| With & | "Acme & Co" | `acme-co@consularly.com` |
| With () | "Acme (UK)" | `acme-uk@consularly.com` |
| With numbers | "24/7 Education" | `247-education@consularly.com` |

Perfect for professional, branded email communication! 🎯
