window.onload = function () {

  var gameBoard = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0]
  ];

  var pieces = [];
  var tiles = [];

  //calc distance btwn two tokens
  var dist = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  };

  //24 * token object
  function Piece(element, position) {
    this.allowedtomove = true;
    this.element = element;
    this.position = position;
    this.player = '';
    if (this.element.id < 12)
      this.player = 1;
    else
      this.player = 2;
    this.king = false;
    this.makeKing = function () {
      this.element.style.backgroundImage = "url('img/king" + this.player + ".png')";
      this.king = true;
    };
    //moves the token
    this.move = function (tile) {
      this.element.classList.remove('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
      //ckeck it doesn't go backwards if it's not a king
      if (this.player == 1 && this.king == false) {
        if (tile.position[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if (tile.position[0] > this.position[0]) return false;
      }
      //remove the old mark and put the new one
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      //change the style using board's dictionary
      this.element.style.top = Board.dictionary[this.position[0]];
      this.element.style.left = Board.dictionary[this.position[1]];
      //make token king
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
        this.makeKing();
      return true;
    };

    //check if token can jump anywhere
    this.canJumpAny = function () {
      return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]));
    };

    //ckeck if token can jump in a specific place
    // this function return the token to remove it
    this.canOpponentJump = function (newPosition) {
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
      //check if token doesn't go backwards if not a king
      if (this.player == 1 && this.king == false) {
        if (newPosition[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if (newPosition[0] > this.position[0]) return false;
      }
      //check if the move valid
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      var tileToCheckx = this.position[1] + dx / 2;
      var tileToChecky = this.position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
      if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        for (let pieceIndex in pieces) {
          if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
            if (this.player != pieces[pieceIndex].player) {
              return pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };

    this.opponentJump = function (tile) {
      var pieceToRemove = this.canOpponentJump(tile.position);
      //check if is a token to remove it
      if (pieceToRemove) {
        pieceToRemove.remove();
        return true;
      }
      return false;
    };

    this.remove = function () {
      //remove the token from gameBoard and add point to player
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
      //reset position
      this.position = [];
      var playerWon = Board.checkifAnybodyWon();
      if (playerWon) {
        document.getElementById('winner').innerHTML = "Player " + playerWon + " has won!";
      }
    };
  }

  function Tile(element, position) {
    this.element = element;
    this.position = position;
    this.inRange = function (piece) {
      for (let k of pieces)
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';
      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        return 'regular';
      } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        return 'jump';
      }
    };
  }

  //Board object
  var Board = {
    board: gameBoard,
    score: {
      player1: 0,
      player2: 0
    },
    playerTurn: 1,
    jumpexist: false,
    continuousjump: false,
    tilesElement: document.querySelector('div.tiles'),
    //Board dictionary
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    //initialize the 8x8 board
    initalize: function () {
      var countPieces = 0;
      var countTiles = 0;
      for (let row in this.board) { //row = index
        for (let column in this.board[row]) { //column = index
          //whole set of if statements control where the tiles and pieces should be placed on the board
          if (row % 2 == 1) {
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
    tileRender: function (row, column, countTiles) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = 'tile' + countTiles;
      tile.style.top = this.dictionary[row];
      tile.style.left = this.dictionary[column];
      this.tilesElement.appendChild(tile);
      tiles[countTiles] = new Tile(document.getElementById("tile" + countTiles), [parseInt(row), parseInt(column)]);
      return countTiles + 1;
    },

    playerPiecesRender: function (playerNumber, row, column, countPieces) {
      var playerPieces = document.querySelector('.player' + playerNumber + 'pieces');
      var piece = document.createElement('div');
      piece.className = 'piece';
      piece.id = countPieces;
      piece.style.top = this.dictionary[row];
      piece.style.left = this.dictionary[column];
      playerPieces.appendChild(piece);
      pieces[countPieces] = new Piece(document.getElementById(countPieces), [parseInt(row), parseInt(column)]);
      return countPieces + 1;
    },
    //check if the location has an object
    isValidPlacetoMove: function (row, column) {
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      if (this.board[row][column] == 0) {
        return true;
      }
      return false;
    },
    //change the active player || also changes div.turn CSS
    changePlayerTurn: function () {
      if (this.playerTurn == 1) {
        this.playerTurn = 2;
        document.querySelector('.turn').style.background = "linear-gradient(to right, transparent 50%, lightgreen 50%)";
      } else {
        this.playerTurn = 1;
        document.querySelector('.turn').style.background = "linear-gradient(to right, lightgreen 50%, transparent 50%)";
      }
      this.check_if_jump_exist();
      return;
    },
    checkifAnybodyWon: function () {
      if (this.score.player1 == 12) {
        return 1;
      } else if (this.score.player2 == 12) {
        return 2;
      }
      return false;
    },
    //reset the game
    clear: function () {
      location.reload();
    },
    check_if_jump_exist: function () {
      this.jumpexist = false;
      this.continuousjump = false;
      for (let k of pieces) {
        k.allowedtomove = false;
        // if jump exist only set those jump pieces allowed to move
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
          this.jumpexist = true;
          k.allowedtomove = true;
        }
      }
      // if jump doesn't exist, all pieces are allowed to move
      if (!this.jumpexist) {
        for (let k of pieces) k.allowedtomove = true;
      }
    },
  };

  Board.initalize();

  //select the piece on click
  document.querySelectorAll('.piece').forEach(piece => {
    piece.addEventListener('click', function () {
      var selected;
      var isPlayersTurn = (this.parentElement.className.split(' ')[0] == "player" + Board.playerTurn + "pieces");
      if (isPlayersTurn) {
        if (!Board.continuousjump && pieces[this.id].allowedtomove) {
          if (this.classList.contains('selected')) selected = true;
          document.querySelectorAll('.piece').forEach(el => {
            el.classList.remove('selected');
          });
          if (!selected) {
            this.classList.add('selected');
          }
        }
      }
    });
  });

  //reset game when clear button is pressed
  document.getElementById('cleargame').addEventListener('click', function () {
    Board.clear();
  });

  //move piece when tile is clicked
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', function () {
      //check if a token is selected
      if (document.querySelectorAll('.selected').length != 0) {
        //find the tile object being clicked and piece selected
        var tileID = this.id.replace('tile', '');
        var tileObj = tiles[tileID];
        var piece = pieces[document.querySelector('.selected').id];
        //check if the tile is in range from the object
        var inRange = tileObj.inRange(piece);
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
            //if it's regular then move it if no jumping is available
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