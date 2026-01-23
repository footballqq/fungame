# Snail Game Design (Redesign v2)

## 1. Core Concept
**Title**: Snail vs Monsters (蜗牛与怪物)
**Languages**: English / Chinese (Switchable).
**Grid**: Coordinates $(Row, Col)$ where $Row \in [1..M], Col \in [1..N]$.
- Row $1$: Safe Zone (Start).
- Row $M$: Safe Zone (Goal).
- Rows $2 \dots M-1$: **Exactly 1 monster per row** AND **Max 1 monster per column**.

## 2. Game Modes

### Mode A: Adventure Mode (Player = Snail)
**Objective**: Reach the last row with minimum attempts.
**Gameplay**:
1.  **Map**: Computer generates hidden monsters.
2.  **Start**: Player clicks any cell in Row 1 to start.
3.  **Movement**: Player clicks neighbor cells to move.
4.  **Encounter**: 
    - Walking into a monster cell $\rightarrow$ "Death".
    - **Penalty**: Reset to Row 1 (Player chooses start point again).
    - **Memory**: Monster location is permanently revealed.
5.  **Path History (New)**:
    - Every attempt has a unique path color.
    - Path $k$ is drawn on top of Path $k-1$ (Layered visualization).
    - Allows player to visualize "Explored Territory".
6.  **Scoring**:
    - Count total attempts (Resets). 
    - Win Message: Praise varies by attempt count (e.g., "Genius!" vs "Persistent!").

### Mode B: Mastermind Mode (Player = Monster)
**Objective**: Define monsters to block the snail (or watch the AI solve it).
**Gameplay**:
1.  **Role**: Player controls the traps (monsters). Snail is AI.
2.  **Snail AI (The "Smart" Snail)**:
    - Moves slowly: **1 step / second**.
    - Moves fast (**0.2 step / second**) if it calculates a guaranteed safe path.
3.  **Player Interaction (Intercept)**:
    - Snail moves.
    - Player can click the **Snail's current cell** (only if Row $\ge 2$) to "Reveal/Place" a monster there.
    - **Effect**: If player clicks, it counts as "Snail hit monster". Snail resets and learns.
4.  **Snail Algorithm**:
    - **Step 1**: Move to $(2, 1)$.
    - **Step 2 (Sweep)**: If safe, move Right $(2, 2) \rightarrow (2, 3) \dots$ until blocked (Monster discovered).
    - **Step 3 (Z-Maneuver)**:
        - If blocked at $(2, k)$, perform **Z-Pattern** from current position: Down $\rightarrow$ Right $\rightarrow$ Down $\rightarrow$ Right.
        - **Escape Logic**: If Z-Pattern hits a monster at $(i, j)$:
            1.  Retrace to $(i-1, j-1)$ (Safe spot).
            2.  Move to $(i, j-1)$.
            3.  Move **Left** until Column 1.
            4.  Move **Down**.
    - **Optimization**: Snail remembers all previous monster locations to deduce safe columns using the "1 per row/col" rule.

## 3. UI/UX Flow
1.  **Intro Screen**:
    - Title & Brief Rule description.
    - Language Toggle (CN/EN).
    - Two Buttons: [ I am Snail (Adventure) ] [ I am Monster (Mastermind) ].
2.  **Game Screen**:
    - Top: Status (Attempts, Mode).
    - Center: Grid.
    - Bottom: Controls (Restart, Back to Menu).

## 4. Technical Requirements
- **Path Layering**: Canvas or SVG might be better than pure DIVs for overlapping semi-transparent paths, but DIVs with `z-index` or background-color blending can work for a discrete grid.
- **Localization**: All strings in a `const strings = { cn: {}, en: {} }` object.
