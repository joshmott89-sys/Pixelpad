# PixelPad README Update
## Objectives & Vision
 * The primary goal is to provide a user-friendly application that enables inexperienced coders to rely entirely on AI for 100% of their coding directly on a mobile phone.
 * The platform is designed as a "vibe-coding" development studio to build, quickly test, run, and iterate apps using fast AI feedback loops.
 * The vision prioritizes frictionless text insertion, visual organization on small smartphone screens, and rapid deployment capabilities.
## Architecture Principles
 * **Single-File Isolation:** The application is a fully functional Progressive Web App (PWA) restricted entirely to a single index.html file.
 * **Zero-Server Client Logic:** All processing loops, payload captures, and extraction parsing occur 100% locally within the browser and Service Worker context, without external backend routing servers.
 * **Core Stack:** Built with raw client-side vanilla JavaScript for state management, Ace Editor for code formatting, Pyodide for local Python execution, and the GitHub REST API for synchronization.
## Core Features
 * **The Unified Capture Engine:** Implements the Web Share Target API natively to receive shared code or files directly from the mobile OS share sheet, bypassing traditional clipboard truncation limits.
 * **Smart Payload Routing:** Automatically parses incoming text to strip conversational AI filler, isolating structural code within markdown fences.
 * **GitHub Synchronization:** Integrates the GitHub REST API to push, pull, and create new public repositories directly from the application using a Personal Access Token (PAT).
 * **Network-First Caching:** Utilizes a dynamic Service Worker with a "Network-First, Fallback-to-Cache" strategy to ensure the app fetches fresh code from the repository while maintaining offline capabilities.
 * **Dynamic Username Extraction:** Automatically extracts case-sensitive GitHub usernames directly from the user's PAT to prevent 404 errors caused by manual typing typos.
## Development Roadmap & Future Improvements
| Feature | Description | Priority |
|---|---|---|
| **Code-Diff "Smart Patching" Drawer** | A UI drawer that automatically isolates, highlights, and patches incoming AI code snippets into the existing code via a single tap. | High |
| **Playable Web Preview Testing Links** | Integrates an API (like PageDrop) to generate temporary, 1-tap playable URLs of live prototypes for immediate sharing and user testing. | High |
| **Multilayer Toolbar Tabs** | Refactors the bottom panel layout into logical tabs (Home, AI-Patch, Git, Share) to protect mobile screen real estate. | Medium |
| **Accordion Code Folding** | Exposes native Ace Editor hooks to collapse hundreds of code lines into single rows with a tap. | Medium |
| **Cosmetic CSS Visual Tweaks** | Refreshes general aesthetics (colors, padding, modern fonts) simultaneously with the layout refactors. | Medium |
| **Smart Prompt Macros** | One-tap text block shortcuts (e.g., "[Make Responsive]") to preload prompt instructions and eliminate mobile thumb-typing fatigue. | Low |
| **AI Changes Summary** | A feature that compares the previous local code snapshot against new updates to automatically generate a one-sentence Git commit summary via AI. | Low |
| **"Sniper Edit" Block Selector** | Utilizes Ace Editor token bounds to send only the specifically highlighted function to the AI, saving API tokens and preventing unrelated bugs. | Visionary |
| **"Eject to PC" Folder Scaffold** | A client-side utility utilizing JSZip to bundle the single-file layout into an industry-standard production tree for professional PC handoffs. | Visionary |
| **Interactive Canvas "Touch Inspector"** | A click event listener in the sandbox iframe allowing users to tap visual elements to instantly tag their HTML structure for the next AI prompt. | Visionary |
| **Local Timeline "Snapshot Shimming"** | Pushes historical source strings into a local storage array table, acting as a lightweight "Ctrl+Z" version control system without heavy Git dependencies. | Visionary |
