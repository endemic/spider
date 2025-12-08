const SUITS = ['hearts', 'spades', 'diamonds', 'clubs'];
const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];
const DEBUG = true;

// used for custom double-click/tap implementation
// this val is set in `onDown` function; if it is called again rapidly
// (e.g. within 500ms) then the interaction counts as a double-click
let lastOnDownTimestamp = Date.now();

// stores the last click/touch point; used because double-clicks
// need to be close together
let previousPoint = { x: 0, y: 0};

// array to hold inverse move data
const undoStack = [];

// boolean which can be checked to short-circuit player interaction, etc.
let gameOver = true;

// allow deal without confirmation on app load
let firstGame = true;

// current time elapsed in seconds
let time = 0;

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

  // TODO: these can be hidden
  // Make these visible by adding to DOM
  // document.body.append(foundation.element);
}

const talon = new Talon();
document.body.append(talon.element);

const grabbed = new Grabbed();

// array to hold refs to each card obj
const cards = [];

// based on difficulty, determine the correct types of cards to be initialized
// hard => 4 suits (2 decks)
// med => 2 suits (hearts + spades)
// easy => 1 suit (spades)

let difficulty = 'easy';

const initCards = () => {
  // remove existing cards
  cards.forEach(c => {
    // TODO
  });

  // re-init based on difficulty
  const suitMap = {
    hard: SUITS,
    medium: ['hearts', 'spades'],
    easy: ['spades']
  };

  while (cards.length < 104) {
    for (let suit of suitMap[difficulty]) {
      RANKS.forEach(rank => {
        // instantiate new card object
        const card = new Card(suit, rank);

        // add the card's HTML to the page
        document.body.append(card.element);

        // add the card object to a ref list
        cards.push(card);
      });
    }
  }
}

// immediately init cards; TODO do this when difficulty changes
initCards();


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

const updateMovableCardsLabel = () => document.querySelector('#movable_cards').textContent = `Moves: TODO`;

const attemptToPlayOnFoundation = async card => {
  for (let i = 0; i < foundations.length; i += 1) {
    const foundation = foundations[i];

    if (foundation.validPlay(card)) {
      let parent = foundation.lastCard;  // either a card or the foundation itself

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      card.setParent(parent);
      card.zIndex = 52; // ensure card doesn't animate _under_ others
      card.animateTo(parent.x, parent.y);

      // show a brief "flash" when the card is close to the foundation
      wait(150).then(() => card.flash());

      // Ensure card z-index is correct _after_ it animates
      wait(250).then(() => card.resetZIndex());

      log(`playing ${card} on foundation #${i}`);

      if (checkWin()) {
        gameOver = true;

        // increment games won counter
        let key = 'freecell:wonGames';
        let wonGames = parseInt(localStorage.getItem(key), 10) || 0;
        localStorage.setItem(key, wonGames + 1);

        // check for fastest game time
        key = 'freecell:fastestGame';
        let fastestGame = localStorage.getItem(key);
        if (time < fastestGame) {
          localStorage.setItem(key, time);
        }

        // wait for animation to finish
        await waitAsync(250);

        CardWaterfall.start(() => {
          reset();
          stackCards();
        });
      }

      updateMovableCardsLabel();

      // if we have a valid play, return from this function;
      return true;
    }
  }

  return false;
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
  talon.child = null;

  time = 0;
  // score = 0;
  document.querySelector('#time').textContent = `Time: ${time}`;
  document.querySelector('#solve_button').style.display = 'none';

  undoStack.length = 0; // hack to empty an array
};

const stackCards = () => {
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
    card.moveTo(talon.x, talon.y);
    card.setParent(talon.lastCard);
    card.zIndex = index;
  }

  log('done moving cards to talon')
};

const deal = async () => {
  let offset = 0;

  // initial deal is 54 cards
  for (let index = 0; index < 54; index += 1) {
    // const card = cards[index];
    const card = talon.lastCard;

    const cascade = cascades[index % cascades.length];
    const lastCard = cascade.lastCard;

    card.setParent(lastCard);
    card.animateTo(lastCard.x, lastCard.y + offset, 0); // TODO: reset to .75s animation

    // only the last 10 cards are face up
    if (index > 43) {
      card.flip();
    }

    // await waitAsync(50);

    // update z-index of the card _after_ the synchronous delay;
    // this gives the animation time to move the card away from the deck
    card.resetZIndex()

    // only want to offset cards vertically after the first row
    offset = index < 9 ? 0 : card.offset;cards.length / 2 - 10
  };

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
    const delta = Date.now() - lastOnDownTimestamp;
    const doubleClick = delta < 500 && dist(point, previousPoint) < 15;

    // reset the timestamp that stores the last time the player clicked
    // if the current click counts as "double", then set the timestamp way in the past
    // otherwise you get a "3 click double click" because the 2nd/3rd clicks are too close together
    lastOnDownTimestamp = doubleClick ? 0 : Date.now();
    previousPoint = point;

    // don't allow interaction with foundations
    if (card.stackType === 'foundation') {
      return;
    }

    if (card.stackType === 'talon') {
      // deal 10 cards to all the cascades
      for (const cascade of cascades) {
        const c = talon.lastCard;
        const parent = cascade.lastCard;
        c.setParent(parent);
        c.animateTo(parent.x, parent.y + grabbed.offset, 500);
        c.zIndex = 999; // ensure animated card is on top of all others
        wait(50).then(() => c.zIndex = parent.zIndex + 1);
        c.flip();
        await waitAsync(50);
      }

      return;
    }

    // can only double-click to play on a foundation
    // if card is last in a cascade/cell
    if (doubleClick && !card.hasCards && !card.animating) {
      log(`double click! attempt to play ${card} on foundations`);
      attemptToPlayOnFoundation(card);
      return;
    }

    // only allow sequences of cards to be picked up
    if (!card.childrenInSequence) {
      log(`can't pick up ${card}, not a sequence!`);

      // try to highlight cards that can be picked up
      // TODO: remove the numeric arg from this method
      invertedCard = card.invertMovableCards(99);

      return;
    }

    grabbed.grab(card);
    grabbed.setOffset(point);

    log(`onDown on ${card}, offset: ${point.x}, ${point.y}`);
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

  // check cascades
  for (let i = 0; i < cascades.length; i += 1) {
    const cascade = cascades[i];

    if (grabbed.overlaps(cascade) && cascade.validPlay(card)) {
      // flip over the newly uncovered card
      if (card.parent.type === 'card' && !card.parent.faceUp) {
        card.parent.flip();
      }

      // set new parent
      let parent = cascade.lastCard;

      undoStack.push({
        card,
        parent,
        oldParent: card.parent
      });

      grabbed.drop(parent);

      log(`dropping ${card} on cascade #${i}`);

      updateMovableCardsLabel();
      // enableAutoSolve();

//       TODO: check to see if full 13 card stack exists in the cascade
      if (cascade.hasAllRanks) {
        const emptyFoundation = foundations.find(f => !f.hasCards);
        for (let j = 0; j < 13; j += 1) {
          const source = cascade.lastCard;
          const target = emptyFoundation.lastCard;
          source.setParent(target);
          source.animateTo(target.x, target.y, 50);
          await waitAsync(50);

          // TODO: add this group move to the undo stack
        }

        // if king was on a face-down card, turn it face up
        if (cascade.lastCard.type === 'card' && !cascade.lastCard.faceUp) {
          cascade.lastCard.flip();
        }
      }

      // valid play, so return out of the loop checking other cells
      return;
    }
  }

  // if we got this far, that means no valid move was made,
  // so the card(s) can go back to their original position
  log('invalid move; dropping card(s) on original position');

  grabbed.drop();
};

const autoSolve = async () => {
  // what are we even doing here?
  // 1. while the game is not won
  // 2. loop over all cards in cells/cascades
  // 3. call the `attemptToPlayOnFoundation` method

  // early return in case you're an idiot and call `autoSolve` manually
  // it will totally be an infinite loop
  if (!enableAutoSolve()) {
    return;
  }

  while (!checkWin()) {
    for (const stack of [cascades, cells].flat()) {
      if (!stack.hasCards) {
        continue;
      }

      const playedCard = attemptToPlayOnFoundation(stack.lastCard);

      if (playedCard) {
        // delay for a hot second before playing more, so all cards aren't moved to foundations simultaneously
        await waitAsync(50);
      }
    }
  }
};
  // let tableauDebug = document.createElement('div');
  // tableauDebug.style.width = `${tableauWidth}px`;
  // tableauDebug.style.height = `${tableauHeight}px`;
  // tableauDebug.style.backgroundColor = 'rgba(255, 0, 255, 0.5)';
  // tableauDebug.style.position = 'absolute';
  // tableauDebug.style.top = `0`;
  // tableauDebug.style.left = `${windowMargin}px`;
  // document.body.append(tableauDebug);
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
  let tableauDebug = document.createElement('div');
  tableauDebug.style.width = `${tableauWidth}px`;
  tableauDebug.style.height = `${tableauHeight}px`;
  tableauDebug.style.backgroundColor = 'rgba(255, 0, 255, 0.5)';
  tableauDebug.style.position = 'absolute';
  tableauDebug.style.top = `20px`;
  tableauDebug.style.left = `${windowMargin}px`;
  document.body.append(tableauDebug);

  const widthInPixels = 680;
  const heightInPixels = 680;

  // set card sizes/margins here
  const margin = (4 / widthInPixels) * tableauWidth; // arbitrary horiztonal margin between cards (6px)
  const width = (64 / widthInPixels) * tableauWidth; // card width (80px)
  const height = (92 / heightInPixels) * tableauHeight; // card height (115px)
  const offset = (30 / heightInPixels) * tableauHeight; // arbitrary vertical diff between stacked cards
  const faceDownOffset = height / 10; // ~13px

  // enumerate over all cards/stacks in order to set their width/height
  for (const cascade of cascades) {
    cascade.size = { width, height };
    cascade.offset = offset;
  }

  for (const foundation of foundations) {
    foundation.size = { width, height };
    foundation.offset = 0;
  }

  for (const card of cards) {
    card.size = { width, height };
    card.offset = faceDownOffset;
  }

  talon.size = { width, height };

  grabbed.size = { width, height };
  grabbed.offset = offset;

  // Layout code
  const menu = document.querySelector('#menu');
  const status = document.querySelector('#status');

  // add internal padding to menu/status bars
  menu.style.padding = `0 0 0 ${windowMargin}px`;
  status.style.padding = `0 ${windowMargin + margin}px`;

  const top = margin + menu.offsetHeight;
  const left = windowMargin + margin / 2;
  const bottom = heightInPixels - status.offsetHeight;

  cascades.forEach((c, i) => {
    // put at top of window
    c.moveTo(left + (width + margin) * i, top + margin)
  });

  // foundations on the bottom
  foundations.forEach((f, i) => {
    f.moveTo(left + (width / 3 + margin) * i, bottom);
  });

  // Handle resizing <canvas> for card waterfall
  // CardWaterfall.onResize(windowWidth, windowHeight);
  talon.moveTo(windowWidth - windowMargin - margin / 2 - width, bottom);

  // if in a "game over" state, cards are stacked on top of the left-most foundation, and
  // won't be moved along with it, because they are not attached
  if (gameOver) {
    cards.forEach(c => c.moveTo(foundations[0].x, foundations[0].y));
  }
};

const undo = () => {
  if (undoStack.length < 1) {
    log('No previously saved moves on the undo stack.');
    return;
  }

  // get card state _before_ the most recent move
  let { card, parent, oldParent } = undoStack.pop();

  // reverse the relationship; remove attachment from "new" parent
  parent.child = null;

  // we're cheating here and re-using logic from the `Grabbed` class
  // to handle moving/animating cards back to their previous position
  grabbed.grab(card);

  // total cheat
  grabbed.moved = true;

  grabbed.drop(oldParent);

  updateMovableCardsLabel();
};

const onKeyDown = e => {
  // return unless the keypress is meta/contrl + z (for undo)
  if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') {
    return;
  }

  undo();
};

const onDeal = e => {
  e.preventDefault();

  if (firstGame) {
    reset();
    stackCards();
    deal();

    firstGame = false;
  } else {
    dialog.show('Deal again?', () => {
      reset();
      stackCards();
      deal();
    });
  }
};

const onUndo = e => {
  e.preventDefault();

  if (gameOver) {
    return;
  }

  undo();
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
const solveButton = document.querySelector('#solve_button');

dealButton.addEventListener('mouseup', onDeal);
undoButton.addEventListener('mouseup', onUndo);
aboutButton.addEventListener('mouseup', showAboutScreen);
solveButton.addEventListener('mouseup', autoSolve);
// Mobile Safari seems to have some undocumented conditions that need
// to be met before it will fire `click` events
dealButton.addEventListener('touchend', onDeal);
undoButton.addEventListener('touchend', onUndo);
aboutButton.addEventListener('touchend', showAboutScreen);
solveButton.addEventListener('touchend', autoSolve);

// start timer
window.setInterval(() => {
  if (gameOver) {
    return;
  }

  time += 1;
  document.querySelector('#time').textContent = `Time: ${time}`;
}, 1000);

// initial resize
onResize();

// stack cards on left-most foundation
stackCards();

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
