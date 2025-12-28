const Fireworks = {
  canvas: document.querySelector('canvas'),

  // TODO: create "particle" object
  particles: [],

  start(callback) {
    // set callback function to run when finished
    this.callback = callback || (() => {});

    // put canvas in front of DOM elements
    this.canvas.style.zIndex = 999;

    // need to permanently bind `this` in order to remove event listeners;
    // have to pass the exact same function reference to `removeEventListener`
    this.stop = this.stop.bind(this);

    // cancel animation on user interaction
    this.canvas.addEventListener('mouseup', this.stop);
    this.canvas.addEventListener('touchend', this.stop);

    // kick off animation loop
    this.interval = window.setInterval(() => this.update(), 16);
  },

  onResize(width, height) {
    // problem: changing canvas width will erase it, so we
    // need to copy previously-drawn data to resized canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(this.canvas, 0, 0);

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // multiply the "visible" width by devicePixelRatio to account for high DPI screens
    const scaledWidth = width * window.devicePixelRatio;
    const scaledHeight = height * window.devicePixelRatio;

    this.canvas.width = scaledWidth;
    this.canvas.height = scaledHeight;

    // could scale the image here by adding (scaledWidth, scaledHeight) as args
    // to `drawImage`, but it kinda looks janky
    this.canvas.getContext('2d').drawImage(tempCanvas, 0, 0);
  },

  get randomSign() {
    return Math.random() > 0.5 ? 1 : -1;
  },

  get randomVelocity() {
    // NOTE: this is duplicative with `Game.onResize`
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const aspectRatio = 1;

    // determines playable area, where cards will be drawn
    let tableauWidth;
    let tableauHeight;

    if (windowWidth / windowHeight > aspectRatio) {
      // wider than it is tall; use the window height to calculate tableau width
      tableauWidth = windowHeight * aspectRatio;
      tableauHeight = windowHeight;
    } else {
      // taller than it is wide; use window width to calculate tableau height
      tableauHeight = windowWidth / aspectRatio;
      tableauWidth = windowWidth;
    }

    let x = tableauWidth * 0.003;
    let y = tableauHeight * 0.005;

    // adding x/y so that the value is not too close to zero
    let v = {
      x: ((Math.random() * x) + x) * this.randomSign,
      y: ((Math.random() * y) + y) * -1
    };

    log(v);

    return v;
  },

  update() {
    const canvasWidth = parseInt(this.canvas.style.width, 10);
    const canvasHeight = parseInt(this.canvas.style.height, 10);
    const context = this.canvas.getContext('2d');

    const scale = window.devicePixelRatio;

    // TODO: draw "YOU WON" text here, enumerate over particles

    // context.drawImage(fallingCard.element.children[0],
    //   fallingCard.x * scale, fallingCard.y * scale,
    //   fallingCard.width * scale, fallingCard.height * scale);
  },

  stop() {
    // stop listening for interaction
    this.canvas.removeEventListener('mouseup', this.stop);
    this.canvas.removeEventListener('touchend', this.stop);

    // stop animation loop
    window.clearInterval(this.interval);

    // put canvas behind DOM elements
    this.canvas.style.zIndex = -1;

    // erase canvas
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    console.debug('running fireworks callback');
    this.callback();
  }
};
