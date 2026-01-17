# TODO

- [x] When undo'ing stacks of cards, the first card's vertical offset is wrong (too small)
- [ ] Add high score? (How does that work with different difficulties?)
- [ ] Add fireworks
- [ ] Add <dialog> for "no open cascades" message when dealing from talon
- [ ] Stack height calculation seems wrong -- dropping at the end of a large stack doesn't trigger collision detection
- [x] Add scoring (Windows style -- 500 points to start, each move deducts 1 point, 100 points for play to foundation)
  * fix score undo
- [x] Add "moves" counter/display
- [x] Make new "win" screen
- [x] when undoing a move back on to a card that is turned face down as part of the undo, the card vertical offset is incorrect (see game.js:546)
- [x] Check for win condition -- all foundations have cards
- [x] ensure king is displayed as last card on foundation
- [x] ensure foundations overlap correctly
- [x] 54th dealt card can't be picked up -- it still has a child referenced in the talon
- [x] When a cascade contains a full 13 sequence of cards, move them to a foundation
- [x] When a face-up card returns to a face-down stack, its offset is incorrectly increased
  * same with deal; deal offset uses card offset instead of "grabbed" offset
  * card on face up card needs "grabbed" offset
- [x] Create a tableau with 10 cascades
- [x] Two decks' worth of cards, 104 total -- start with 1 suit (spades)
- [x] Initial deal is 54 cards, clicking the talon deals 10 cards, one to each cascade
  * 6 cards in the first 4 stacks, 5 cards in the remaining 6
