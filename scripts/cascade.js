class Cascade extends Stack {
  type = 'cascade';

  constructor() {
    super();

    this.element = document.createElement('img');
    this.element.classList.add('cascade');
    this.element.src = 'images/other/cascade.png';
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
