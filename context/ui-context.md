# UI Context

## Visual References

Use the reference images in the `context/images/` folder as the source of truth for visual direction:

- `context/images/dashboard/dashboard-dark-reference.png`
- `context/images/dashboard/dashboard-light-reference.png`
- `context/images/homepage/homepage-dark-reference.png`
- `context/images/homepage/homepage-light-reference.png`

The visual language is a clean modern SaaS employee-management product: rounded cards, soft borders, subtle shadows, muted burnt-orange brand accents, readable dashboard density, and matching black/grey/orange dark/light mode layouts.

## Theme

The app supports both dark and light modes. All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens. Components must use semantic tokens instead of hardcoded hex values or raw palette utilities such as `slate-*`, `zinc-*`, `purple-*`, or `green-*`.

Recommended utility naming: `bg-base`, `bg-surface`, `bg-elevated`, `bg-subtle`, `border-default`, `border-subtle`, `text-primary`, `text-secondary`, `text-muted`, `text-brand`, `bg-brand`, `bg-brand-soft`, `ring-brand`, `shadow-card`, and `shadow-glow`.

If the project uses Tailwind v4, map these variables with `@theme inline`. If the project uses Tailwind v3, mirror the same semantic token names in `tailwind.config.ts`.

### Dark Mode Tokens

| Role                          | CSS Variable              | HEX / Value                                                                       |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| Page background               | `--bg-base`               | `#0e0e0e`                                                                         |
| Page background soft gradient | `--bg-base-soft`          | `#181818`                                                                         |
| Surface                       | `--bg-surface`            | `#141414`                                                                         |
| Elevated surface              | `--bg-elevated`           | `#202020`                                                                         |
| Subtle surface                | `--bg-subtle`             | `#2b2b2b`                                                                         |
| Inset surface                 | `--bg-inset`              | `#101010`                                                                         |
| Overlay surface               | `--bg-overlay`            | `rgba(20, 20, 20, 0.82)`                                                          |
| Homepage dot color            | `--bg-dot`                | `rgba(217, 119, 38, 0.16)`                                                        |
| Surface gradient              | `--gradient-surface`      | `linear-gradient(145deg, #111111 0%, #232323 100%)`                               |
| Elevated gradient             | `--gradient-elevated`     | `linear-gradient(145deg, #1a1a1a 0%, #2f2f2f 100%)`                               |
| Overlay gradient              | `--gradient-overlay`      | `linear-gradient(145deg, rgba(17, 17, 17, 0.90) 0%, rgba(39, 39, 39, 0.84) 100%)` |
| Default border                | `--border-default`        | `#303030`                                                                         |
| Subtle border                 | `--border-subtle`         | `#252525`                                                                         |
| Strong border                 | `--border-strong`         | `#464646`                                                                         |
| Primary text                  | `--text-primary`          | `#f8f8f8`                                                                         |
| Secondary text                | `--text-secondary`        | `#d4d4d4`                                                                         |
| Muted text                    | `--text-muted`            | `#a3a3a3`                                                                         |
| Faint text                    | `--text-faint`            | `#737373`                                                                         |
| Brand accent                  | `--accent-primary`        | `#e57922`                                                                         |
| Brand hover                   | `--accent-primary-hover`  | `#ed8936`                                                                         |
| Brand active                  | `--accent-primary-active` | `#c8661d`                                                                         |
| Brand text                    | `--accent-primary-text`   | `#f0a05b`                                                                         |
| Brand soft background         | `--accent-primary-soft`   | `rgba(229, 121, 34, 0.17)`                                                        |
| Brand dim background          | `--accent-primary-dim`    | `rgba(229, 121, 34, 0.10)`                                                        |
| Brand glow                    | `--accent-primary-glow`   | `rgba(229, 121, 34, 0.28)`                                                        |
| Secondary accent              | `--accent-secondary`      | `#737373`                                                                         |
| Teal accent                   | `--accent-teal`           | `#2dd4bf`                                                                         |
| Success                       | `--state-success`         | `#34d399`                                                                         |
| Warning                       | `--state-warning`         | `#f59e0b`                                                                         |
| Error                         | `--state-error`           | `#ef4444`                                                                         |
| Info                          | `--state-info`            | `#60a5fa`                                                                         |
| Chart primary                 | `--chart-primary`         | `#e57922`                                                                         |
| Chart secondary               | `--chart-secondary`       | `#737373`                                                                         |
| Chart blue                    | `--chart-blue`            | `#a3a3a3`                                                                         |
| Chart teal                    | `--chart-teal`            | `#2dd4bf`                                                                         |
| Card shadow                   | `--shadow-card`           | `0 24px 80px rgba(0, 0, 0, 0.35)`                                                 |
| Soft shadow                   | `--shadow-soft`           | `0 14px 40px rgba(0, 0, 0, 0.24)`                                                 |
| Brand glow shadow             | `--shadow-glow`           | `0 0 38px rgba(229, 121, 34, 0.22)`                                               |
| Primary gradient              | `--gradient-primary`      | `linear-gradient(180deg, #ee9a54 0%, #e57922 50%, #c8661d 100%)`                  |
| Hero radial gradient          | `--gradient-hero`         | `radial-gradient(circle at 75% 35%, rgba(229, 121, 34, 0.18), transparent 36%)`   |

### Light Mode Tokens

| Role                          | CSS Variable              | HEX / Value                                                                             |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| Page background               | `--bg-base`               | `#f3f2ef`                                                                               |
| Page background soft gradient | `--bg-base-soft`          | `#e7e4df`                                                                               |
| Surface                       | `--bg-surface`            | `#fbfaf8`                                                                               |
| Elevated surface              | `--bg-elevated`           | `#ffffff`                                                                               |
| Subtle surface                | `--bg-subtle`             | `#ebe8e3`                                                                               |
| Inset surface                 | `--bg-inset`              | `#dedbd5`                                                                               |
| Overlay surface               | `--bg-overlay`            | `rgba(251, 250, 248, 0.86)`                                                             |
| Homepage dot color            | `--bg-dot`                | `rgba(194, 101, 28, 0.16)`                                                              |
| Surface gradient              | `--gradient-surface`      | `linear-gradient(145deg, #ffffff 0%, #f1eee8 100%)`                                     |
| Elevated gradient             | `--gradient-elevated`     | `linear-gradient(145deg, #ffffff 0%, #ebe7df 100%)`                                     |
| Overlay gradient              | `--gradient-overlay`      | `linear-gradient(145deg, rgba(255, 255, 255, 0.90) 0%, rgba(238, 234, 226, 0.88) 100%)` |
| Default border                | `--border-default`        | `#d6d2ca`                                                                               |
| Subtle border                 | `--border-subtle`         | `#e4e0d8`                                                                               |
| Strong border                 | `--border-strong`         | `#b8b2a8`                                                                               |
| Primary text                  | `--text-primary`          | `#080808`                                                                               |
| Secondary text                | `--text-secondary`        | `#1f1d1a`                                                                               |
| Muted text                    | `--text-muted`            | `#403b35`                                                                               |
| Faint text                    | `--text-faint`            | `#5f574d`                                                                               |
| Brand accent                  | `--accent-primary`        | `#d06a1c`                                                                               |
| Brand hover                   | `--accent-primary-hover`  | `#df7a24`                                                                               |
| Brand active                  | `--accent-primary-active` | `#b65a18`                                                                               |
| Brand text                    | `--accent-primary-text`   | `#9f4d12`                                                                               |
| Brand soft background         | `--accent-primary-soft`   | `rgba(208, 106, 28, 0.13)`                                                              |
| Brand dim background          | `--accent-primary-dim`    | `rgba(208, 106, 28, 0.08)`                                                              |
| Brand glow                    | `--accent-primary-glow`   | `rgba(208, 106, 28, 0.20)`                                                              |
| Secondary accent              | `--accent-secondary`      | `#525252`                                                                               |
| Teal accent                   | `--accent-teal`           | `#0f766e`                                                                               |
| Success                       | `--state-success`         | `#16a34a`                                                                               |
| Warning                       | `--state-warning`         | `#f59e0b`                                                                               |
| Error                         | `--state-error`           | `#dc2626`                                                                               |
| Info                          | `--state-info`            | `#2563eb`                                                                               |
| Chart primary                 | `--chart-primary`         | `#d06a1c`                                                                               |
| Chart secondary               | `--chart-secondary`       | `#8c8780`                                                                               |
| Chart blue                    | `--chart-blue`            | `#525252`                                                                               |
| Chart teal                    | `--chart-teal`            | `#0f766e`                                                                               |
| Card shadow                   | `--shadow-card`           | `0 18px 50px rgba(23, 23, 23, 0.10)`                                                    |
| Soft shadow                   | `--shadow-soft`           | `0 10px 28px rgba(23, 23, 23, 0.08)`                                                    |
| Brand glow shadow             | `--shadow-glow`           | `0 0 32px rgba(208, 106, 28, 0.16)`                                                     |
| Primary gradient              | `--gradient-primary`      | `linear-gradient(180deg, #df8a42 0%, #d06a1c 54%, #b65a18 100%)`                        |
| Hero radial gradient          | `--gradient-hero`         | `radial-gradient(circle at 72% 34%, rgba(208, 106, 28, 0.12), transparent 38%)`         |

## Token Usage Rules

- Use semantic tokens everywhere; do not hardcode color literals inside components.
- Surface, elevated, card, popover, and overlay backgrounds may use their semantic gradient variables through the matching utility classes.
- Use `bg-brand` or the gradient token for primary CTAs.
- Use `bg-brand-soft` for selected sidebar items, icon wells, pills, and subtle active states.
- Use `text-brand` for links, active labels, chart labels, and brand-emphasis text.
- Use `border-default` for cards and panels; use `border-subtle` for internal dividers.
- Use `text-muted` for metadata and secondary descriptions.
- Use `state-*` tokens for badges, validation, destructive actions, and status indicators.
- Dashboard charts must use chart tokens, not arbitrary palette values.

## Typography

| Role        | Font       | CSS Variable        |
| ----------- | ---------- | ------------------- |
| UI text     | Geist Sans | `--font-geist-sans` |
| Code / mono | Geist Mono | `--font-geist-mono` |

Use Geist Sans as the base UI font with antialiasing. Use Geist Mono only for technical IDs, object keys, logs, code-like snippets, or compact numeric labels when needed. In Vite, load fonts with a normal font package/import strategy rather than `next/font`.

## Border Radius

Radius increases with surface depth. Keep the rounded visual language consistent with the references.

| Context                            | Class                                             |
| ---------------------------------- | ------------------------------------------------- |
| Inline controls, inputs, badges    | `rounded-xl`                                      |
| Buttons and stat cards             | `rounded-xl` or `rounded-2xl`                     |
| Cards and dashboard panels         | `rounded-2xl`                                     |
| Landing hero preview, large shells | `rounded-3xl`                                     |
| Modal / overlay                    | `rounded-3xl`                                     |
| Avatar and icon wells              | `rounded-full` or `rounded-xl` depending on shape |

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

| Context               | Size                   |
| --------------------- | ---------------------- |
| Inline text icons     | `h-4 w-4`              |
| Buttons and nav links | `h-5 w-5`              |
| Stat card icon wells  | `h-5 w-5` or `h-6 w-6` |
| Landing feature icons | `h-6 w-6` or `h-7 w-7` |

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
