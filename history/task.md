# Idiom Sorting Game - Development Task List

## 1. Project Setup & Architecture
- [x] **Project Initialization**
    - [x] Define directory structure (`history/`)
    - [x] Create `productdesign.md`
    - [x] Create `readme.md`
- [x] **Architecture Design**
    - [x] Define Resource System (Manifest + Card Folders)
    - [x] Define Frontend Architecture (Vanilla JS + CSS)

## 2. Resource Generation System (Tools)
- [x] **Common Utilities** (`tools/common.py`)
- [x] **Metadata Generator** (`tools/gen_meta.py`)
    - [x] Implement LLM Interface (using `utils.llm_api`)
    - [x] Implement Data Verification
- [x] **Image Generator** (`tools/gen_image.py`)
    - [x] Implement Mock Generator (Beige Images)
    - [ ] Implement Real Image Generation (API Integration)
- [x] **Resource Packer** (`tools/pack.py`)
    - [x] Implement `manifest.json` generation
    - [x] Validate resource integrity

## 3. Frontend Development (Game)
- [x] **Core Structure**
    - [x] `index.html` (Start/Game/Result Screens)
    - [x] `style.css` (Basic styling)
- [x] **Game Logic** (`script.js`)
    - [x] Resource Loading (`ResourceManager`)
    - [x] Game State Management (`GameApp`)
    - [x] Card Rendering & Flipping
    - [x] Drag & Drop Interaction
    - [x] Win/Loss Verification Logic
- [x] **Verification**
    - [x] Verify Gameplay Flow (Browser Test)
    - [x] Verify Resource Loading (Mock Data)

## 4. Content Production
- [x] **Initial Data Set**
    - [x] Generate 12 Idiom Metadata Files (`data.json`)
    - [x] Generate 12 Mock Images (`image.png`)
    - [x] Pack Resources into `manifest.json`
- [ ] **Content Expansion**
    - [ ] Refine Prompt Engineering for Images
    - [ ] Generate High-Quality Images
    - [ ] Expand Idiom Database (Goal: 50+ idioms)

## 5. UI/UX Polish
- [x] **Visual Enhancement**
    - [x] Add Animations (Hover, Flip, Transition)
    - [x] Improve Card Design (Historical/Bronze Texture)
    - [x] Add Sound Effects
- [ ] **Responsiveness**
    - [ ] Verify Mobile Layout
    - [ ] Verify Tablet/Desktop Layout
