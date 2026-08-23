---
name: OpenAPI and Zod version compatibility
description: A compatibility constraint for integer fields in generated validation schemas.
---

When the workspace generates Zod schemas with the current Zod 3 dependency, OpenAPI integer types can emit unsupported `z.int()` calls; numeric fields with non-negative bounds are the compatible contract representation.

**Why:** Code generation completed but the chained library typecheck failed on `z.int()` until the contract used numeric fields.

**How to apply:** If the validation dependency is upgraded to Zod 4, integer formats can be reconsidered; otherwise keep generated contracts compatible with Zod 3.