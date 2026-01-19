class Foundation extends Stack {
  type = 'foundation';

  constructor() {
    super();

    this.element = document.createElement('img');
    this.element.classList.add('foundation');
    this.element.src = 'images/other/foundation.png';
  }

  validPlay(card) {
    // no other cards in the foundation, so (any suit) ace is allowed
    if (!this.hasCards && card.rank === 'ace') {
      return true;
    }

    const lastCard = this.lastCard;
    // if there are cards already played, ensure they are the same suit
    // and the card rank is one higher than the lastCard
    if (card.suit === lastCard.suit && card.diff(lastCard) === 1) {
      return true;
    }

    return false;
  }

  get size() {
    return {
      width: this.width,
      height: this.height
    };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    // if a visible component in the DOM exists, move it
    if (this.element) {
      this.element.style.transition = 'translate 0ms linear';
      this.element.style.translate = `${this.x}px ${this.y}px 0px`;
    }

    // move child cards (all on top of each other)
    for (let card of this.children()) {
      card.moveTo(this.x, this.y);
    }
  }
}
