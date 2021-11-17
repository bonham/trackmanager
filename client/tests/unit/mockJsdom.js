Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn()
})

HTMLCanvasElement.prototype.getContext = jest.fn()
