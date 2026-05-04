# UI Context

## Visual References

Use the reference images in the `context/images/` folder as the source of truth for visual direction:

- `context/images/dashboard/dashboard-dark-reference.png`
- `context/images/dashboard/dashboard-light-reference.png`
- `context/images/homepage/homepage-dark-reference.png`
- `context/images/homepage/homepage-light-reference.png`

The visual language is a clean modern SaaS employee-management product: rounded cards, soft borders, subtle shadows, purple brand accents, readable dashboard density, and matching dark/light mode layouts.

## Theme

The app supports both dark and light modes. All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens. Components must use semantic tokens instead of hardcoded hex values or raw palette utilities such as `slate-*`, `zinc-*`, `purple-*`, or `green-*`.

Recommended utility naming: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-default`, `border-subtle`, `text-primary`, `text-secondary`, `text-muted`, `text-brand`, `bg-brand`, `bg-brand-soft`, `ring-brand`, `shadow-card`, and `shadow-glow`.

If the project uses Tailwind v4, map these variables with `@theme inline`. If the project uses Tailwind v3, mirror the same semantic token names in `tailwind.config.ts`.

### Dark Mode Tokens

| Role | CSS Variable | HEX / Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#050914` |
| Page background soft gradient | `--bg-base-soft` | `#08111f` |
| Surface | `--bg-surface` | `#0b1220` |
| Elevated surface | `--bg-elevated` | `#111827` |
| Subtle surface | `--bg-subtle` | `#171f2e` |
| Inset surface | `--bg-inset` | `#070d18` |
| Overlay surface | `--bg-overlay` | `rgba(5, 9, 20, 0.78)` |
| Homepage dot color | `--bg-dot` | `rgba(124, 58, 237, 0.22)` |
| Default border | `--border-default` | `#1f2937` |
| Subtle border | `--border-subtle` | `#2d3748` |
| Strong border | `--border-strong` | `#3b4560` |
| Primary text | `--text-primary` | `#f8fafc` |
| Secondary text | `--text-secondary` | `#cbd5e1` |
| Muted text | `--text-muted` | `#94a3b8` |
| Faint text | `--text-faint` | `#64748b` |
| Brand accent | `--accent-primary` | `#7c3aed` |
| Brand hover | `--accent-primary-hover` | `#8b5cf6` |
| Brand active | `--accent-primary-active` | `#6d28d9` |
| Brand text | `--accent-primary-text` | `#a78bfa` |
| Brand soft background | `--accent-primary-soft` | `rgba(124, 58, 237, 0.18)` |
| Brand dim background | `--accent-primary-dim` | `rgba(124, 58, 237, 0.10)` |
| Brand glow | `--accent-primary-glow` | `rgba(124, 58, 237, 0.45)` |
| Secondary accent | `--accent-secondary` | `#2563eb` |
| Teal accent | `--accent-teal` | `#14b8a6` |
| Success | `--state-success` | `#34d399` |
| Warning | `--state-warning` | `#f59e0b` |
| Error | `--state-error` | `#ef4444` |
| Info | `--state-info` | `#60a5fa` |
| Chart primary | `--chart-primary` | `#8b5cf6` |
| Chart secondary | `--chart-secondary` | `#94a3b8` |
| Chart blue | `--chart-blue` | `#3b82f6` |
| Chart teal | `--chart-teal` | `#14b8a6` |
| Card shadow | `--shadow-card` | `0 24px 80px rgba(0, 0, 0, 0.35)` |
| Soft shadow | `--shadow-soft` | `0 14px 40px rgba(0, 0, 0, 0.24)` |
| Brand glow shadow | `--shadow-glow` | `0 0 48px rgba(124, 58, 237, 0.35)` |
| Primary gradient | `--gradient-primary` | `linear-gradient(135deg, #8b5cf6 0%, #6d28d9 55%, #4f46e5 100%)` |
| Hero radial gradient | `--gradient-hero` | `radial-gradient(circle at 75% 35%, rgba(124, 58, 237, 0.24), transparent 36%)` |

### Light Mode Tokens

| Role | CSS Variable | HEX / Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#fbfcff` |
| Page background soft gradient | `--bg-base-soft` | `#f5f7ff` |
| Surface | `--bg-surface` | `#ffffff` |
| Elevated surface | `--bg-elevated` | `#ffffff` |
| Subtle surface | `--bg-subtle` | `#f6f7fb` |
| Inset surface | `--bg-inset` | `#f8f9fc` |
| Overlay surface | `--bg-overlay` | `rgba(255, 255, 255, 0.82)` |
| Homepage dot color | `--bg-dot` | `rgba(100, 116, 139, 0.28)` |
| Default border | `--border-default` | `#e5e7ef` |
| Subtle border | `--border-subtle` | `#eef0f6` |
| Strong border | `--border-strong` | `#d6dbe8` |
| Primary text | `--text-primary` | `#0f172a` |
| Secondary text | `--text-secondary` | `#334155` |
| Muted text | `--text-muted` | `#64748b` |
| Faint text | `--text-faint` | `#94a3b8` |
| Brand accent | `--accent-primary` | `#6d28d9` |
| Brand hover | `--accent-primary-hover` | `#7c3aed` |
| Brand active | `--accent-primary-active` | `#5b21b6` |
| Brand text | `--accent-primary-text` | `#6d28d9` |
| Brand soft background | `--accent-primary-soft` | `rgba(109, 40, 217, 0.12)` |
| Brand dim background | `--accent-primary-dim` | `rgba(109, 40, 217, 0.07)` |
| Brand glow | `--accent-primary-glow` | `rgba(109, 40, 217, 0.24)` |
| Secondary accent | `--accent-secondary` | `#2563eb` |
| Teal accent | `--accent-teal` | `#0f766e` |
| Success | `--state-success` | `#16a34a` |
| Warning | `--state-warning` | `#f59e0b` |
| Error | `--state-error` | `#dc2626` |
| Info | `--state-info` | `#2563eb` |
| Chart primary | `--chart-primary` | `#6d28d9` |
| Chart secondary | `--chart-secondary` | `#94a3b8` |
| Chart blue | `--chart-blue` | `#2563eb` |
| Chart teal | `--chart-teal` | `#0f766e` |
| Card shadow | `--shadow-card` | `0 18px 50px rgba(15, 23, 42, 0.08)` |
| Soft shadow | `--shadow-soft` | `0 10px 28px rgba(15, 23, 42, 0.06)` |
| Brand glow shadow | `--shadow-glow` | `0 0 40px rgba(109, 40, 217, 0.18)` |
| Primary gradient | `--gradient-primary` | `linear-gradient(135deg, #8b5cf6 0%, #6d28d9 55%, #4f46e5 100%)` |
| Hero radial gradient | `--gradient-hero` | `radial-gradient(circle at 72% 34%, rgba(109, 40, 217, 0.14), transparent 38%)` |

## Token Usage Rules

- Use semantic tokens everywhere; do not hardcode color literals inside components.
- Use `bg-brand` or the gradient token for primary CTAs.
- Use `bg-brand-soft` for selected sidebar items, icon wells, pills, and subtle active states.
- Use `text-brand` for links, active labels, chart labels, and brand-emphasis text.
- Use `border-default` for cards and panels; use `border-subtle` for internal dividers.
- Use `text-muted` for metadata and secondary descriptions.
- Use `state-*` tokens for badges, validation, destructive actions, and status indicators.
- Dashboard charts must use chart tokens, not arbitrary palette values.

## Typography

| Role | Font | CSS Variable |
| --- | --- | --- |
| UI text | Geist Sans | `--font-geist-sans` |
| Code / mono | Geist Mono | `--font-geist-mono` |

Use Geist Sans as the base UI font with antialiasing. Use Geist Mono only for technical IDs, object keys, logs, code-like snippets, or compact numeric labels when needed. In Vite, load fonts with a normal font package/import strategy rather than `next/font`.

## Border Radius

Radius increases with surface depth. Keep the rounded visual language consistent with the references.

| Context | Class |
| --- | --- |
| Inline controls, inputs, badges | `rounded-xl` |
| Buttons and stat cards | `rounded-xl` or `rounded-2xl` |
| Cards and dashboard panels | `rounded-2xl` |
| Landing hero preview, large shells | `rounded-3xl` |
| Modal / overlay | `rounded-3xl` |
| Avatar and icon wells | `rounded-full` or `rounded-xl` depending on shape |

## Homepage Background

The homepage uses a full-page dotted background in both themes so it can later become reactive. The dots should be visible but still secondary to content.

Recommended CSS pattern:

```css
.dot-grid {
  background-color: var(--bg-base);
  background-image: radial-gradient(circle, var(--bg-dot) 1px, transparent 1px);
  background-size: 16px 16px;
}
```

Keep the homepage header minimal: brand on the left and a `Demo Login` CTA on the right. Do not add center nav links unless the user explicitly asks.

## Component Library

shadcn/ui sits on top of Tailwind. Do not create a separate custom design system. Components live in `client/src/shared/components/ui/` or the equivalent generated shadcn directory.

Use the shadcn CLI to add primitives when possible, then compose project-specific components in feature or shared layout folders.

Do not modify generated shadcn/ui foundation components unless a task explicitly requires it.

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
- Cards use soft borders, layered surfaces, and restrained shadows.
- Keep lists compact, readable, and aligned; avoid crowded text blocks.

### Employee Pages

- Reuse the same shell, spacing, card system, and tokens.
- Employee pages should feel simpler than admin pages and only expose self-service actions.
- Backend authorization determines available data; frontend hiding is only UX.

## Spacing and Density

- Page max width for landing pages: around `max-w-7xl` to `max-w-[1440px]`.
- Dashboard horizontal content padding: `px-6` to `px-8` on desktop.
- Card padding: `p-5` or `p-6` for panels, `p-4` for compact stats.
- Grid gaps: `gap-4` to `gap-6`.
- Avoid oversized empty spaces inside dashboard cards; this is a data app.

## Buttons and Interactions

- Primary buttons use the brand gradient, white text, soft glow, and hover lift/brightness.
- Secondary buttons use transparent or surface backgrounds with default borders.
- Active sidebar items use brand soft background, brand text, and a subtle left accent bar.
- Focus rings should use the brand ring token and be visible in both modes.
- Transitions should be subtle: `150ms` to `200ms` for hover/focus states.

## Icons

Use Lucide React. Prefer stroke-based icons only. Avoid mixed icon styles.

| Context | Size |
| --- | --- |
| Inline text icons | `h-4 w-4` |
| Buttons and nav links | `h-5 w-5` |
| Stat card icon wells | `h-5 w-5` or `h-6 w-6` |
| Landing feature icons | `h-6 w-6` or `h-7 w-7` |

## Charts and Data Visualization

- Use purple as the primary chart color in both themes.
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
