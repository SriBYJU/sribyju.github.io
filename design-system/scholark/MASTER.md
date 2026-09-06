# Scholark — V5 Cinematic Design System

Status: active design source of truth for the `scholark-v5-cinematic` branch.

## Design intent
Create a high-end, motion-led Scholark experience that feels like an interactive editorial campus world rather than a static marketing image. The uploaded motion reference is the choreography benchmark: oversized focal object, pinned camera-like sequence, scroll-scrub depth, parallax, section handoffs, and live UI entering as part of the story.

## Design dials
- Variance: **7 / 10** — editorial asymmetry without sacrificing usability.
- Motion: **10 / 10** — complex scrollytelling reserved for the hero; natural scrolling elsewhere.
- Density: **4 / 10** — spacious marketing surfaces, compact only inside functional tool UI.

## Landing pattern
**Hero-Centric Scrollytelling → Social Proof → Connected Journey → Decision Scene → Live Tool Grid → Closing CTA**

1. Cinematic Scholark mark / camera journey
2. Proof strip with real platform scope
3. Connected student-journey narrative
4. College decision / intelligence scene
5. Live tool universe
6. Brand close + CTA

## Brand primitives
- Cream 0: `#FFFDF8`
- Cream 1: `#FAF9F6`
- Paper: `#F3F1EC`
- Ink: `#1A1714`
- Muted ink: `#4A453E`
- Burnt orange: `#C8622A`
- Deep burnt orange: `#963C19`
- Warm highlight: `#E8A87C`
- Gold spark: `#EEB468`

Do not replace this palette with purple/blue AI gradients, neon, or generic dark-SaaS styling.

## Typography
- Display: **Playfair Display** — editorial / academic / ambitious
- Body and controls: **Outfit** — modern and legible
- Data / indices: **JetBrains Mono** — sparse, functional use only

## Motion system
### Hero — complex pinned scrollytelling
- Exactly one major pinned sequence.
- Scroll progress controls composition rather than time-based autoplay.
- Scholark mark behaves as a layered object: orange plate, paper-S, star/spark.
- Camera dives toward / through the mark by transform-based scaling.
- Clouds, campus line art, and floating UI use separate depth values.
- Intro copy exits before the camera dive becomes dominant.
- A clear scroll cue makes the interaction discoverable.

### Decorative parallax
- 3–4 meaningful visual depth bands maximum.
- Decorative layers only; never body copy, forms, or essential controls.
- Background moves least, foreground moves most.
- Use `transform` and `opacity` rather than layout-affecting properties.

### Reveals
- Short staggered reveals only.
- Stagger groups remain small enough that the last item never feels delayed.
- Headline choreography is reserved for short display copy.

### Hover / pointer
- 3D tilt and spotlight effects only on high-value interactive cards.
- Pull / tilt remains clamped inside the hit target.
- Coarse pointers receive the static final state.

### Reduced motion
`prefers-reduced-motion` must preserve all content, hierarchy and actions while removing camera dives, drifting clouds, parallax, stagger choreography and continuous decorative motion.

## Illustration / atmosphere
- Procedural clouds rather than flat background photography.
- Line-art or vector campus architecture rather than stock campus imagery.
- Paper surfaces, soft warm light, restrained translucency.
- The site may feel cinematic, but still must read immediately as a useful student product.

## Components
### Primary button
- Minimum height: 48px
- Burnt-orange fill, white text
- Clear keyboard focus
- Hover uses small translate + shadow only

### Secondary button
- Warm translucent paper surface
- Ink text
- Border remains visible against cream

### Tool cards
- Live navigation targets, never fake screenshots
- SVG iconography, no emoji icons
- Default, hover, focus and coarse-pointer states
- Cards may vary in size for editorial hierarchy but must collapse cleanly on mobile

### Stats strip
- Glass/paper treatment is acceptable only when text contrast remains strong
- Metrics must have text labels; never communicate meaning by color alone

## Responsive rules
Test at **375, 768, 1024 and 1440 px**.
- No horizontal scrolling.
- Hero copy centers on narrow screens.
- Campus / floating decorative layers simplify or disappear before they create clutter.
- Tool grid collapses from 12-column editorial layout to 2 columns, then 1.
- All touch targets remain at least 44×44 px.

## Accessibility requirements
- Contrast target 4.5:1 for ordinary text.
- Visible `:focus-visible` states.
- Native buttons for actions.
- Decorative SVG / clouds are hidden from assistive technology.
- No hover-only information.
- Forced-colors fallback retains borders and focus.
- Reduced-motion fallback is complete rather than partial.

## Performance rules
- Prefer compositor-friendly transforms / opacity.
- Use one `requestAnimationFrame` scroll update path.
- Passive scroll listeners.
- Avoid one scroll listener per decorative layer.
- No layout thrashing inside the scroll loop.
- Use `will-change` only on genuinely animated focal elements.
- Mobile removes the heaviest decorative layers.

## Anti-patterns to avoid
- Multiple pinned sections fighting native scroll.
- Stock-photo hero used as the actual background experience.
- Excessive glassmorphism.
- Emojis as UI icons.
- Body-copy parallax.
- Width / height / margin animation during scroll.
- Generic AI gradients.
- Dense dashboard styling on the marketing homepage.
- Motion that delays navigation or hides usable content.

## Identity guardrail
Every major scene should still feel like Scholark if the motion is disabled. Cream + burnt orange, the existing Scholark mark, editorial serif display type, and student-centered practical copy are non-negotiable recognition cues.
