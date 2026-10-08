# React + Vite

## Reservation domain backend contract

The current React implementation demonstrates reservation, availability, cancellation, and physical-room assignment rules inside one browser session. It cannot guarantee cross-user last-room protection.

The future Spring Boot/PostgreSQL create-reservation endpoint must validate inputs and rate/offer eligibility, lock the relevant inventory scope (for example with a transaction and `SELECT ... FOR UPDATE`, or an equivalent serializable strategy), recalculate committed availability, and insert or reject atomically. Physical-room assignments must likewise prevent overlapping active stay ranges at the database level. Frontend-provided availability must never be trusted as final.

## Website content and media backend boundary

Hotel media, Home Showcase configuration, and Experiences/Stories are development-session state only. Object URLs created by image pickers are temporary previews—not uploaded files—and are not persisted in local or session storage.

A future Spring Boot API should upload validated media to durable object storage, return stable media IDs/URLs, and save only those references in PostgreSQL. The server must revalidate Hotel eligibility, Hero and featured references, Experience publishing requirements, permissions, and slug uniqueness. Deleted media references should continue resolving to the Hotel Main Photo or the safe application fallback.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
