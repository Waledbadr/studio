# Browser Issues and Workarounds

## Chrome
- No major issues found. Print layouts render as expected. 

## Firefox
- Print: Some table borders may appear lighter. Use `border-gray-800` for print headers.
- Flex gap: Older versions may not support `gap-*` on flex containers. Use `space-x-*`/`space-y-*` as fallback if needed.

## Edge
- No major issues found. Print and directionality work as expected.

## Safari (Desktop & iOS)
- Print: Some shadows may not be removed in print mode. Use `print:shadow-none` and test on device.
- RTL: In rare cases, table cell alignment may be off. Use `text-right`/`text-left` with `dir={dict.dir}` on tables.
- Touch: Ensure all tap targets are at least 44px on iOS.

## General
- Always test print layouts in both LTR and RTL.
- Use `dir={dict.dir}` and `lang={locale}` on main wrappers for best compatibility.
- If any new browser-specific issues are found, document them here with the fix or workaround.

---

_Last updated: 2025-11-27_