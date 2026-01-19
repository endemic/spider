const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const DEBUG = true;

// array to hold inverse move data
const undoStack = [];

// boolean which can be checked to short-circuit player interaction, etc.
let gameOver = true;

// allow deal without confirmation on app load
let firstGame = true;

let score = 0;
let moves = 0;

// store a pointer to cards that are inverted, so as to revert them
// after mouseup/touchend
let invertedCard = null;

const cascades = [];
for (let i = 0; i < 10; i += 1) {
  const cascade = new Cascade();
  cascades.push(cascade);

  document.body.append(cascade.element);
}

const foundations = [];
for (let i = 0; i < 8; i += 1) {
  const foundation = new Foundation();
  foundations.push(foundation);
  foundation.zIndex = i;
}

const talons = [];
for (let i = 0; i < 5; i += 1) {
  const talon = new Talon();
  talons.push(talon);
  document.body.append(talon.element);
}

const grabbed = new Grabbed();

// array to hold refs to each card obj
const cards = [];

// immediately initialize card objects
while (cards.length < 104) { // 52 x 2 cards (two decks)
  const card = new Card('spades', 'ace');
  document.body.append(card.element);
  cards.push(card);
}

const setDifficulty = () => {
  const suitMap = {
    hard: ['hearts', 'spades', 'diamonds', 'clubs'],
    medium: ['hearts', 'spades'],
    easy: ['spades']
  };

  const difficulty = localStorage.getItem('spider:difficulty') || 'easy';

  let i = 0;
  while (i < cards.length) {
    for (let suit of suitMap[difficulty]) {
      RANKS.forEach(rank => {
        cards[i].reset(suit, rank);
        i += 1;
      });
    }
  }
};

const checkWin = () => {
  // ensure that each foundation has 13 cards; we don't check for matching suit
  // or ascending rank because those checks are done when the card is played
  return foundations.every(f => {
    let count = 0;

    for (let _card of f.children()) {
      count += 1;
    }

    return count === 13;
  });
};

const updateStatusLabels = () => {
  document.querySelector('#moves').textContent = `Moves: ${moves}`;
  document.querySelector('#score').textContent = `Score: ${score}`;
};

const reset = () => {
  cards.forEach(c => {
    c.parent = null;
    c.child = null;
    c.flip('down');
    c.invert(false);
  });

  cascades.forEach(c => c.child = null);
  foundations.forEach(f => f.child = null);
  talons.forEach(t => t.child = null);

  moves = 0;
  score = 500;
  updateStatusLabels();

  undoStack.length = 0; // hack to empty an array

  setDifficulty();
};

const stackCards = async () => {
  // shuffle deck
  let currentIndex = cards.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [cards[currentIndex], cards[randomIndex]] = [cards[randomIndex], cards[currentIndex]];
  }

  // move all cards to the talon
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    card.moveTo(talons[0].x, talons[0].y);
    card.setParent(talons[0].lastCard);
    card.zIndex = index;
  }

  await waitAsync(200);

  console.debug('done moving cards to talon')
};

const deal = async () => {
  let offset = 0;
  const firstTalon = talons[0];

  // initial deal is 54 cards
  for (let index = 0; index < 54; index += 1) {
    // const card = cards[index];
    const card = firstTalon.lastCard;

    const cascade = cascades[index % cascades.length];
    const lastCard = cascade.lastCard;

    card.setParent(lastCard);
    card.animateTo(lastCard.x, lastCard.y + offset, 500);

    // only the last 10 cards are face up
    if (index > 43) {
      card.flip();
    }

    // await waitAsync(50);

    // update z-index of the card _after_ the synchronous delay;
    // this gives the animation time to move the card away from the deck
    card.resetZIndex()

    // offset cards vertically after the first row
    offset = index < 9 ? 0 : card.faceDownOffset;
  };

  // populate talons[1-4] from cards in [0]
  for (let index = 1; index < talons.length; index += 1) {
    const t = talons[index];

    for (let j = 0; j < 10; j += 1) {
      const card = firstTalon.lastCard;
      const parent = t.lastCard;
      card.setParent(parent);
      card.moveTo(parent.x, parent.y);
    }

    t.resetZIndex();
  }

  firstTalon.resetZIndex();

  // increment games played counter
  const key = 'spider:playedGames';
  let playedGames = parseInt(localStorage.getItem(key), 10) || 0;
  localStorage.setItem(key, playedGames + 1);

  gameOver = false;
};

// card event handler
cards.forEach(card => {
  const onDown = async e => {
    e.preventDefault();

    if (gameOver) {
      return;
    }

    const point = getPoint(e);

    // don't allow interaction with foundations
    if (card.stackType === 'foundation') {
      return;
    }

    if (card.stackType === 'talon') {
      for (let i = 0; i < cascades.length; i += 1) {
        if (!cascades[i].hasCards) {
          dialog.show('You are not allowed to deal while there are empty cascades.');
          return;
        }
      }

      // find talon that still has cards
      const talon = talons.find(t => t.hasCards);

      if (!talon) {
        return;
      }

      const undoGroup = [];

      // deal 10 cards to all the cascades
      for (const cascade of cascades) {
        const c = talon.lastCard;
        const oldParent = c.parent;
        const newParent = cascade.lastCard;
        c.setParent(newParent);
        c.animateTo(newParent.x, newParent.y + card.faceUpOffset, 500);
        c.zIndex = 999; // ensure animated card is on top of all others
        wait(500).then(() => c.resetZIndex());
        c.flip();
        await waitAsync(50);

        undoGroup.push({
          card: c,
          parent: newParent,
          oldParent,
          flip: true
        });
      }

      undoStack.push(undoGroup);

      // TODO: Check cascades for cards in sequence here

      return;
    }

    // only allow sequences of cards to be picked up
    if (!card.childrenInSequence) {
      console.debug(`can't pick up ${card}, not a sequence!`);

      // highlight cards that can be picked up
      invertedCard = card.invertMovableCards();

      return;
    }

    grabbed.grab(card);
    grabbed.setOffset(point);

    console.debug(`onDown on ${card}, offset: ${point.x}, ${point.y}`);
  };

  card.element.addEventListener('mousedown', onDown);
  card.element.addEventListener('touchstart', onDown);
});

const onMove = e => {
  if (!grabbed.hasCards) {
    return;
  }

  const point = getPoint(e);

  grabbed.moveTo(point);
};

const onUp = async () => {
  // turn off the highlight affordance for movable cards
  if (invertedCard) {
    invertedCard.resetInvert();
    invertedCard = null;
  }

  if (!grabbed.hasCards) {
    return;
  }

  const card = grabbed.child;

  // check if card can be dropped on any cascades
  for (let i = 0; i < cascades.length; i += 1) {
    const cascade = cascades[i];

    if (grabbed.overlaps(cascade) && cascade.validPlay(card)) {
      const undoGroup = [];
      // flip over the newly uncovered card
      if (card.parent.type === 'card' && !card.parent.faceUp) {
        card.parent.flip();

        undoGroup.push({
          card: card.parent,
          flip: true
        });
      }

      // set new parent
      let parent = cascade.lastCard;

      // push on to the front in case a flip was already added
      // tl;dr if the flip fires first, this card moves back to an
      // incorrect offset
      undoGroup.unshift({
        card,
        parent,
        oldParent: card.parent,
        points: -1
      });

      grabbed.drop(parent);

      moves += 1;
      score -= 1;
      updateStatusLabels();

      console.debug(`dropping ${card} on cascade #${i}`);

      // play A->K on next open foundation
      // TODO: make this check when dealing from talon
      if (cascade.hasAllRanks) {
        const emptyFoundation = foundations.find(f => !f.hasCards);
        const foundationUndo = await cascade.playToFoundation(emptyFoundation);

        undoGroup.splice(undoGroup.length, 0, ...foundationUndo);

        score += 100;
        updateStatusLabels();

        if (checkWin()) {
          gameOver = true;

          // increment games won counter
          let key = 'spider:wonGames';
          let wonGames = parseInt(localStorage.getItem(key), 10) || 0;
          localStorage.setItem(key, wonGames + 1);

          // check for high score
          key = 'spider:highScore';
          let highScore = parseInt(localStorage.getItem(key), 10) || 0;
          if (score > highScore) {
            localStorage.setItem(key, score);
          }

          Fireworks.start(async () => {
            reset();
            await stackCards();
          });
        }
      }

      undoStack.push(undoGroup);

      // valid play, so return out of the loop checking other cells
      return;
    }
  }

  // if we got this far, that means no valid move was made,
  // so the card(s) can go back to their original position
  console.debug('invalid move; dropping card(s) on original position');

  grabbed.drop();
};

const onResize = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const aspectRatio = 1;

  // playable area, where cards will be drawn
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

  let windowMargin = (windowWidth - tableauWidth) / 2;

  // debug tableau size for layout testing
  // let tableauDebug = document.createElement('div');
  // tableauDebug.style.width = `${tableauWidth}px`;
  // tableauDebug.style.height = `${tableauHeight}px`;
  // tableauDebug.style.backgroundColor = 'rgba(255, 0, 255, 0.5)';
  // tableauDebug.style.position = 'absolute';
  // tableauDebug.style.top = `20px`;
  // tableauDebug.style.left = `${windowMargin}px`;
  // document.body.append(tableauDebug);

  const widthInPixels = 680;
  const heightInPixels = 680;

  // set card sizes/margins here
  const margin = (4 / widthInPixels) * tableauWidth; // arbitrary horiztonal margin between cards (6px)
  const width = (64 / widthInPixels) * tableauWidth; // card width (80px)
  const height = (92 / heightInPixels) * tableauHeight; // card height (115px)
  const faceUpOffset = height / 4; // ~18px; arbitrary vertical diff between stacked cards
  const faceDownOffset = height / 10; // ~9px

  // enumerate over all cards/stacks in order to set their width/height
  for (const cascade of cascades) {
    cascade.size = { width, height };
    cascade.faceUpOffset = faceUpOffset;
    cascade.faceDownOffset = faceDownOffset;
  }

  for (const foundation of foundations) {
    foundation.size = { width, height };
  }

  for (const card of cards) {
    card.size = { width, height };
    card.faceUpOffset = faceUpOffset;
    card.faceDownOffset = faceDownOffset;
  }

  for (const talon of talons) {
    talon.size = { width, height };
  }

  grabbed.size = { width, height };

  // Layout code
  const menu = document.querySelector('#menu');
  const status = document.querySelector('#status');

  // add internal padding to menu/status bars
  menu.style.padding = `0 0 0 ${windowMargin}px`;
  status.style.padding = `0 ${windowMargin + margin}px`;

  const top = margin + menu.offsetHeight;
  const left = windowMargin + margin / 2;
  // const bottom = heightInPixels - status.offsetHeight;

  cascades.forEach((c, i) => {
    // put at top of window
    c.moveTo(left + (width + margin) * i, top + margin)
  });

  // foundations on the bottom
  foundations.forEach((f, i) => {
    f.moveTo(left + (width / 3 + margin) * i, windowHeight - height - margin - status.offsetHeight);
  });

  // Handle resizing <canvas> for fireworks
  Fireworks.onResize(windowWidth, windowHeight);

  talons.forEach((t, i) => {
    t.moveTo(
      windowWidth - windowMargin - margin - (width * 2) + (width / 4) * i,
      windowHeight - height - margin - status.offsetHeight
    );
    t.zIndex = talons.length - i;
    t.resetZIndex();
  })
};

const onKeyDown = e => {
  // return unless the keypress is meta/contrl + z (for undo)
  if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') {
    return;
  }

  onUndo(e);
};

const onDeal = async e => {
  e.preventDefault();

  if (firstGame) {
    reset();
    await stackCards();
    deal();

    firstGame = false;
  } else {
    dialog.show('Deal again?', async () => {
      reset();
      await stackCards();
      deal();
    });
  }
};

const undo = async (step) => {
  // get card state _before_ the most recent move
  const { card, parent, oldParent, flip, points } = step;

  if (flip) {
    card.flip();
  }

  if (points) {
    // invert the point value
    score += -points;
  }

  // some undo moves are only card flips
  if (!parent) {
    return;
  }

  card.setParent(oldParent);

  let offset = oldParent.faceUp ? card.faceUpOffset : card.faceDownOffset;

  // Don't add vertical offset if dropping on an empty cascade or talon
  // the card should completely overlap these "parent" types
  if (oldParent.type === 'cascade' || oldParent.stackType === 'talon') {
    offset = 0;
  }

  card.animateTo(oldParent.x, oldParent.y + offset); // 300ms default duration

  offset = card.faceUpOffset;

  for (let c of card.children()) {
    c.animateTo(card.x, card.y + offset);

    await waitAsync(50);

    // AFAIK we're only grabbing face up cards
    offset += c.faceUpOffset;
  }

  card.resetZIndex();

  moves -= 1;

  updateStatusLabels();
};

const onUndo = e => {
  e.preventDefault();

  if (gameOver) {
    return;
  }

  if (undoStack.length < 1) {
    console.debug('No previously saved moves on the undo stack.');
    return;
  }

  const previous = undoStack.pop();

  // an "undo" can have multiple steps; e.g. moving a card and flipping
  // the new top card; multi-step undos are stored in an array
  if (Array.isArray(previous)) {
    // the objects are pushed on to the group in order, so to correctly
    // reverse, we need to reverse the list as well
    for (const step of previous.reverse()) {
      undo(step);
    }
  } else {
    undo(previous);
  }
};

document.body.addEventListener('mousemove', onMove);
document.body.addEventListener('touchmove', onMove);
document.body.addEventListener('mouseup', onUp);
document.body.addEventListener('touchend', onUp);

window.addEventListener('resize', onResize);
window.addEventListener('keydown', onKeyDown);

const dealButton = document.querySelector('#deal_button');
const undoButton = document.querySelector('#undo_button');
const aboutButton = document.querySelector('#about_button');

dealButton.addEventListener('mouseup', onDeal);
undoButton.addEventListener('mouseup', onUndo);
aboutButton.addEventListener('mouseup', showAboutScreen);

// Mobile Safari seems to have some undocumented conditions that need
// to be met before it will fire `click` events
dealButton.addEventListener('touchend', onDeal);
undoButton.addEventListener('touchend', onUndo);
aboutButton.addEventListener('touchend', showAboutScreen);

// initial resize
onResize();

// stack cards on left-most foundation
(async () => {
  await stackCards();
})();

// Fireworks.start(() => {
//   console.debug('done!');
// });

// set up a win condition; comment out `stackCards` to use this
// if (DEBUG) {
//   for (let i = 0; i < foundations.length; i += 1) {
//     let foundation = foundations[i];
//
//     // move all cards to winning positions
//     for (let j = 0; j < 13; j += 1) {
//       let card = cards[(13 * i) + j];
//       card.flip();
//       let parent = foundation.lastCard;
//       card.setParent(parent);
//       card.moveTo(parent.x, parent.y);
//     }
//   }
// }
