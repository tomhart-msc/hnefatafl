// Piece icons licensed under the Creative Commons Attribution-Share Alike 3.0
// Unported license by Wikimedia user NikNaks.
// King icon licensed under the Creative Commons CC0 1.0 Universal Public
// Domain Dedication by Wikimedia user Cyril Wack.
// Shield knots licensed under Creative Commons CC0 1.0 Universal Public
// Domain Dedication by Wikimedia user Karl432.

// create board
var b = jsboard.board({attach:"game", size:"11x11"});
b.style({background: "#E9AB31"});
b.cell("each").style({width:"50px", height:"50px", background: "#F4CF85", border: "1px solid black", borderRadius: "3px"});

// Mark the special squares
var corners = [[0,0], [0,10], [10,0], [10,10]];
var centre = [5,5];
function addShield(board, pos, color) {
  board.cell(pos).style({background: "url('resources/shield_knot.svg')",
     backgroundSize: "100% 100%", backgroundColor: color});
}
corners.forEach(function(c) {addShield(b, c, "#E9AB31")});
addShield(b, centre, "#E9AB31");

var king   = jsboard.piece({text:"WK", textIndent:"-9999px", background:"url('resources/chess_king.svg') 0% 0% / 100% 100% no-repeat", width:"50px", height:"50px", margin:"0 auto" });
var defender   = jsboard.piece({text:"WP", textIndent:"-9999px", background:"url('resources/chess_defender.svg') 0% 0% / 100% 100% no-repeat", width:"50px", height:"50px", margin:"0 auto" });
var attacker   = jsboard.piece({text:"BP", textIndent:"-9999px", background:"url('resources/chess_attacker.svg') 0% 0% / 100% 100% no-repeat", width:"50px", height:"50px", margin:"0 auto" });

function isCellEmpty(c) {
  return (b.cell(c).get() == null);
}

function isCellCorner(c) {
  var isCorner = false;
  corners.forEach(function(corner) {
    if (corner[0] == c[0] && corner[1] == c[1]) {
        isCorner = true;
    }
  });
  return isCorner;
}

function isCellInBounds(c) {
  return (0 <= c[0]) && (c[0] <= 10) && (0 <= c[1]) && (c[1] <= 10);
}

// Gets a piece's current location on a given board.
function loc(board, piece) {
  return board.cell(piece.parentNode).where();
}

function addLoc(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function getDefenderMoves(board, piece) {
  var start = loc(board, piece);
  var moves = [];
  [[1,0], [-1,0], [0,1], [0,-1]].forEach(function(a) {
    var cur = addLoc(start, a);
    while (isCellInBounds(cur) && isCellEmpty(cur)) {
      moves.push(cur);
      cur = addLoc(cur, a);
    }
  });
  return moves;
}

function getKingMoves(board, piece) {
  var start = loc(board, piece);
  var moves = [];
  [[1,0], [-1,0], [0,1], [0,-1]].forEach(function(a) {
    var cur = addLoc(start, a);
    while (isCellInBounds(cur) && isCellEmpty(cur)) {
      moves.push(cur);
      cur = addLoc(cur, a);
    }
  });
  return moves;
}

function getAttackerMoves(board, piece) {
  var start = loc(board, piece);
  var moves = [];
  [[1,0], [-1,0], [0,1], [0,-1]].forEach(function(a) {
    var cur = addLoc(start, a);
    while (isCellInBounds(cur) && isCellEmpty(cur) && !isCellCorner(cur)) {
      moves.push(cur);
      cur = addLoc(cur, a);
    }
  });
  return moves;
}

// create pieces to place in DOM
var whitePieces = [
    king.clone()
  ];
for (var i = 0; i < 12; i++) {
  whitePieces.push(defender.clone());
}
[[3,5],[4,4],[4,5],[4,6],[5,3],[5,4],[5,6],[5,7],[6,4],[6,5],[6,6],[7,5]].forEach(function(i,j)
   {
     b.cell(i).place(whitePieces[j+1]);
   });
b.cell(centre).place(whitePieces[0]);

var blackPieces = [];
for (var i = 0; i < 24; i++) {
  blackPieces.push(attacker.clone());
}
var attackSquares = [];
for (var i = 3; i < 8; i++) {
  attackSquares.push([0,i]);
  attackSquares.push([10,i]);
  attackSquares.push([i,0]);
  attackSquares.push([i,10]);
}
attackSquares.push([1,5]);
attackSquares.push([9,5]);
attackSquares.push([5,1]);
attackSquares.push([5,9]);
attackSquares.forEach(function(i,j) {b.cell(i).place(blackPieces[j]);});

var isWhitesTurn = true;

// give functionality to pieces

var moveListener = function() { showMoves(this); };

function enableWhite() {
  for (var i=0; i<whitePieces.length; i++)
    whitePieces[i].addEventListener("click", moveListener);
  for (var i=0; i<blackPieces.length; i++)
    blackPieces[i].removeEventListener("click", moveListener);
}

function enableBlack() {
  for (var i=0; i<whitePieces.length; i++)
    whitePieces[i].removeEventListener("click", moveListener);
  for (var i=0; i<blackPieces.length; i++)
    blackPieces[i].addEventListener("click", moveListener);
}

// Defenders get to go first
enableWhite();

// Variables for piece to move and its locs. The jsboard library Unfortunately
// requires access to the listener to remove it using removeOn, making
// currying difficult, hence the global variables to give the listener
// access to the move locations.
var bindMoveLocs, bindMovePiece;

// show new locations
function showMoves(piece) {

    resetBoard();

    var thisPiece = b.cell(piece.parentNode).get();
    var newLocs = [];

    // Unfortunately, the piece object is hidden by the jsboard module,
    // forcing us to do this ugly if-then hack.
    if (thisPiece=="WP") {
      newLocs = getDefenderMoves(b, piece);
    } else if (thisPiece == "WK") {
      newLocs = getKingMoves(b, piece);
    } else {
      newLocs = getAttackerMoves(b, piece);
    }

    bindMoveLocs = newLocs.slice();
    bindMovePiece = piece;
    bindMoveEvents(newLocs);
}

// bind move event to new piece locations
function bindMoveEvents(locs) {
    for (var i=0; i<locs.length; i++) {
        b.cell(locs[i]).DOM().classList.add("green");
        b.cell(locs[i]).on("click", movePiece);
    }
}

// actually move the piece
function movePiece() {
    var userClick = b.cell(this).where();
    if (bindMoveLocs.indexOf(userClick)) {
        b.cell(userClick).place(bindMovePiece);
        resetBoard();
        if (isWhitesTurn) {
          enableBlack();
          isWhitesTurn = false;
        } else {
          enableWhite();
          isWhitesTurn = true;
        }
    }
}

// remove previous green spaces and event listeners
function resetBoard() {
    for (var r=0; r<b.rows(); r++) {
        for (var c=0; c<b.cols(); c++) {
            b.cell([r,c]).DOM().classList.remove("green");
            b.cell([r,c]).removeOn("click", movePiece);
        }
    }
}
