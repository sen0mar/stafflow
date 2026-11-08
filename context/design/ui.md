# UI Context

[Context map](../README.md). For implementation conventions see [code standards](../development/code-standards.md); visual assets are indexed in [UI references](../images/README.md).

## Visual References

Use the dashboard and homepage images indexed in [UI references](../images/README.md) as the visual direction.

The visual language is a clean modern SaaS employee-management product: rounded cards, soft borders, minimal neutral elevation, muted burnt-orange brand accents, readable dashboard density, and matching black/grey/orange dark/light mode layouts.

## Theme

Support dark and light modes with semantic tokens; never hardcode colors or raw palette utilities in components. [client/src/index.css](../../client/src/index.css) owns exact token values, gradients, shadows, font stacks, and Tailwind v4 `@theme inline` mappings. Read it only when changing or inspecting tokens; do not duplicate the full definitions here.

| Core palette   | Dark                  | Light                 |
| -------------- | --------------------- | --------------------- |
| Page / surface | `#0e0e0e` / `#141414` | `#f3f2ef` / `#fbfaf8` |
| Primary text   | `#f8f8f8`             | `#080808`             |
| Brand accent   | `#e57922`             | `#d06a1c`             |

Token families: `--bg-*` surfaces, `--border-*` borders, `--text-*` text, `--accent-*` brand/secondary accents, `--state-*` status, `--chart-*` series, `--gradient-*` backgrounds, and `--shadow-*` elevation. Use their semantic utilities (`bg-surface`, `text-primary`, `ring-brand`, etc.).

## Token Usage Rules

- Surface, elevated, card, popover, and overlay backgrounds may use their semantic gradient variables through the matching utility classes.
- Use `bg-brand` or the gradient token for primary CTAs.
- Use `bg-brand-soft` for selected sidebar items, icon wells, pills, and subtle active states.
- Use `text-brand` for links, active labels, chart labels, and brand-emphasis text.
- Use `border-default` for cards and panels; use `border-subtle` for internal dividers.
- Keep ordinary bordered controls flat. Use `shadow-soft` only for a restrained depth cue and reserve `shadow-card` for layered surfaces such as dialogs, menus, mobile navigation, and the landing preview.
- `shadow-glow` is a compact neutral lift for branded controls and marks; it must not create a colored halo around their edges.
- Use `text-muted` for metadata and secondary descriptions.
- Use `state-*` tokens for badges, validation, destructive actions, and status indicators.
- Dashboard charts must use chart tokens, not arbitrary palette values.

## Typography

Use Geist Sans (`--font-geist-sans`) with antialiasing for UI text. Reserve Geist Mono (`--font-geist-mono`) for technical IDs, object keys, logs, code, or compact numeric labels. Load fonts through Vite imports/packages, not `next/font`.

## Border Radius

Use `rounded-xl` for inputs, inline controls, and badges; `rounded-xl`/`rounded-2xl` for buttons and stat cards; `rounded-2xl` for panels; `rounded-3xl` for hero previews, large shells, and overlays. Avatars/icon wells use `rounded-full` or `rounded-xl` to suit their shape.

## Homepage Background

The homepage uses a full-page reactive dotted canvas in both themes. Nearby dots
move away from the pointer with frame-rate-independent easing, brighten toward
the semantic brand accent with a restrained distance-based falloff, and can emit
a short-lived trailing ripple while the pointer moves. The canvas must remain
event-driven and stop scheduling frames once the interaction settles.
Reduced-motion users receive the static grid. The dots should be visible but
still secondary to content.

The static grid uses `--bg-base`, `--bg-dot`, 1px dots, and 16px spacing.

## Component Library

shadcn/ui sits on top of Tailwind. Do not create a separate custom design system. Components live in `client/src/shared/components/ui/` or the equivalent generated shadcn directory.

Use the shadcn CLI to add primitives when possible, then compose project-specific components in feature or shared layout folders.

Follow [protected-file conventions](../development/code-standards.md#protected-foundation-components) when adding or composing primitives.

## Layout Patterns

### Landing Page

- Full-width page with centered max-width content.
- Header: brand left, `Demo Login` CTA right, no center nav links by default.
- Hero: left marketing copy, right dashboard preview card.
- Feature cards: six compact module cards with icon wells.
- Metrics strip: one wide rounded card with key stats.
- Footer: brand, copyright, and simple links.
- Use dotted page background plus subtle radial brand glow behind the dashboard preview.

### Admin Dashboard

- Sidebar-first layout with dashboard content to the right.
- Sidebar uses brand, navigation links, active item highlight, and collapse affordance.
- Main content uses stat cards, attendance chart, leave request list, recent employees, and department distribution.
- Cards use soft borders and layered surfaces. Most cards use no shadow or `shadow-soft`; stronger elevation is reserved for surfaces that sit above surrounding content.
- Keep lists compact, readable, and aligned; avoid crowded text blocks.

### Employee Pages

- Reuse the same shell, spacing, card system, and tokens.
- Employee pages should feel simpler than admin pages and only expose self-service actions.
- Backend authorization determines available data; frontend hiding is only UX.

## Spacing and Density

- Page max width for landing pages: around `max-w-7xl` to `max-w-[1440px]`.
- Authenticated app content should keep the standard desktop width at normal breakpoints, expand to a centered maximum around `1760px` on `2xl` viewports, and become fluid inside its page padding from `2200px` upward; the topbar and page content must share the same width constraint.
- At viewport widths of `2200px` and above, use a `125%` root type scale so rem-based typography, controls, spacing, and cards retain appropriate visual density on 4K-class displays. Public landing containers may expand to around `2200px` at the same tier.
- Dashboard horizontal content padding: `px-6` to `px-8` on desktop.
- Card padding: `p-5` or `p-6` for panels, `p-4` for compact stats.
- Grid gaps: `gap-4` to `gap-6`.
- Avoid oversized empty spaces inside dashboard cards; this is a data app.

## Buttons and Interactions

- Primary buttons use the brand gradient, white text, compact neutral elevation, and hover lift/brightness.
- Secondary buttons use transparent or surface backgrounds with default borders.
- Active sidebar items use brand soft background, brand text, and a subtle left accent bar.
- Focus rings should use the brand ring token and be visible in both modes.
- Transitions should be subtle: `150ms` to `200ms` for hover/focus states.

## Icons

Use Lucide React stroke icons consistently: `h-4 w-4` inline, `h-5 w-5` for buttons/navigation, `h-5 w-5`–`h-6 w-6` for stats, and `h-6 w-6`–`h-7 w-7` for landing features.

## Charts and Data Visualization

- Use muted burnt orange as the primary chart color in both themes.
- Use muted gray for secondary comparison series.
- Use teal/blue only for department slices or secondary categories.
- Grid lines and axes should use subtle border/text tokens.
- Do not introduce saturated random chart colors that conflict with the brand.

## Accessibility

- Preserve readable contrast in both modes.
- Every interactive element needs visible hover and focus states.
- Forms need accessible labels, helper text, and error states.
- Badges must not rely only on color; include readable text.
- Motion should be subtle and should not block core interactions.
