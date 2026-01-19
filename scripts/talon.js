class Talon extends Stack {
  type = 'talon';

  get size() {
    return {
      width: this.width,
      height: this.height
    };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    for (let card of this.children()) {
      card.moveTo(this.x, this.y);
    }
  }

  // debug method to check order of cards
  get printCards() {
    for (let card of this.children()) {
      console.debug(`${card}`);
    }
  }
}
