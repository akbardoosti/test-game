document.addEventListener('DOMContentLoaded', () => {
    const chessboardContainer = document.getElementById('chessboard-container');
    const gameStatusDisplay = document.getElementById('game-status');

    let boardState = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];

    let currentPlayer = 'white';
    let selectedPiece = null; // { piece: 'wP', row: 6, col: 0 }

    // ... (renderBoard, getPieceUnicode, renderPieces, updateStatus remain the same for now)
    function renderBoard() {
        chessboardContainer.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                    square.classList.add('selected');
                }

                chessboardContainer.appendChild(square);
            }
        }
        renderPieces();
        updateStatus();
    }

    function getPieceUnicode(pieceCode) {
        const pieces = {
            'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
            'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
        };
        return pieces[pieceCode] || '';
    }

    function renderPieces() {
        document.querySelectorAll('.piece').forEach(p => p.remove());

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const pieceCode = boardState[row][col];
                if (pieceCode) {
                    const squareElement = chessboardContainer.querySelector(`[data-row='${row}'][data-col='${col}']`);
                    if (squareElement) {
                        const pieceElement = document.createElement('span');
                        pieceElement.classList.add('piece');
                        if (pieceCode.startsWith('w')) {
                            pieceElement.classList.add('white-piece');
                        } else {
                            pieceElement.classList.add('black-piece');
                        }
                        pieceElement.textContent = getPieceUnicode(pieceCode);
                        squareElement.appendChild(pieceElement);
                    }
                }
            }
        }
    }

    function updateStatus() {
        let statusText = `${currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`;
        if (selectedPiece) {
            statusText += ` - Selected ${getPieceUnicode(selectedPiece.piece)} at [${selectedPiece.row}, ${selectedPiece.col}]`;
        }
        gameStatusDisplay.textContent = statusText;
    }


    function isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceColor, targetPiece) {
        const direction = (pieceColor === 'w') ? -1 : 1; // White moves up (row decreases), Black moves down
        const startRow = (pieceColor === 'w') ? 6 : 1;

        // 1. Standard one-square move
        if (toRow === fromRow + direction && toCol === fromCol && targetPiece === null) {
            return true;
        }

        // 2. Two-square move from starting position
        if (fromRow === startRow && toRow === fromRow + 2 * direction && toCol === fromCol && targetPiece === null) {
            // Check if the intermediate square is also empty
            if (boardState[fromRow + direction][fromCol] === null) {
                return true;
            }
        }

        // 3. Diagonal capture
        if (toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1 && targetPiece !== null) {
            // Target piece must be of the opposite color (handled by general move logic later, but good to be explicit)
            // For now, `handleSquareClick` checks if target is an opponent's piece.
            return true;
        }

        return false;
    }

    function isValidRookMove(fromRow, fromCol, toRow, toCol) {
        // Must be a horizontal or vertical move
        if (fromRow !== toRow && fromCol !== toCol) {
            return false; // Not a straight line
        }

        // Check for obstructions along the path
        if (fromRow === toRow) { // Horizontal move
            const startCol = Math.min(fromCol, toCol);
            const endCol = Math.max(fromCol, toCol);
            for (let col = startCol + 1; col < endCol; col++) {
                if (boardState[fromRow][col] !== null) {
                    return false; // Path is blocked
                }
            }
        } else { // Vertical move (fromCol === toCol)
            const startRow = Math.min(fromRow, toRow);
            const endRow = Math.max(fromRow, toRow);
            for (let row = startRow + 1; row < endRow; row++) {
                if (boardState[row][fromCol] !== null) {
                    return false; // Path is blocked
                }
            }
        }

        // If we reach here, the path is clear or it's an adjacent square.
        // The check for moving onto own piece is done in handleSquareClick.
        return true;
    }

    function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);

        // A knight's move is valid if one difference is 1 and the other is 2
        return (rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1);
        // The check for moving onto own piece is done in handleSquareClick.
        // Knights can jump, so no path checking needed.
    }

    function handleSquareClick(event) {
        const clickedSquareElement = event.target.closest('.square');
        if (!clickedSquareElement) return;

        const toRow = parseInt(clickedSquareElement.dataset.row);
        const toCol = parseInt(clickedSquareElement.dataset.col);
        const pieceOnClickedSquare = boardState[toRow][toCol];

        if (selectedPiece) {
            const { piece, row: fromRow, col: fromCol } = selectedPiece;
            const pieceType = piece.substring(1); // P, R, N, B, Q, K
            const pieceColor = piece.charAt(0); // w or b

            if (fromRow === toRow && fromCol === toCol) { // Clicked same piece
                deselectPiece();
                return;
            }

            // Prevent moving onto own piece (general rule)
            if (pieceOnClickedSquare && pieceOnClickedSquare.startsWith(pieceColor)) {
                // If clicking another of own pieces, switch selection
                selectPiece(toRow, toCol, pieceOnClickedSquare);
                return;
            }

            let isValid = false;
            if (pieceType === 'P') {
                isValid = isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceColor, pieceOnClickedSquare);
            } else if (pieceType === 'R') {
                isValid = isValidRookMove(fromRow, fromCol, toRow, toCol);
            } else if (pieceType === 'N') { // 'N' for Knight
                isValid = isValidKnightMove(fromRow, fromCol, toRow, toCol);
            } else {
                // For other pieces (Bishop, Queen, King), allow any move for now
                isValid = true;
            }

            if (isValid) {
                boardState[toRow][toCol] = piece;
                boardState[fromRow][fromCol] = null;

                currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
                deselectPiece();
            } else {
                console.log(`Invalid move for ${pieceType}`);
                // Optionally keep piece selected or deselect:
                // deselectPiece(); // if you want to deselect on invalid move attempt
            }

        } else {
            if (pieceOnClickedSquare) {
                const selectedPieceColor = pieceOnClickedSquare.charAt(0);
                if ((currentPlayer === 'white' && selectedPieceColor === 'w') ||
                    (currentPlayer === 'black' && selectedPieceColor === 'b')) {
                    selectPiece(toRow, toCol, pieceOnClickedSquare);
                }
            }
        }
    }

    function selectPiece(row, col, piece) {
        selectedPiece = { piece, row, col };
        renderBoard();
    }

    function deselectPiece() {
        selectedPiece = null;
        renderBoard();
    }

    chessboardContainer.addEventListener('click', handleSquareClick);
    renderBoard();
});
