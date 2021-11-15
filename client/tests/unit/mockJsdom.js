Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: () => {}
})

HTMLCanvasElement.prototype.getContext = () => {}
