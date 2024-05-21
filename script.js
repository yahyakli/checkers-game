window.onload = function () {

  class Piece {
    constructor(element, position) {
      this.canMove = true;
      this.element = element;
      this.position = position;
      this.player = (this.element.id < 12) ? 1 : 2;
      this.king = false;
    }

    makeKing() {
      this.element.style.backgroundImage = `url('img/king${this.player}.png')`;
      this.king = true;
    }

    move(tile) {
      this.element.classList.remove('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
      if ((this.player == 1 && !this.king && tile.position[0] < this.position[0]) ||
        (this.player == 2 && !this.king && tile.position[0] > this.position[0])) return false;

      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      this.element.style.top = Board.dictionary[this.position[0]];
      this.element.style.left = Board.dictionary[this.position[1]];

      if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
        this.makeKing();
      return true;
    }

    canJumpAny() {
      return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]));
    }

    canOpponentJump(newPosition) {
      const dx = newPosition[1] - this.position[1];
      const dy = newPosition[0] - this.position[0];

      if ((this.player == 1 && !this.king && newPosition[0] < this.position[0]) ||
        (this.player == 2 && !this.king && newPosition[0] > this.position[0])) return false;

      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      const tileToCheckx = this.position[1] + dx / 2;
      const tileToChecky = this.position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;

      if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        for (const piece of pieces) {
          if (piece.position[0] == tileToChecky && piece.position[1] == tileToCheckx) {
            if (this.player != piece.player) {
              return piece;
            }
          }
        }
      }
      return false;
    }

    opponentJump(tile) {
      const pieceToRemove = this.canOpponentJump(tile.position);
      if (pieceToRemove) {
        pieceToRemove.remove();
        return true;
      }
      return false;
    }

    remove() {
      this.element.style.display = "none";
      if (this.player == 1) {
        document.getElementById('player2').innerHTML += "<div class='capturedPiece'></div>";
        Board.score.player2 += 1;
      }
      if (this.player == 2) {
        document.getElementById('player1').innerHTML += "<div class='capturedPiece'></div>";
        Board.score.player1 += 1;
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      this.position = [];
      const playerWon = Board.checkifAnybodyWon();
      if (playerWon) {
        document.getElementById('winner').innerHTML = `Player ${playerWon} has won!`;
      }
    }
  }

  class Tile {
    constructor(element, position) {
      this.element = element;
      this.position = position;
    }

    inRange(piece) {
      for (const k of pieces)
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        return 'regular';
      } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        return 'jump';
      }
    }
  }

  const gameBoard = [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2]
  ];

  const pieces = [];
  const tiles = [];

  const dist = (x1, y1, x2, y2) => Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));

  const Board = {
    board: gameBoard,
    score: { player1: 0, player2: 0 },
    playerTurn: 1,
    jumpexist: false,
    continuousjump: false,
    tilesElement: document.querySelector('div.tiles'),
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],

    initalize() {
      let countPieces = 0;
      let countTiles = 0;
      for (const row in this.board) {
        for (const column in this.board[row]) {
          if (row % 2 == 0) {
            if (column % 2 == 0) {
              countTiles = this.tileRender(row, column, countTiles);
            }
          } else {
            if (column % 2 == 1) {
              countTiles = this.tileRender(row, column, countTiles);
            }
          }
          if (this.board[row][column] == 1) {
            countPieces = this.playerPiecesRender(1, row, column, countPieces);
          } else if (this.board[row][column] == 2) {
            countPieces = this.playerPiecesRender(2, row, column, countPieces);
          }
        }
      }
    },

    tileRender(row, column, countTiles) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = 'tile' + countTiles;
      tile.style.top = this.dictionary[row];
      tile.style.left = this.dictionary[column];
      this.tilesElement.appendChild(tile);
      tiles[countTiles] = new Tile(document.getElementById("tile" + countTiles), [parseInt(row), parseInt(column)]);
      return countTiles + 1;
    },

    playerPiecesRender(playerNumber, row, column, countPieces) {
      const playerPieces = document.querySelector('.player' + playerNumber + 'pieces');
      const piece = document.createElement('div');
      piece.className = 'piece';
      piece.id = countPieces;
      piece.style.top = this.dictionary[row];
      piece.style.left = this.dictionary[column];
      playerPieces.appendChild(piece);
      pieces[countPieces] = new Piece(document.getElementById(countPieces), [parseInt(row), parseInt(column)]);
      return countPieces + 1;
    },

    isValidPlacetoMove(row, column) {
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      if (this.board[row][column] == 0) {
        return true;
      }
      return false;
    },

    changePlayerTurn() {
      this.playerTurn = (this.playerTurn == 1) ? 2 : 1;
      document.querySelector('.turn').style.background = `linear-gradient(to right, ${(this.playerTurn == 2) ? "transparent 50%, lightgreen 50%" : "lightgreen 50%, transparent 50%"}`;
      this.check_if_jump_exist();
    },

    checkifAnybodyWon() {
      if (this.score.player1 == 12) {
        return 1;
      } else if (this.score.player2 == 12) {
        return 2;
      }
      return false;
    },

    clear() {
      location.reload();
    },

    check_if_jump_exist() {
      this.jumpexist = false;
      this.continuousjump = false;
      for (const k of pieces) {
        k.canMove = false;
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
          this.jumpexist = true;
          k.canMove = true;
        }
      }
      if (!this.jumpexist) {
        for (const k of pieces) k.canMove = true;
      }
    },
  };

  Board.initalize();

  document.querySelectorAll('.piece').forEach(piece => {
    piece.addEventListener('click', function () {
      const isPlayersTurn = (this.parentElement.className.split(' ')[0] == "player" + Board.playerTurn + "pieces");
      if (isPlayersTurn && !Board.continuousjump && pieces[this.id].canMove) {
        const selected = this.classList.contains('selected');
        document.querySelectorAll('.piece').forEach(el => {
          el.classList.remove('selected');
        });
        if (!selected) {
          this.classList.add('selected');
        }
      }
    });
  });

  document.getElementById('cleargame').addEventListener('click', function () {
    Board.clear();
  });

  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', function () {
      if (document.querySelectorAll('.selected').length != 0) {
        const tileID = this.id.replace('tile', '');
        const tileObj = tiles[tileID];
        const piece = pieces[document.querySelector('.selected').id];
        const inRange = tileObj.inRange(piece);
        if (inRange != 'wrong') {
          if (inRange == 'jump') {
            if (piece.opponentJump(tileObj)) {
              piece.move(tileObj);
              if (piece.canJumpAny()) {
                piece.element.classList.add('selected');
                Board.continuousjump = true;
              } else {
                Board.changePlayerTurn();
              }
            }
          } else if (inRange == 'regular' && !Board.jumpexist) {
            if (!piece.canJumpAny()) {
              piece.move(tileObj);
              Board.changePlayerTurn();
            } else {
              alert("You must jump when possible!");
            }
          }
        }
      }
    });
  });
};