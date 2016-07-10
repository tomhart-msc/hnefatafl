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

// There is some very dangerous code ins jsBoard that sets the width, height,
// and other attributes of all "td" elements, thus messing up the web page
// layout. As a workaround, fix it here, after initializing the board.
var x = document.getElementsByClassName("gameContainer");
x[0].style.width="650px";
x[0].style.background="#060606";

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

// Utility methods related to cells

function isCellEmpty(c) {
  return (b.cell(c).get() == null);
}

function isThrone(c) {
  return c[0] == 5 && c[1] == 5;
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

function addLoc(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

// Root of our class hierarchy for Hnefatafl pieces. A jsboard "piece" is just
// an HTML div element.
function TaflPiece(board, piece) {
  this.board = board;
  this.piece = piece;
  this.dead = false;
  this.isKing = false;
}
TaflPiece.prototype.loc = function() {
  if (this.dead) {
    return undefined;
  }
  return this.board.cell(this.piece.parentNode).where();
}
TaflPiece.prototype.canLandOn = function (c) {
  return isCellInBounds(c) && isCellEmpty(c);
}
TaflPiece.prototype.getMoves = function() {
  var start = this.loc();
  var moves = [];
  var self = this;
  [[1,0], [-1,0], [0,1], [0,-1]].forEach(function(a) {
    var cur = addLoc(start, a);
    while (self.canLandOn(cur)) {
      moves.push(cur);
      cur = addLoc(cur, a);
    }
  });
  return moves;
}
TaflPiece.prototype.die = function () {
  this.board.cell(this.piece.parentNode).rid();
  this.dead = true;
}
TaflPiece.prototype.addEventListener = function(a,b) {
  // Forward it to the underlying piece
  this.piece.addEventListener(a,b);
}
TaflPiece.prototype.removeEventListener = function(a,b) {
  // Forward it to the underlying piece
  this.piece.removeEventListener(a,b);
}

function King(board, piece) {
  TaflPiece.call(this, board, piece);
  this.colour = "white";
  this.isKing = true;
}
King.prototype = Object.create(TaflPiece.prototype);
King.prototype.isCaptured = function () {
  var start = this.loc();
  var surroundedSides = 0;
  var self = this;
  [[1,0], [-1,0], [0,1], [0,-1]].forEach(function(a) {
    var cur = addLoc(start, a);
    var pieceAt = getTaflPieceAtLoc(cur);
    if (isCellInBounds(cur) && (
          (pieceAt && pieceAt.colour == "black") ||
          (!pieceAt && isThrone(cur)))) {
            surroundedSides++;
    }
  });
  return (surroundedSides == 4);
}
King.prototype.hasEscaped = function () {
  return isCellCorner(this.loc());
}

function Defender(board, piece) {
  TaflPiece.call(this, board, piece);
  this.colour = "white";
}
Defender.prototype = Object.create(TaflPiece.prototype);

function Attacker(board, piece) {
  TaflPiece.call(this, board, piece);
  this.colour = "black";
}
Attacker.prototype = Object.create(TaflPiece.prototype);
Attacker.prototype.canLandOn = function (c) {
  return isCellInBounds(c) && isCellEmpty(c) && !isCellCorner(c);
}

// create pieces to place in DOM
var whitePieces = [
    new King(b, king.clone())
  ];
for (var i = 0; i < 12; i++) {
  whitePieces.push(new Defender(b, defender.clone()));
}
[[3,5],[4,4],[4,5],[4,6],[5,3],[5,4],[5,6],[5,7],[6,4],[6,5],[6,6],[7,5]].forEach(function(i,j)
   {
     b.cell(i).place(whitePieces[j+1].piece);
   });
b.cell(centre).place(whitePieces[0].piece);

var blackPieces = [];
for (var i = 0; i < 24; i++) {
  blackPieces.push(new Attacker(b, attacker.clone()));
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
attackSquares.forEach(function(i,j) {b.cell(i).place(blackPieces[j].piece);});

var isWhitesTurn = false;

// give functionality to pieces

var moveListener = function() { showMoves(this); };

function enableWhite() {
  isWhitesTurn = true;
  for (var i=0; i<whitePieces.length; i++)
    whitePieces[i].addEventListener("click", moveListener);
  for (var i=0; i<blackPieces.length; i++)
    blackPieces[i].removeEventListener("click", moveListener);
}

function enableBlack() {
  isWhitesTurn = false;
  for (var i=0; i<whitePieces.length; i++)
    whitePieces[i].removeEventListener("click", moveListener);
  for (var i=0; i<blackPieces.length; i++)
    blackPieces[i].addEventListener("click", moveListener);
}

function deactivatePieces() {
  for (var i=0; i<whitePieces.length; i++)
    whitePieces[i].removeEventListener("click", moveListener);
  for (var i=0; i<blackPieces.length; i++)
    blackPieces[i].removeEventListener("click", moveListener);
}

function setWinner(colour) {
  var div = document.getElementsByClassName("status")[0];
  div.innerHTML = "<center><h1>" + colour + " wins!</h1></center>";
}

function checkForGameOver() {
  var king = getKing();
  var captured = king.isCaptured();
  var escaped = king.hasEscaped();
  if (captured || escaped) {
    deactivatePieces();
  }
  if (captured) { setWinner("Black"); }
  if (escaped) { setWinner("White"); }
}

// Attackers get to go first
enableBlack();

// Variables for piece to move and its locs. The jsboard library Unfortunately
// requires access to the listener to remove it using removeOn, making
// currying difficult, hence the global variables to give the listener
// access to the move locations.
var bindMoveLocs, bindMovePiece;

function getTaflPiece(piece) {
  function isPiece(p) {
    return p.piece == piece;
  }
  return whitePieces.find(isPiece, piece) || blackPieces.find(isPiece, piece);
}

function getKing() {
  function isPiece(p) {
    return p.isKing;
  }
  return whitePieces.find(isPiece);
}

function getTaflPieceAtLoc(loc) {
  function isPiece(p) {
    var ploc = p.loc();
    if (!ploc) {
      return false;
    }
    return ((ploc[0] == loc[0]) && (ploc[1] == loc[1]));
  }
  return whitePieces.find(isPiece) || blackPieces.find(isPiece);
}

// show new locations
function showMoves(piece) {
    resetBoard();
    var taflPiece = getTaflPiece(piece);
    bindMoveLocs = taflPiece.getMoves();
    if (bindMoveLocs.length <= 0) {
      setWinner(isWhitesTurn ? "Black" : "White");
      deactivatePieces();
    }
    bindMovePiece = piece;
    bindMoveEvents(bindMoveLocs, taflPiece);
}

// bind move event to new piece locations
function bindMoveEvents(locs, taflPiece) {
    for (var i=0; i<locs.length; i++) {
        b.cell(locs[i]).DOM().classList.add("green");
        findPiecesKilledByMove(locs[i], taflPiece).forEach( function(p) {
          b.cell(p.loc()).DOM().classList.add("red");
        });
        b.cell(locs[i]).on("click", movePiece);
    }
}

// Using rules from http://aagenielsen.dk/fetlar_rules_en.php :
//   * Corners are hostile to all pieces but the king.
//   * Throne is hostile to attackers always, but to defenders if empty.
//   * The king can be captured on all 4 sides, or on three sides plus the
//     throne -- NOT along the edge.
function findPiecesKilledByMove(loc, movedPiece) {
  var pieces = [];
  [[0,-1], [0,1], [1,0], [-1,0]].forEach( function(a) {
    var plusOne = addLoc(loc, a);
    var plusTwo = addLoc(plusOne, a);
    var middle = getTaflPieceAtLoc(plusOne);
    if (middle && middle.isKing) {
      return false; // short circuit -- king is special
    }
    var other = getTaflPieceAtLoc(plusTwo);
    if (middle && other) {
      if (movedPiece.colour == other.colour && movedPiece.colour != middle.colour) {
        pieces.push(middle);
      }
    } else if (isCellCorner(plusTwo) && middle) {
      if (movedPiece.colour != middle.colour) {
        pieces.push(middle);
      }
    } else if (isThrone(plusTwo) && middle) {
      // Throne is hostile to all when empty, and black when occupied by white.
      // The latter case will have been taken care of above.
      if (movedPiece.colour == "black" && middle.colour == "white") {
        pieces.push(middle);
      }
    }
  });
  return pieces;
}

function killDeadPieces(loc, movedPiece) {
   var toKill = findPiecesKilledByMove(loc, movedPiece);
   toKill.forEach(function(p) { p.die(); });
}

// actually move the piece
function movePiece() {
    var userClick = b.cell(this).where();
    if (bindMoveLocs.indexOf(userClick)) {
        b.cell(userClick).place(bindMovePiece);
        killDeadPieces(userClick, getTaflPieceAtLoc(userClick));
        resetBoard();
        if (isWhitesTurn) {
          enableBlack();
        } else {
          enableWhite();
        }
        checkForGameOver();
    }
}

// remove previous green spaces and event listeners
function resetBoard() {
    for (var r=0; r<b.rows(); r++) {
        for (var c=0; c<b.cols(); c++) {
            b.cell([r,c]).DOM().classList.remove("green");
            b.cell([r,c]).DOM().classList.remove("red");
            b.cell([r,c]).removeOn("click", movePiece);
        }
    }
}
