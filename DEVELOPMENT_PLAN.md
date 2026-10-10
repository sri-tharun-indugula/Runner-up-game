# Tharun Infinity Runner — Development Plan

## Goal

Build a polished, scalable infinite runner game with clean architecture, reusable components, and maintainable code. Complete one milestone at a time. Do not move to the next milestone until the current one is fully functional, tested, and documented.

---

## Progress Tracker

| Milestone | Name | Status |
|-----------|------|--------|
| 1 | Project Setup | Done |
| 2 | Camera & World | Done |
| 3 | Player | Done |
| 4 | Physics | Done |
| 5 | Procedural Ground | Done |
| 6 | Obstacles | Done |
| 7 | Collision System | Done |
| 8 | Coins & Collectibles | Done |
| 9 | Score System | Done |
| 10 | Difficulty Scaling | Done |
| 11 | Audio | Done |
| 12 | UI | Done |
| 13 | Power Ups | Done |
| 14 | Particle Effects | Done |
| 15 | Animations | Done |
| 16 | Mobile Support | Done |
| 17 | Performance Optimization | Done |
| 18 | Save System | Done |
| 19 | Polish | Done |
| 20 | Final Testing | Done |

---

# Tech Stack

* TypeScript
* Phaser 3
* Vite
* HTML5 Canvas
* ESLint
* Prettier

Use object-oriented principles and modular architecture.

Folder structure:

```
src/
    core/
    scenes/
    entities/
    managers/
    ui/
    assets/
    utils/
    config/
```

---

# Development Rules

Before writing code:

* Explain the approach.
* List files that will be created or modified.
* Keep files under ~300 lines where practical.
* Use reusable components.
* Avoid duplicate logic.
* Use TypeScript types everywhere.
* Add comments only where they improve clarity.
* Ensure no TypeScript errors remain.
* Test each feature before continuing.

Never implement future milestones early.

---

# Milestone 1 — Project Setup

Tasks

* Create Phaser + Vite project.
* Configure TypeScript.
* Configure ESLint.
* Configure Prettier.
* Create folder structure.
* Configure asset loading.
* Create Boot Scene.
* Create Preload Scene.
* Create Main Menu Scene.
* Create Game Scene.

Deliverable

Running blank game with scene switching.

---

# Milestone 2 — Camera & World

Tasks

* Configure world size.
* Configure camera.
* Add scrolling background.
* Implement parallax layers.
* Implement endless background looping.

Deliverable

Infinite scrolling world.

---

# Milestone 3 — Player

Tasks

Create player class with

* idle animation
* running animation
* jumping
* double jump
* falling
* landing
* gravity
* collision box

Controls

* Space
* Up Arrow
* Touch
* Mouse click

Deliverable

Smooth responsive player movement.

---

# Milestone 4 — Physics

Tasks

* Configure Arcade Physics.
* Ground collision.
* Air movement.
* Jump physics.
* Landing detection.
* Death detection.

Deliverable

Natural platformer movement.

---

# Milestone 5 — Procedural Ground

Tasks

Generate endless ground.

Ground should

* recycle
* never disappear
* maintain seamless scrolling
* support multiple tile variations

Deliverable

Infinite floor.

---

# Milestone 6 — Obstacles

Create

* spikes
* rocks
* moving obstacles
* pits

Requirements

* object pooling
* randomized spawning
* configurable spawn intervals
* difficulty scaling

Deliverable

Endless obstacle generation.

---

# Milestone 7 — Collision System

Tasks

Player collides with

* ground
* obstacles
* collectibles

Game Over

* animation
* freeze gameplay
* restart option

Deliverable

Reliable collision system.

---

# Milestone 8 — Coins & Collectibles

Implement

* coins
* gems
* magnets
* score pickups

Requirements

* object pooling
* animations
* sound effects

Deliverable

Collectible system.

---

# Milestone 9 — Score System

Track

* distance
* coins
* total score
* best score

Persist using local storage.

Deliverable

Working score system.

---

# Milestone 10 — Difficulty Scaling

Increase over time

* game speed
* obstacle frequency
* obstacle complexity

Difficulty should scale smoothly.

Deliverable

Progressive challenge.

---

# Milestone 11 — Audio

Implement

* background music
* jump
* collect
* hit
* game over
* UI sounds

Include

* mute
* volume control

Deliverable

Complete audio system.

---

# Milestone 12 — UI

Screens

* Main Menu
* Pause
* Settings
* Game Over
* High Score

HUD

* score
* distance
* coins

Responsive layout.

Deliverable

Complete user interface.

---

# Milestone 13 — Power Ups

Implement

* shield
* magnet
* speed boost
* slow motion
* extra life

Each should

* have duration
* timer
* cooldown
* visual effects

Deliverable

Power-up system.

---

# Milestone 14 — Particle Effects

Add

* dust
* landing
* jump
* explosions
* collection sparkles

Optimize performance.

Deliverable

Polished visuals.

---

# Milestone 15 — Animations

Implement

* player animations
* obstacle animations
* UI transitions
* tween effects

Deliverable

Smooth gameplay experience.

---

# Milestone 16 — Mobile Support

Support

* touch controls
* responsive scaling
* landscape mode
* performance optimization

Deliverable

Fully playable on mobile.

---

# Milestone 17 — Performance Optimization

Implement

* object pooling
* texture atlases
* sprite batching
* memory cleanup
* FPS monitoring

Target

60 FPS.

---

# Milestone 18 — Save System

Save

* high score
* coins
* settings
* unlocked content

Use local storage.

Deliverable

Persistent game data.

---

# Milestone 19 — Polish

Improve

* animations
* transitions
* balancing
* responsiveness
* audio mixing
* visual effects

Fix all bugs.

---

# Milestone 20 — Final Testing

Test

* desktop
* mobile
* keyboard
* touch
* memory usage
* FPS
* collisions
* edge cases

Remove all bugs.

---

# Coding Standards

* SOLID principles
* DRY
* Single Responsibility
* Modular architecture
* Reusable systems
* Config-driven gameplay
* Strong typing
* No magic numbers
* Centralized constants

---

# Cursor Instructions

For each milestone:

1. Explain the design.
2. Generate only the code required for that milestone.
3. Wait for confirmation before moving to the next milestone.
4. Refactor if necessary.
5. Ensure the project compiles without errors.
6. Provide testing instructions.
7. Never skip milestones.
8. Never generate multiple milestones in one response.

The goal is a polished, production-ready infinite runner game with maintainable, scalable code and professional engineering practices.
