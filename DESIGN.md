---
name: Real o IA
description: An editorial comparison desk with warm dark and ivory light themes.
colors:
  dark-bg: "#191b18"
  dark-surface: "#20251f"
  dark-text: "#eeeae0"
  dark-muted: "#b9c4b4"
  dark-line: "#525e4c"
  dark-line-quiet: "#3a4435"
  dark-accent: "#e6a38b"
  dark-green: "#315e48"
  dark-green-hover: "#3b7357"
  dark-tag-green: "#38594a"
  dark-tag-clay: "#934e3c"
  dark-sage: "#b4c5a8"
  dark-agreement: "#2b3328"
  dark-focus: "#e6bb8b"
  dark-error: "#ffc1ac"
  light-bg: "#f6f4ee"
  light-surface: "#efeee6"
  light-text: "#222c24"
  light-muted: "#596650"
  light-line: "#949e8c"
  light-line-quiet: "#d4d8cb"
  light-accent: "#a04f38"
  light-green: "#315e48"
  light-green-hover: "#254d3a"
  light-tag-green: "#436859"
  light-tag-clay: "#a8533e"
  light-sage: "#677b60"
  light-agreement: "#e7e9df"
  light-focus: "#8f422d"
  light-error: "#92381f"
  action-text: "#fff9ed"
  tag-text: "#fff5e7"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 500
rounded:
  control: "8px"
  surface: "12px"
spacing:
  compact: "12px"
  related: "18px"
  control: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.dark-green}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  button-secondary:
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  model-tag:
    backgroundColor: "{colors.dark-tag-green}"
    textColor: "{colors.tag-text}"
    rounded: "{rounded.control}"
    padding: "5px 13px"
  agreement:
    backgroundColor: "{colors.dark-agreement}"
    rounded: "{rounded.surface}"
    padding: "24px 28px"
---

# Design System: Real o IA

## Overview

**Creative North Star: “Editorial comparison desk.”**

Approved direction A pairs expressive serif headings with quiet sans-serif data. Warm dark and ivory light themes share forest actions, sage rules and terracotta accents. Aligned data and restrained separators provide structure.

Source-derived from `src/styles.css` and `src/App.tsx`, following user approval. Visual inspection was unavailable because of socket restrictions. This record captures implemented code, not a verified browser rendering.

**Key Characteristics:** editorial typography, warm neutrals, flat surfaces, explicit states.

## Colors

### Primary

Forest (`green`) identifies upload actions and `green-hover` their hover state. Sage identifies REAL predictions and matching agreement. Terracotta (`accent`) identifies pending/FAKE predictions and nonmatching agreement. Text always communicates the state alongside color.

### Neutral

Each theme supplies equivalent background, surface, text, muted, line, quiet-line and agreement roles. Strong rules divide models and metric headings; quiet rules separate rows. Model tags use forest and clay with warm light text. Focus and error have distinct roles.

Frontmatter prefixes identify theme palettes. Runtime CSS uses unprefixed custom properties and switches values through the root theme attribute. Primary component tokens describe the default dark palette; light mode substitutes matching light roles.

## Typography

Self-hosted Newsreader (Georgia, serif fallback) carries identity, headings, upload prompts, predictions and agreement. Self-hosted DM Sans (sans-serif fallback) carries controls, tags, metrics and supporting copy. Both variable fonts use swap loading.

Model headings use the display token. Predictions are prominent (34px, line-height 1.25, tracking −0.025em). Wordmark is compact (28px, weight 600, tracking −0.03em). Supporting copy is small (12–13px); input-preview labels use serif type (19px). Metrics use tabular numerals with unbroken values.

## Layout

A centered document container (maximum 1152px) shares header and content alignment, with desktop side padding (36px). Natural vertical scrolling places image work above comparison. Surface composition remains recorded in `.impeccable/surface.md`.

At widths up to 800px, side padding becomes 24px, preview controls stack and columns narrow their spacing. At widths up to 520px, side padding becomes 20px, model columns stack in reading order and agreement becomes vertical. From 1400px, upload height grows from 376px to 410px and top spacing increases. Body minimum width is 320px.

Equal model columns use a vertical dividing rule, replaced by a horizontal rule on narrow screens. Shared metric alignment and generous sectional spacing preserve comparison.

## Elevation & Depth

No shadows or gradients. Tonal surfaces, dashed image boundaries and one-pixel rules establish grouping. Preserve this flat editorial treatment.

## Shapes

Controls, model tags and thumbnails use gently curved control corners; larger upload, agreement and theme-toggle surfaces use surface corners. Original images use contain sizing. Model thumbnails use pixelated rendering. Icons are round-capped outline SVGs.

## Components

**Actions.** Forest primary and outlined secondary buttons share a minimum height (48px), inline icons (18px) and medium label weight. Secondary hover adds surface tone. Disabled controls use opacity (0.48). Theme toggle is an outlined square (44px) with sun or moon icon.

**Upload.** A dashed sage boundary surrounds the prompt or original image. Hover changes boundary to accent and background to agreement. Drag adds an inset accent outline. The surface is a keyboard-operable button.

**Model comparison.** Serif heading, identity tag, prominent prediction and definition-list metrics form each model column. Empty and loading states are explicit; unavailable values remain dashes. Prediction changes use polite live regions and models expose busy state.

**Agreement.** A tonal surface pairs serif title and status, divided by a sage rule at wider sizes. Matching text uses sage; pending or differing text uses accent. The region exposes polite status semantics.

**Feedback.** Errors use error color and alert semantics. Resource notes use muted text. Keyboard focus uses a three-pixel outline with five-pixel offset. State transitions last 0.18s; reduced-motion preference removes transitions.

## Do's and Don'ts

- **Do** preserve semantic role equivalence in both themes.
- **Do** pair color with readable status text.
- **Do** preserve serif hierarchy, whitespace and aligned numeric metrics.
- **Don't** add shadows or decorative gradients.
- **Don't** invent metrics or predictions as placeholders.
