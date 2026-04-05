# Control Tower

Operational dashboard for the main React frontend.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run sync`

## What it does

- Scans the main frontend folders under `../src`
- Builds a live project snapshot JSON used by the dashboard
- Shows domain coverage for pages, components, services, hooks, and contexts

## Source of truth

The generated file is `src/data/projectSnapshot.json`.
Run `npm run sync` whenever the main app structure changes.