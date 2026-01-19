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

  // play A -> K to `emptyFoundation`; return an array of undo actions
  // NOTE: need to verify `hasAllRanks` before calling this method
  async playToFoundation(emptyFoundation) {
    const undoActions = [];

    for (let j = 0; j < 13; j += 1) {
      const source = this.lastCard;
      const target = emptyFoundation.lastCard;
      const oldParent = source.parent;
      source.setParent(target);
      source.animateTo(target.x, target.y, 50);
      source.zIndex = target.zIndex + 1;

      await waitAsync(50);

      undoActions.push({
        card: source,
        parent: target,
        oldParent
      });
    }

    // if king was on a face-down card, turn it face up
    if (this.lastCard.type === 'card' && !this.lastCard.faceUp) {
      this.lastCard.flip();

      undoActions.push({
        card: this.lastCard,
        flip: true
      });
    }

    return undoActions;
  }
}
