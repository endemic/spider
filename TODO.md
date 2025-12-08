# TODO

- [x] 54th dealt card can't be picked up -- it still has a child referenced in the talon
- [ ] When a cascade contains a full 13 sequence of cards, move them to a foundation
- [x] When a face-up card returns to a face-down stack, its offset is incorrectly increased
  * same with deal; deal offset uses card offset instead of "grabbed" offset
  * card on face up card needs "grabbed" offset
- [x] Create a tableau with 10 cascades
- [x] Two decks' worth of cards, 104 total -- start with 1 suit (spades)
- [x] Initial deal is 54 cards, clicking the talon deals 10 cards, one to each cascade
  * 6 cards in the first 4 stacks, 5 cards in the remaining 6
