# Tharun Infinity Runner — Final Testing Checklist

Use this before shipping. Target: stable **60 FPS**, no blocking bugs.

## Desktop
- [ ] Menu loads with **THARUN RUNNER** branding
- [ ] Start / High Scores / Unlocks / Settings all clickable
- [ ] Space / ArrowUp / click jump works
- [ ] Double jump works mid-air
- [ ] P / Esc pause → Resume / Settings / Menu
- [ ] Mute + volume persist after refresh
- [ ] FPS toggle (F or Settings) works
- [ ] Collect coins/gems/power-ups; HUD updates
- [ ] Shield absorbs one obstacle hit
- [ ] Extra life revives on fall/hit
- [ ] Game Over → Restart / High Scores / Menu
- [ ] Best score + banked coins persist after reload

## Mobile / touch
- [ ] Landscape playable; portrait shows rotate prompt
- [ ] On-screen JUMP + Pause respond
- [ ] No page scroll/zoom while playing
- [ ] Audio bar reachable (safe areas)
- [ ] Menus usable with finger taps

## Edge cases
- [ ] Die in a pit with 0 lives → Game Over
- [ ] Die with shield vs without shield
- [ ] Pause during power-up timers → resume continues cleanly
- [ ] Rapid restart does not soft-lock physics/audio
- [ ] Unlock skins unlock and equip correctly
- [ ] Equipped skin tint visible in-run

## Performance
- [ ] FPS near 60 on mid hardware
- [ ] Quality tier may drop under load without freezing
- [ ] Long run (3+ min) without memory blow-up / hitch storms

## Audio
- [ ] Jump / collect / hit / game over / UI cues play
- [ ] BGM starts on run, stops on Game Over / Menu
- [ ] Mute silences SFX + BGM

## Collisions
- [ ] Ground collision solid
- [ ] Spikes / rocks / moving hazards kill or interact correctly
- [ ] Pits cause fall death
- [ ] Collectibles do not kill

When all boxes pass, Milestone 20 is complete.
