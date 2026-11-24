# Everything Calculator — Product Scope & Implementation Plan

A fast, zero-login, 100% client-side **Everything Calculator** web application designed in English for a global audience. This proposal brings together the 6 foundational daily calculators, a curated brainstorm of high-utility additional categories (Health & Fitness, Expanded Finance & Currency, Basic Statistics, and Time & Everyday Utilities), a clean single-page workspace design, and deterministic edge-case handling.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the proposed **Launch Roster (10 Categories)** and **Offline Currency Strategy** below before we generate the app. You can approve the recommended lineup as-is or trim/swap any optional categories.

- **Recommended Launch Lineup (Core 6 + 4 High-Utility Global Additions)**:
  - *Core 6*: **Standard & Scientific**, **Percentage & Discount**, **Tip & Bill Split**, **Unit Converter**, **Date & Age Difference**, and **Loan & Compound Interest**.
  - *Proposed Global Additions (from your brainstorm)*: **Health & Fitness** (BMI + Daily Calorie / BMR / TDEE), **Simple Interest & Savings** (bundled cleanly inside Finance alongside Loan & Compound Interest), **Currency Converter (Editable Reference Rates)**, and **Basic Statistics** (Mean, Median, Mode, Standard Deviation, Variance, Min/Max/Range).
  - *Optional Backlog Candidates (easy to swap in if preferred)*: **Time & Duration Math** (add/subtract hours & minutes, pace/speed), **Data Storage & Bandwidth** (MB/GB/Mbps transfer time), **GPA / Weighted Grade**, **Aspect Ratio & Screen Size**, and **Fuel Economy / Trip Cost** (L/100km & MPG).
- **Recommended Visual Theme**: Cool Swiss-utility palette (crisp slate neutrals, Precision Cobalt accent, tabular monospace numerals) with an instant **Light / Dark mode** toggle.
- **Recommended Global Formatting**: Browser-locale number formatting with a selectable currency symbol (`$`, `€`, `£`, `¥`, `₹`, `A$`, `C$`, `CHF`) and metric/imperial unit toggles wherever relevant.

---

## 1. Overview & Core Concept

- **What It Does**: Provides instant, distraction-free mathematical, financial, health, statistical, and everyday conversions in a single responsive web workspace—all computed locally in the browser with zero latency, no sign-in, and no external API dependencies.
- **Target Audience / Persona**: Global everyday users—students, travelers, shoppers, freelancers, home cooks, fitness trackers, and small-business owners—who want trustworthy answers immediately on desktop or mobile without ads, popups, or multi-page navigation.
- **Key Value**: Replaces a dozen ad-heavy single-purpose calculator websites with one fast, keyboard-friendly, mathematically transparent utility that works offline and keeps a local calculation history tape.

---

## 2. Proposed Calculator Categories (Core + Brainstormed Global Additions)

To keep the interface lightweight and scannable while covering high-frequency global needs, calculators are organized into **4 intuitive navigation groups** totaling **9 focused workspaces** (so every tool is one click away without scrolling through a bloated directory):

| Group | Calculator Workspace | Included Sub-Modes & Global Capabilities |
| :--- | :--- | :--- |
| **Everyday Math** | **1. Standard & Scientific** | Full keypad + keyboard input, expression preview, parentheses, `%`, `√`, `xʸ`, `1/x`, `±`, memory (`MC/MR/M+/M-`), and toggleable Scientific row (`sin/cos/tan` with Deg/Rad, `log`, `ln`, `π`, `e`, `n!`). |
| **Everyday Math** | **2. Percentage & Discount** | Three-in-one solver: (a) What is X% of Y, (b) Percentage increase/decrease between two values, and (c) Shopping Discount & Sales Tax/VAT calculator showing exact savings and final price. |
| **Everyday Math** | **3. Tip & Bill Split** | Bill subtotal, optional pre-tax tip toggle, quick tip presets (`10%`, `15%`, `18%`, `20%`, custom), split across `N` people, and optional round-up to whole currency units. |
| **Converters & Time** | **4. Unit Converter** | Instant bidirectional conversion across Length, Weight/Mass, Temperature (`°C`, `°F`, `K`), Volume/Cooking, Area, Speed, and Data Storage (`KB/MB/GB/TB` decimal & binary) with a one-click swap button. |
| **Converters & Time** | **5. Date & Age Difference** | Exact calendar span in years/months/days + total days/weeks/hours, next birthday countdown, weekday finder, and "Add/Subtract Days" date offset mode. |
| **Finance** | **6. Loan, Compound & Simple Interest** | Unified Finance Hub with three clean tabs: **Loan / Mortgage** (monthly payment, total interest, compact amortization summary), **Compound Interest** (recurring monthly contributions, compounding frequency from daily to annually, principal vs. interest bar), and **Simple Interest** (`I = P·r·t` for short-term loans/deposits). |
| **Finance** | **7. Currency Converter (Offline-First)** | Converts across 20+ major world currencies using built-in reference rates with a clear **"Edit Rate"** override input and timestamp note—allowing travelers and global users to plug in their exact bank/card rate while keeping the app 100% client-side with zero API failure modes. |
| **Health & Data** | **8. Health & Fitness** | Two clean tabs supporting both **Metric (kg/cm)** and **Imperial (lb/ft-in)**: **BMI Calculator** (WHO category bands + healthy weight range for user's height) and **Daily Calorie (BMR & TDEE)** using the Mifflin-St Jeor equation across 5 activity levels (maintenance, mild loss, gain). |
| **Health & Data** | **9. Basic Statistics** | Accepts comma, space, or newline-separated datasets (with one-click sample data & clear). Computes Count, Sum, Mean, Median, Mode(s), Min, Max, Range, Sample & Population Variance, Standard Deviation, and Quartiles (`Q1`, `Q3`, `IQR`) with a live inline distribution bar. |

> [!NOTE]
> **Additional Brainstormed Categories (Available as Future Add-Ons or Swaps)**
> If you would like to substitute or expand beyond these 9 workspaces, these client-side tools are also high-value globally:
> 1. **Time Duration & Pace**: Add/subtract hours-minutes-seconds (`hh:mm:ss`), calculate running/cycling pace (`min/km` vs `min/mi`), and work-hours timesheet totals.
> 2. **Fuel & Trip Cost**: Estimate trip fuel cost using distance, fuel efficiency (`L/100km`, `km/L`, or `MPG`), and fuel price per liter/gallon.
> 3. **Weighted Grade / GPA**: Enter assignment weights and scores to compute final percentage and minimum score needed on a final exam.
> 4. **Cooking & Recipe Scaler**: Multiply or divide ingredient quantities cleanly with fraction support (`1/2`, `3/4`).
> 5. **Aspect Ratio & Resolution**: Scale dimensions proportionally (`16:9`, `4:3`, custom) for designers and photographers.

---

## 3. User Experience & Visual Design

### Key User Flows
1. **Immediate Entry (Zero-State Ready)**: On first load, the app opens straight into the **Standard Calculator** (or last-used mode) with sensible, realistic defaults in form-based calculators so results render immediately on the first keystroke—never a blank screen or marketing splash wall.
2. **Instant Mode Switching**: Users switch tools via the left category sidebar (or quick filter/keyboard shortcut `⌘K` / `/`). Active inputs per calculator persist in session memory so switching from Unit Converter to Tip Split and back does not erase work.
3. **Real-Time Recalculation & Formula Transparency**: Every form-based calculator updates live as the user types (no mandatory "Submit" button required), shows the primary result prominently in large tabular numerals, includes a one-click **Copy Result** action, and offers a compact expandable **Formula & Breakdown** line explaining *how* the number was computed.
4. **Local History Tape**: Completing a calculation (or clicking "Save to History" in form modes) appends an entry to the collapsible right-side History Tape stored in `localStorage`. Clicking any history item copies the value or reloads the expression.

### Visual Identity & Theme
- **Aesthetic Direction**: **Swiss Precision Utility** — crisp, calm, and instrument-grade, inspired by classic modernist drafting tools and desktop calculators. Generous whitespace, single-elevation flat surfaces with crisp `1px` hairlines, zero decorative clutter, zero pill-badge noise.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - *Light Mode (Default)*: 60% cool paper canvas (`--background: #F8FAFC`), 30% pure crisp workspaces (`--surface: #FFFFFF`, hairline borders `#E2E8F0`, slate ink `#0F172A`, muted slate `#475569`), 10% **Precision Cobalt** (`--primary: #2563EB`, hover `#1D4ED8`) reserved strictly for primary actions, active navigation indicators, and `=` key emphasis.
  - *Dark Mode (Toggleable)*: 60% deep slate (`#0F172A`), 30% elevated slate surfaces (`#1E293B`, borders `#334155`, light ink `#F1F5F9`), 10% vivid cobalt (`#3B82F6`), wired cleanly via Tailwind v4 `@custom-variant dark`.
  - *Semantic Signals (always paired with explicit text labels)*: Emerald (`#16A34A`) for savings/nominal ranges, Amber (`#D97706`) for caution/elevated warnings, Crimson (`#DC2626`) for validation errors.
- **Typography & Hierarchy**:
  - *Display & Navigation*: `Plus Jakarta Sans` (SemiBold 600 / Bold 700, `text-wrap: balance`).
  - *Body & Form Labels*: `DM Sans` (Regular 400 / Medium 500, crisp legibility at 13px–15px).
  - *Numeric Displays, Keys & Data Tables*: `JetBrains Mono` with strict `font-variant-numeric: tabular-nums` so digits never jitter horizontally as values update live.
- **Layout Architecture**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Everything Calculator         [Search / Jump to mode]     [Currency] [◐]   │
├──────────────────────┬──────────────────────────────────┬──────────────────┤
│ EVERYDAY MATH        │  Loan, Compound & Simple Interest│  HISTORY TAPE    │
│  • Standard / Sci    │  ──────────────────────────────  │  ──────────────  │
│  • Percent & Discount│  [Loan] [Compound] [Simple]      │  Standard        │
│  • Tip & Bill Split  │                                  │  (245 + 18) × 3  │
│                      │  ┌────────────────────────────┐  │  = 789    [Copy] │
│ CONVERTERS & TIME    │  │ Primary Result Readout     │  │  ──────────────  │
│  • Unit Converter    │  │ $1,610.46 / month          │  │  Unit Converter  │
│  • Date & Age Diff   │  │ Total Interest: $179,765   │  │  10 km → 6.21 mi │
│                      │  └────────────────────────────┘  │  ──────────────  │
│ FINANCE              │                                  │  [Clear History] │
│  • Interest & Loans  │  Principal    [ 300,000       ]  │                  │
│  • Currency Rates    │  Annual Rate  [ 5.0         % ]  │                  │
│                      │  Term (Years) [ 30          yr]  │                  │
│ HEALTH & DATA        │                                  │                  │
│  • Health (BMI/Cal)  │  Breakdown bar & Formula note    │                  │
│  • Basic Statistics  │  [Copy Summary]  [Save]  [Reset] │                  │
└──────────────────────┴──────────────────────────────────┴──────────────────┘
```
*(On mobile viewports `< 1024px`, the sidebar collapses into a clean top horizontal category bar + slide-over drawer, and the History Tape opens via a dedicated drawer button so sticky chrome never exceeds 15% of viewport height.)*

### Interactive Feedback & Motion
- Snappy tactile press feedback (`120ms`, compositor-only `transform`/`opacity`) on keypad buttons and tab switches.
- Inline "Copied" button label transition (`1.5s`) when copying any result.
- Respects `prefers-reduced-motion` across all transitions.

---

## 4. Key Product Decisions, Trade-Offs & Edge-Case Handling

### Decision 1: Pure Client-Side Math Engine (No `eval()`, High-Precision Formatting)
- **Chosen Approach**: Build a dedicated, pure TypeScript calculation engine with a recursive-descent expression parser (Shunting-Yard / AST evaluator) for the Standard/Scientific calculator and isolated pure functions for every domain calculator.
- **Why**: Eliminates security risks of `eval()`/`new Function()`, gives deterministic operator precedence and parentheses handling, and enables unit testing every math formula directly.
- **Floating-Point Precision**: Apply epsilon rounding (`1e-12` cleanup) before display formatting so classic IEEE-754 artifacts like `0.1 + 0.2 = 0.30000000000000004` cleanly display as `0.3` without truncating true scientific precision.

### Decision 2: Offline-First Currency Converter with Editable Exchange Rates
- **Chosen Approach**: Ship curated reference exchange rates for 20+ major currencies (USD, EUR, GBP, JPY, CNY, INR, CAD, AUD, CHF, KRW, SGD, HKD, MXN, BRL, etc.) plus a prominent **"Custom Rate"** input that lets users enter any live bank or card rate instantly.
- **Why**: Guarantees 100% client-side operation with zero CORS issues, zero API rate limits, zero broken states offline, and full transparency (explicitly labeled as "Reference rates — editable for live bank rates").
- **Alternatives Considered**: Calling a free third-party exchange-rate API—rejected because free endpoints frequently fail, rate-limit, or break in offline/sandboxed environments.

### Decision 3: Comprehensive Edge-Case Handling Strategy
Every calculator handles real-world malformed or boundary inputs gracefully without ever displaying `NaN`, `Infinity`, or crashing:

| Domain | Edge Cases Handled Explicitly |
| :--- | :--- |
| **Standard & Scientific** | Division by zero (`Cannot divide by zero`), domain errors (`√(-4)`, `log(0)`, negative/non-integer factorials, factorial overflow `> 170!`), mismatched parentheses (auto-balanced or clear inline message), repeated decimal points (`1.2.3`), very large/small magnitudes (automatic scientific notation `≥ 1e12` or `< 1e-6`), and trailing operators on `=`. |
| **Percentage & Discount** | `0` base in percentage-change calculation (`Undefined change from 0`), discounts `> 100%` or negative tax rates (clamped/warned inline), stacked vs. single discount clarity. |
| **Tip & Bill Split** | `0` or non-integer party size (enforces integer `≥ 1`), negative bill amounts blocked, penny-rounding discrepancy note when splitting indivisible totals (e.g., `$100 / 3`). |
| **Unit Converter** | Absolute zero floor for Temperature (`< -273.15°C`, `< -459.67°F`, `< 0 K` flagged clearly), negative lengths/weights/volumes blocked with non-destructive inline hint, scientific notation for extreme unit ratios (e.g., millimeters to miles). |
| **Date & Age Difference** | Leap years (Feb 29 birthdays and 2000/2024/2100 rules), end-of-month rollover when adding months/days, reversed date order (automatically computes positive span + notes "Start date is after end date"), invalid calendar dates, and timezone-safe UTC midnight arithmetic to prevent DST off-by-one-day bugs. |
| **Loan & Interest** | **`0%` interest rate** (falls back cleanly from amortization division-by-zero to `Principal / Months`), `0` loan term or negative values, extreme compounding periods, and clear distinction between APR and periodic rate. |
| **Health (BMI & Calories)** | Unrealistic/zero height or weight guarded cleanly, seamless Metric ↔ Imperial unit conversion without rounding drift, explicit non-medical informational disclaimer, and safe clamping on age/height/weight inputs. |
| **Basic Statistics** | Empty input, single-value datasets (`Sample Std Dev` shows `N/A (needs ≥ 2 values)` instead of `NaN`), multimodal vs. no-mode datasets (when all values occur once, displays `No mode`), mixed delimiters (commas, spaces, tabs, newlines), and non-numeric tokens gracefully highlighted & ignored with a count warning. |

---

## 5. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        App Shell & Layout                            │
│  Theme Context (Light/Dark) · Global Currency · Mode Router State    │
├────────────────────┬─────────────────────────┬───────────────────────┤
│  Category Sidebar  │   Active Mode Viewport  │  History Tape Store   │
│  + Quick Filter    │  (9 Pure Calculator UIs)│  (localStorage sync)  │
└─────────┬──────────┴────────────┬────────────┴───────────┬───────────┘
          │                       │                        │
          │ selects mode          │ calls pure functions   │ appends/copies
          ▼                       ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Pure TypeScript Calculation & Formatting Engine         │
│  • Expression Parser (Shunting-Yard)   • Finance & Interest Math     │
│  • Unit & Offline Currency Tables      • UTC Calendar & Date Math    │
│  • Health (BMI, Mifflin-St Jeor)       • Descriptive Statistics      │
│  • Locale Number Formatter & Epsilon Precision Sanitizer             │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Mode Session Cache (In-Memory React State)**: Preserves current input fields for each of the 9 calculator modes while switching tabs, with a per-mode **Reset** button.
- **History Tape (`localStorage`, capped at 50 entries)**: Stores `{ id, mode, summary, result, timestamp }` with one-click copy, individual delete, and clear-all actions.
- **Global Preferences (`localStorage`)**: Persists Light/Dark theme (`theme`), preferred currency symbol (`currency`), and default unit system (`metric` vs `imperial`).

### Interactive Component & State Mapping
- **Global Keyboard Layer**: Routes numeric keys, operators, `Enter`, `Backspace`, and `Escape` directly to the Standard/Scientific calculator when no text input is focused, plus `/` or `⌘K` to jump straight to the mode quick-finder.
- **Controlled Numeric Inputs**: Parse decimal separators cleanly, allow intermediate typing states (`""`, `"."`, `"-"`) without cursor jumping, and render non-blocking inline validation hints whenever an edge case is triggered.
- **Testable Logic Separation**: All mathematical engines, parsers, date calculators, statistics routines, and edge-case validators live in pure TypeScript modules decoupled from React UI components so they can be exhaustively verified with automated unit tests (`node:test`) alongside real-browser visual and interaction checks.
