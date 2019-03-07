# blōma

blōma is a generative design tool. It allows you to quickly create many variations of layouts based on your chosen background and foreground imagery and text content.

blōma is built as a web application that runs in your browser. This repository contains everything you need to run it.

## Running

To build and run blōma, first make sure you have the [Yarn](https://yarnpkg.com/lang/en/) package manager for Node.js installed.

Then clone this repository, and run the following command to install all the required dependencies:

```sh
yarn
```

Now you can run blōma locally:

```sh
yarn dev
```

This starts a [webpack dev server](https://webpack.js.org/configuration/dev-server/) in port 8080. You can go run bloma by opening [http://localhost:8080](http://localhost:8080) in a web browser.

To make a production build of blōma:

```sh
yarn build
```

This creates a collection of static assets to the `dist/` directory, which you can transfer to any web server to make your build of blōma available.

## Development

blōma is written in [TypeScript](https://www.typescriptlang.org/) and uses [React](https://reactjs.org/) for its user interface components.

### Organisation

You'll find all the TypeScript and SASS source code and source assets under the `src` directory. The most important pointers for finding things are:

- `src/app/app.tsx` - the application entry point. Where everything springs from.
- `src/app/index.ts` - the core types used across the application. Also serves as a useful reference of the lay of the land when getting started.
- `src/app/transforms` - the various transforms used for different stages of the generative design workflows. This is where most of the design related code can be found.
- `src/app/ui`- the user interface code. All organised as React components, with file pairs for a `.tsx` file for each component, with an accompanying `.scss` file for component styles.
- `src/app/ui/store.ts` - the application state store. Application state is held in a single atom, which is immutable by convention and updated using functional transformations. It is basically the [Redux architecture](https://redux.js.org/basics/data-flow), but doesn't actually use the Redux library.

### Main Concepts

Generative design in blōma is organised into _workflows_ that consist of several stepwise _transforms_. Your design work flows through the transforms wrapped inside `Item` objects, which consist of `ItemFrame`s, which accumulate into the items throughout the workflow. For example, when you upload a background image, an `ItemFrame` containing the image is added to the `Item` being processed in the workflow. You'll find the precise technical definitions of workflows, transforms, items, item frames, and all the rest in `src/app/index.ts`.

This version of blōma constains just one workflow - the one called "Demo" that you see when you run the app - but the architecture supports any number of them. You'll find the definition of this workflow in `src/app/workflows.ts`.

Each transform is also typically paired with a user interaction step. For example, as you upload a background image and blōma detects its salient objects, the user then selects and adjusts those objects to fit their needs. This interaction is organised into _panel content_, UI components that fill the main content panel of the application, and _palette content_, UI components that go into the "palette area", which is the assistant box that follows the user through the design process and moving around the screen from step to step. The interactive components of each transformation are included in `ContentArea.tsx` and `PaletteContent.tsx`, respectively.

Taking the included "Demo" workflow as an example, based on the order of transforms in `src/app/workflows.ts` and the transform definitions in `src/app/transforms/index.ts`, the order of workflow execution is as follows:

1. `Welcome` - displays the welcome splash screen.
   - Transform: N/A
   - Panel UI: `WelcomePanel`
   - Palette UI: `WelcomePalette`
2. `Formats` - user selection of size formats to design for.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `FormatsPanel`
   - Palette UI: N/A
3. `Background Source` - adding background images and colors, detecting and adjusting salient objects.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `BackgroundInputSelector`
4. `Foreground Source` - adding foreground images.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `ForegroundSelector`
5. `Add Text` - adding text content.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `TextSelector`
6. `Organise Hierarchy` - organising the visual hierarchy between background, foreground, and text.
   - Transform: N/A
   - Panel UI: `InputPanel`
   - Palette UI: `HierarchySelector`
7. `Select Style Bundle` - selecting (or skipping) a predefined brand bundle for styling.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `StyleBundleSelector`
8. `Select Text Styles` - adjusting the text style variations for the output design space.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `TextStyleSelector`
9. `Select Filter Styles`- adjusting the image filter style variations for the output design space.
   - Transform: Inline function in `src/transforms/index.ts`
   - Panel UI: `InputPanel`
   - Palette UI: `FilterStyleSelector`
10. `Style Image`- execution of image filters
    - Transform: `src/app/transforms/style_image.ts`
    - Panel UI: N/A
    - Palette UI: N/A
11. `Apply Elements` - execution of the layout engine taking all the elements and styles, producing the final layouts.
    - Transform: `src/app/transforms/apply_elements.ts`
    - Panel UI: `OutputPanel`
    - Palette UI: N/A

# License

See [LICENSE.md](LICENSE.md)
