# Project Notes: archeDIsks

## Overview
This document contains notes and observations about the `archeDIsks` project. It will be updated as changes, fixes, or additions are made.

## Project Structure
The project appears to be a TypeScript-based web application using the following technologies:
- **Vite**: For development and build tooling.
- **Tailwind CSS**: For styling.
- **Playwright**: For end-to-end testing.
- **Vitest**: For unit testing.
- **React**: For building the user interface.

### Key Directories and Files
- **`src/`**: Contains the main application code.
  - **`components/`**: Reusable UI components.
    - **`disc/`**: Components related to disc functionality.
    - **`layout/`**: Layout components like `AppBar` and `Sidebar`.
    - **`ui/`**: General UI components like `Button`, `Drawer`, `Input`, etc.
  - **`views/`**: Contains different views of the application, such as `CalendarView`, `ListView`, etc.
  - **`lib/`**: Utility functions for date handling, data export, polar calculations, etc.
  - **`repositories/`**: Handles data storage and retrieval, e.g., `local-storage.ts`.
  - **`stores/`**: State management using stores, e.g., `disc-store.ts` and `ui-store.ts`.
  - **`types/`**: TypeScript type definitions.
- **`tests/`**: Contains end-to-end tests written with Playwright.
- **`public/`**: Static assets.

### Configuration Files
- **`eslint.config.js`**: ESLint configuration for linting.
- **`tailwind.config.js`**: Tailwind CSS configuration.
- **`vite.config.ts`**: Vite configuration.
- **`tsconfig.json`**: TypeScript configuration.
- **`playwright.config.ts`**: Playwright configuration.
- **`vitest.config.ts`**: Vitest configuration.

## Observations
- The project is modular, with a clear separation of concerns.
- It uses modern web development tools and practices.
- Testing is well-integrated with both unit tests (Vitest) and end-to-end tests (Playwright).
- Tailwind CSS is used for styling, suggesting a utility-first approach to design.

## Notes on Specific Files
- **`src/components/disc/`**: Contains components like `ActivityDrawer`, `CircularDisc`, etc., which seem to be related to visualizing or interacting with discs.
- **`src/lib/`**: Includes utility functions for various purposes, such as `date-utils.ts` for date handling and `polar-utils.ts` for polar coordinate calculations.
- **`src/stores/`**: Manages application state, likely using a library like Zustand or MobX.
- **`tests/e2e/`**: Contains Playwright tests for end-to-end testing.

## To-Do
- Update this document whenever changes, fixes, or additions are made to the project.

- Updated the `handleFormSubmit` function to navigate to the newly created disc after saving it, ensuring the user sees the disc immediately after creation.
- Updated the outer circle in `CircularDisc.tsx` to display all months of the year.
- Aligned the circle sections properly using `dateToAngle` and `polarToCartesian` calculations.
- Adjusted the `viewBox` and center coordinates in the SVG to ensure the entire circle fits the screen, including January and July.
- Updated ring label rendering in `CircularDisc.tsx` to truncate long names with ellipsis and prevent overflow.
- Adjusted ring label positioning in `CircularDisc.tsx` to ensure labels appear at the top of the circle.
- Applied truncation styling to prevent overflow for long ring names.