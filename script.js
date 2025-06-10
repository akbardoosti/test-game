document.addEventListener('DOMContentLoaded', () => {
    const chessboardContainer = document.getElementById('chessboard-container');
    const gameStatusDisplay = document.getElementById('game-status');
    const flipBoardBtn = document.getElementById('flip-board-btn'); // Get the button

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
    let selectedPiece = null;
    let isBoardFlipped = false;

    // New state variables for special moves
    let castlingAvailability = {
        wK: true, wR_kingside: true, wR_queenside: true, // White: King, H-Rook, A-Rook
        bK: true, bR_kingside: true, bR_queenside: true  // Black: King, H-Rook, A-Rook
    };

    let enPassantTargetSquare = null; // Stores {row, col} of the square *behind* a pawn that just did a two-square advance
                                    // This square is available for en passant capture on the immediately next turn.

    // ... (renderBoard, getPieceUnicode, renderPieces, updateStatus)

    function renderBoard() {
        chessboardContainer.innerHTML = '';

        for (let r = 0; r < 8; r++) { // Visual row loop
            for (let c = 0; c < 8; c++) { // Visual col loop

                const boardRow = isBoardFlipped ? 7 - r : r;
                const boardCol = isBoardFlipped ? 7 - c : c;

                const square = document.createElement('div');
                square.classList.add('square');
                // Visual alternating colors depend on visual r and c
                square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');

                // Data attributes always store the LOGICAL board coordinates
                square.dataset.row = boardRow;
                square.dataset.col = boardCol;

                if (selectedPiece && selectedPiece.row === boardRow && selectedPiece.col === boardCol) {
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

        for (let boardRow = 0; boardRow < 8; boardRow++) { // Iterate logical board
            for (let boardCol = 0; boardCol < 8; boardCol++) {
                const pieceCode = boardState[boardRow][boardCol];
                if (pieceCode) {
                    // Find square by its LOGICAL data attributes
                    const squareElement = chessboardContainer.querySelector(`[data-row='${boardRow}'][data-col='${boardCol}']`);
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
                    } else {
                        // This might happen if renderBoard logic for data-attributes is wrong
                        // Or if board is flipped and querySelector logic is not robust for visual vs logical.
                        // With current approach, squareElement should always be found.
                        console.error(`Square not found for piece at ${boardRow},${boardCol} when rendering pieces. Board flipped: ${isBoardFlipped}`);
                    }
                }
            }
        }
    }

    // ... (updateStatus, isValidPawnMove, etc. remain the same)
    // ... (handleSquareClick, selectPiece, deselectPiece remain the same)

    if (flipBoardBtn) { // Add event listener for the new button
        flipBoardBtn.addEventListener('click', () => {
            isBoardFlipped = !isBoardFlipped;
            renderBoard(); // Re-render the board with the new orientation
        });
    } else {
        console.error("Flip board button not found!");
    }

    renderBoard(); // Initial render
});
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
            if (boardState[fromRow + direction][fromCol] === null) { // Check intermediate square
                return true;
            }
        }

        // 3. Diagonal capture (standard)
        if (toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1 && targetPiece !== null /* && targetPiece.charAt(0) !== pieceColor */) {
            // The check targetPiece.charAt(0) !== pieceColor is implicitly handled by the generic
            // "can't move on own piece" check in handleSquareClick before isMoveValid is called.
            return true;
        }

        // 4. En Passant Capture
        if (enPassantTargetSquare !== null &&
            toRow === enPassantTargetSquare.row &&
            toCol === enPassantTargetSquare.col &&
            Math.abs(fromCol - toCol) === 1 && // Must be a diagonal move for the capturing pawn
            toRow === fromRow + direction &&   // Must move one step in its forward direction
            targetPiece === null &&            // Destination square must be empty
            enPassantTargetSquare.pieceColor !== pieceColor) { // Must capture opponent's pawn

            // Check if the capturing pawn is correctly positioned next to the pawn that just moved two squares.
            if (fromRow === (enPassantTargetSquare.row - direction)) { // Corrected logic for fromRow relative to EP target
                 return true;
            }
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

    function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);

        // Must be a diagonal move (rowDiff must equal colDiff) and not a "no move"
        if (rowDiff === 0 || rowDiff !== colDiff) {
            return false;
        }

        // Determine direction of movement for path checking
        const dRow = (toRow - fromRow) / rowDiff; // Will be 1 or -1
        const dCol = (toCol - fromCol) / colDiff; // Will be 1 or -1 (colDiff is same as rowDiff here)

        // Check for obstructions along the diagonal path
        let currentRow = fromRow + dRow;
        let currentCol = fromCol + dCol;

        while (currentRow !== toRow) { // Stop before reaching the target square
            if (boardState[currentRow][currentCol] !== null) {
                return false; // Path is blocked
            }
            currentRow += dRow;
            currentCol += dCol;
        }

        // If we reach here, the path is clear.
        // The check for moving onto own piece is done in handleSquareClick.
        return true;
    }

    function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        // A queen's move is valid if it's a valid rook move OR a valid bishop move.
        // The called functions already check for path obstructions.
        if (isValidRookMove(fromRow, fromCol, toRow, toCol) ||
            isValidBishopMove(fromRow, fromCol, toRow, toCol)) {
            return true;
        }
        return false;
    }

    function isValidKingMove(fromRow, fromCol, toRow, toCol, pieceColor) { // Added pieceColor
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);

        // Standard one-square move
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0) ) { // (rowDiff + colDiff > 0) ensures it's a move
            return true;
        }

        // Castling Check (King must be on its original row for this basic check)
        const originalKingRow = (pieceColor === 'w') ? 7 : 0;
        if (fromRow === originalKingRow && fromCol === 4 && rowDiff === 0 && colDiff === 2) {
            // King attempts to move two squares horizontally from its starting column 4

            // Kingside Castling
            if (toCol === 6) { // King moves from e to g
                if (castlingAvailability[pieceColor + 'K'] && castlingAvailability[pieceColor + 'R_kingside']) {
                    // Check squares f and g are empty (relative to king's color)
                    if (boardState[fromRow][5] === null && boardState[fromRow][6] === null) {
                        // Future: Check king not in check, and f, g squares not attacked.
                        return true;
                    }
                }
            }
            // Queenside Castling
            else if (toCol === 2) { // King moves from e to c
                if (castlingAvailability[pieceColor + 'K'] && castlingAvailability[pieceColor + 'R_queenside']) {
                    // Check squares d, c, b are empty (relative to king's color)
                    if (boardState[fromRow][3] === null && boardState[fromRow][2] === null && boardState[fromRow][1] === null) {
                        // Future: Check king not in check, and d, c squares not attacked.
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function isMoveValid(pieceCode, fromRow, fromCol, toRow, toCol, pieceOnTargetSquare) {
        const pieceType = pieceCode.substring(1);
        const pieceColor = pieceCode.charAt(0); // Needed for pawn, and now King for castling

        switch (pieceType) {
            case 'P':
                return isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceColor, pieceOnTargetSquare);
            case 'R':
                return isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'N':
                return isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'B':
                return isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'Q':
                return isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'K':
                // Pass pieceColor to isValidKingMove for castling checks
                return isValidKingMove(fromRow, fromCol, toRow, toCol, pieceColor);
            default:
                console.error(`Unknown piece type for validation: ${pieceType}`);
                return false;
        }
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
            const { piece: selectedPieceCode, row: fromRow, col: fromCol } = selectedPiece; // Renamed 'piece' to 'selectedPieceCode' for clarity
            // const pieceType = selectedPieceCode.substring(1); // Not needed here if isMoveValid handles it
            const selectedPieceColorChar = selectedPieceCode.charAt(0); // For own piece check

            if (fromRow === toRow && fromCol === toCol) { // Clicked same piece
                deselectPiece();
                return;
            }

            // Prevent moving onto own piece (general rule)
            if (pieceOnClickedSquare && pieceOnClickedSquare.startsWith(selectedPieceColorChar)) {
                // If clicking another of own pieces, switch selection
                selectPiece(toRow, toCol, pieceOnClickedSquare);
                return;
            }

            // Use the new central validation function
            let isValid = isMoveValid(selectedPieceCode, fromRow, fromCol, toRow, toCol, pieceOnClickedSquare);

            if (isValid) {
                const originalPieceAtTarget = boardState[toRow][toCol]; // For potential capture logging

                const pieceType = selectedPieceCode.substring(1);
                const pieceColor = selectedPieceCode.charAt(0); // same as selectedPieceColorChar

                // Check if it was an en passant capture BEFORE moving the piece
                let isEnPassantCapture = false;
                if (pieceType === 'P' &&
                    enPassantTargetSquare !== null &&
                    toRow === enPassantTargetSquare.row &&
                    toCol === enPassantTargetSquare.col &&
                    boardState[toRow][toCol] === null && // Target square for EP is empty
                    Math.abs(fromCol - toCol) === 1) { // Diagonal move by pawn
                    isEnPassantCapture = true;
                }

                // Make the primary move
                boardState[toRow][toCol] = selectedPieceCode;
                boardState[fromRow][fromCol] = null;

                // If en passant, remove the captured pawn
                if (isEnPassantCapture) {
                    const capturedPawnRow = (pieceColor === 'w') ? toRow + 1 : toRow - 1;
                    // console.log(`En passant capture! Removing pawn at [${capturedPawnRow}, ${toCol}]`);
                    boardState[capturedPawnRow][toCol] = null;
                }

                // Handle Rook movement for Castling (remains the same)
                if (pieceType === 'K' && Math.abs(fromCol - toCol) === 2) {
                    let rookFromCol, rookToCol, rookPieceCode;
                    if (toCol === 6) { // Kingside castle (King moved e to g)
                        rookFromCol = 7; // h-file
                        rookToCol = 5;   // f-file
                    } else { // Queenside castle (King moved e to c) (toCol === 2)
                        rookFromCol = 0; // a-file
                        rookToCol = 3;   // d-file
                    }
                    rookPieceCode = pieceColor + 'R';
                    boardState[fromRow][rookToCol] = rookPieceCode; // Place rook
                    boardState[fromRow][rookFromCol] = null;      // Clear rook's original square

                    if (toCol === 6) { // Kingside
                        castlingAvailability[pieceColor + 'R_kingside'] = false;
                    } else { // Queenside
                        castlingAvailability[pieceColor + 'R_queenside'] = false;
                    }
                }

                // Update Castling Availability (remains the same)
                if (pieceType === 'K') { castlingAvailability[pieceColor + 'K'] = false; }
                else if (pieceType === 'R') {
                    const originalRookRow = (pieceColor === 'w') ? 7 : 0;
                    if (fromRow === originalRookRow) {
                        if (fromCol === 0) castlingAvailability[pieceColor + 'R_queenside'] = false;
                        if (fromCol === 7) castlingAvailability[pieceColor + 'R_kingside'] = false;
                    }
                }

                // Update En Passant Target Square (this logic correctly clears old EP target and sets new if applicable)
                enPassantTargetSquare = null;
                if (pieceType === 'P' && Math.abs(fromRow - toRow) === 2) {
                    enPassantTargetSquare = { row: (fromRow + toRow) / 2, col: fromCol, pieceColor: pieceColor };
                }

                // Pawn Promotion Check (remains the same)
                if (pieceType === 'P') {
                    const promotionRank = (pieceColor === 'w') ? 0 : 7;
                    if (toRow === promotionRank) {
                        // ... (pawn promotion logic: prompt and update boardState[toRow][toCol])
                        let promotedPieceType = '';
                        while (!['Q', 'R', 'B', 'N'].includes(promotedPieceType)) {
                            const choice = prompt("Pawn promotion! Choose piece (Q, R, B, N):", "Q");
                            if (choice === null) { promotedPieceType = 'Q'; break; }
                            promotedPieceType = choice.toUpperCase();
                        }
                        boardState[toRow][toCol] = pieceColor + promotedPieceType; // Update the already moved piece
                    }
                }

                currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
                deselectPiece();

                // if (originalPieceAtTarget) {
                //    console.log(`${selectedPieceCode} captures ${originalPieceAtTarget} at [${toRow},${toCol}]`);
                // }
                // Future: Call check/checkmate detection here
            } else {
                console.log(`Invalid move for ${selectedPieceCode} from [${fromRow},${fromCol}] to [${toRow},${toCol}]`);
            }

        } else {
            if (pieceOnClickedSquare) {
                const pieceColor = pieceOnClickedSquare.charAt(0); // Corrected variable name
                if ((currentPlayer === 'white' && pieceColor === 'w') ||
                    (currentPlayer === 'black' && pieceColor === 'b')) {
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
