# Responsive Design Checklist for EstateCare

## Layout & Responsiveness
- Use Tailwind's responsive classes (`sm:`, `md:`, `lg:`, `xl:`) for all layout containers and spacing.
- Avoid fixed widths/heights except for icons or avatars; use `min-w-0`, `overflow-x-auto` for tables.
- Test all pages at 320px, 375px, 414px, 768px, 1024px, 1280px, 1920px.
- Use `container mx-auto` for main wrappers.
- Use `flex-wrap` and `gap-*` for row layouts.

## Internationalization (i18n)
- All user-facing text must use `dict` from `useLanguage()`.
- No hardcoded strings in JSX/components/pages.
- Use `dict.dir` for direction (`dir={dict.dir}`) on main wrappers/tables.
- Test both LTR (English) and RTL (Arabic) for alignment and overflow.

## Accessibility & Touch Targets
- All interactive elements (buttons, tabs, selects, switches, etc.) must have min 44px height/width.
- Use semantic HTML (`<button>`, `<a>`, `<label>`, etc.) for all actions.
- Ensure focus states are visible and accessible.

## Print Layouts
- Use print-optimized wrappers (e.g., `PrintLayout` component).
- Hide navigation/toolbars in print (`print:hidden`).
- Set direction and language in print mode.
- Ensure tables do not overflow page width; use `min-w-0` and `overflow-x-auto`.
- Add print headers/footers with date and confidentiality notice.

## Edge Cases
- Clamp/cap all numeric values (e.g., stock, occupancy) to avoid negative/overflow.
- Test with long names, large numbers, and empty states.
- Use `truncate`, `text-ellipsis`, or `break-words` for long text.

## Browser Compatibility
- Test on latest Chrome, Firefox, Edge, Safari (desktop & mobile).
- Document any browser-specific issues and workarounds in `BROWSER_ISSUES.md`.

---

_Keep this checklist updated as new features and patterns are added._
