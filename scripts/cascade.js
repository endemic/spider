class Cascade extends Stack {
  type = 'cascade';

  constructor() {
    super();

    this.element = document.createElement('img');
    this.element.classList.add('cascade');
    this.element.src = 'images/other/cascade.png';
  }

  get size() {
    if (!this.hasCards) {
      return {
        width: this.width,
        height: this.height
      };
    }

    const width = this.width; // all cards are the same width
    let height = this.height;

    // first card completely overlaps the cascade,
    // so we don't use its height value
    let card = this.child;

    // Not actually using any data from child cards,
    // just enumerating over them to determine height
    for (let c of card.children()) {
      height += this.offset;
    }

    return { width, height };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
  }

  validPlay (card) {
    const lastCard = this.lastCard;

    // if no other cards in the cascade, any card is allowed
    if (!lastCard.parent) {
      return true;
    }

    // if there are cards already played, ensure they are
    // _the same suit_ and the card rank is one lower than
    // the last card (and the last card has to be face up, too)
    if (card.suit === lastCard.suit && card.diff(lastCard) === -1 && lastCard.faceUp) {
      return true;
    }

    // your situation is unfortunate!
    return false;
  }

  get hasAllRanks() {
    const ranks = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];

    let c = this.lastCard;
    let expectedRank = ranks.shift();

    if (c.rank !== expectedRank) {
      return false;
    }

    do {
      c = c.parent;
      expectedRank = ranks.shift();
    } while (c && c.faceUp && c.rank === expectedRank && ranks.length);

    return ranks.length === 0 && c.rank === expectedRank;
  }
}
