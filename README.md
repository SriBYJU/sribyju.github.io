

## Animation dependency

Run `npm ci` at the repository root to install the pinned Framer Motion dependency.
The current frontend uses plain JavaScript. For future bundled browser code, use
`import { animate, inView, scroll } from "framer-motion/dom"` rather than the React entry point.
Bare npm imports need a browser bundling step; installing this dependency alone does not
load it into the static site or add animations. Preserve reduced-motion support and clean
up animations and observers when removing views.
