# Aurora
![Aurora Tour](https://github.com/user-attachments/assets/d6a330e7-a65b-4d03-8a9c-3169a210a103)

## A simple tool with a modern UI for quickly cropping your images.

### Features:
- A modern, user-friendly, and responsive design built with [React](https://react.dev/) and [shadcn](https://ui.shadcn.com/)
- A selection of common aspect ratios (square, widescreen, etc.) for quick and easy cropping for different purposes.
- Images are processed directly in the browser, not uploaded to some cloud server for "processing"
- Textboxes to define crop dimensions and position using pixel values for fine-grained adjustments
- A Preview & Download tab to preview what your cropped image will look like before downloading
- Zoom in/out with the scroll wheel (or pinch zooming on mobile)

### Building

Clone the repository, and then run inside the folder
```console
npm i
```

To install all dependencies.

Then, run
```console
npm run dev
```

to start a development server

or 

```console
npm run dev-network
```

to start a development server on your local network (convenient meaning for testing UI layout on a phone)

### Contributing
Pull requests are welcome, but I request that you format your code using the [Prettier](https://prettier.io/docs/) formatter, as that is the code style I prefer.
