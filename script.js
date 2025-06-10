document.addEventListener('DOMContentLoaded', () => {
    const chessboardContainer = document.getElementById('chessboard-container');
    const gameStatusDisplay = document.getElementById('game-status');
    const flipBoardBtn = document.getElementById('flip-board-btn');

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
    let castlingAvailability = {
        wK: true, wR_kingside: true, wR_queenside: true,
        bK: true, bR_kingside: true, bR_queenside: true
    };
    let enPassantTargetSquare = null;

    function renderBoard() {
        chessboardContainer.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const boardRow = isBoardFlipped ? 7 - r : r;
                const boardCol = isBoardFlipped ? 7 - c : c;
                const square = document.createElement('div');
                square.classList.add('square', (r + c) % 2 === 0 ? 'light' : 'dark');
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
        for (let boardRow = 0; boardRow < 8; boardRow++) {
            for (let boardCol = 0; boardCol < 8; boardCol++) {
                const pieceCode = boardState[boardRow][boardCol];
                if (pieceCode) {
                    const squareElement = chessboardContainer.querySelector(`[data-row='${boardRow}'][data-col='${boardCol}']`);
                    if (squareElement) {
                        const pieceElement = document.createElement('span');
                        pieceElement.classList.add('piece', pieceCode.startsWith('w') ? 'white-piece' : 'black-piece');
                        pieceElement.textContent = getPieceUnicode(pieceCode);
                        squareElement.appendChild(pieceElement);
                    }
                }
            }
        }
    }

    function updateStatus() {
        let statusText = `${currentPlayer === 'white' ? 'سفید' : 'سیاه'} نوبت`;
        if (selectedPiece) {
            statusText += ` - انتخاب شده: ${getPieceUnicode(selectedPiece.piece)} در [${selectedPiece.row}, ${selectedPiece.col}]`;
        }
        gameStatusDisplay.textContent = statusText;
    }

    function isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceColor, targetPiece) {
        const direction = pieceColor === 'w' ? -1 : 1;
        const startRow = pieceColor === 'w' ? 6 : 1;
        if (toRow === fromRow + direction && toCol === fromCol && !targetPiece) {
            return true;
        }
        if (fromRow === startRow && toRow === fromRow + 2 * direction && toCol === fromCol && !targetPiece && !boardState[fromRow + direction][fromCol]) {
            return true;
        }
        if (toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1 && targetPiece) {
            return true;
        }
        if (enPassantTargetSquare &&
            toRow === enPassantTargetSquare.row &&
            toCol === enPassantTargetSquare.col &&
            Math.abs(fromCol - toCol) === 1 &&
            toRow === fromRow + direction &&
            !targetPiece &&
            enPassantTargetSquare.pieceColor !== pieceColor &&
            fromRow === (enPassantTargetSquare.row - direction)) {
            return true;
        }
        return false;
    }

    function isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        if (fromRow === toRow) {
            const startCol = Math.min(fromCol, toCol) + 1;
            const endCol = Math.max(fromCol, toCol);
            for (let col = startCol; col < endCol; col++) {
                if (boardState[fromRow][col]) return false;
            }
        } else {
            const startRow = Math.min(fromRow, toRow) + 1;
            const endRow = Math.max(fromRow, toRow);
            for (let row = startRow; row < endRow; row++) {
                if (boardState[row][fromCol]) return false;
            }
        }
        return true;
    }

    function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1);
    }

    function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        if (rowDiff !== colDiff || rowDiff === 0) return false;
        const dRow = (toRow - fromRow) / rowDiff;
        const dCol = (toCol - fromCol) / colDiff;
        let currentRow = fromRow + dRow;
        let currentCol = fromCol + dCol;
        while (currentRow !== toRow) {
            if (boardState[currentRow][currentCol]) return false;
            currentRow += dRow;
            currentCol += dCol;
        }
        return true;
    }

    function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return isValidRookMove(fromRow, fromCol, toRow, toCol) || isValidBishopMove(fromRow, fromCol, toRow, toCol);
    }

    function isValidKingMove(fromRow, fromCol, toRow, toCol, pieceColor) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0)) return true;
        const originalKingRow = pieceColor === 'w' ? 7 : 0;
        if (fromRow === originalKingRow && fromCol === 4 && rowDiff === 0 && colDiff === 2) {
            if (toCol === 6 && castlingAvailability[pieceColor + 'K'] && castlingAvailability[pieceColor + 'R_kingside']) {
                if (!boardState[fromRow][5] && !boardState[fromRow][6]) return true;
            } else if (toCol === 2 && castlingAvailability[pieceColor + 'K'] && castlingAvailability[pieceColor + 'R_queenside']) {
                if (!boardState[fromRow][3] && !boardState[fromRow][2] && !boardState[fromRow][1]) return true;
            }
        }
        return false;
    }

    function isMoveValid(pieceCode, fromRow, fromCol, toRow, toCol, pieceOnTargetSquare) {
        const pieceType = pieceCode.substring(1);
        const pieceColor = pieceCode.charAt(0);
        switch (pieceType) {
            case 'P': return isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceColor, pieceOnTargetSquare);
            case 'R': return isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'N': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'B': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'Q': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'K': return isValidKingMove(fromRow, fromCol, toRow, toCol, pieceColor);
            default: return false;
        }
    }

    function handleSquareClick(event) {
        const clickedSquareElement = event.target.closest('.square');
        if (!clickedSquareElement) return;

        const toRow = parseInt(clickedSquareElement.dataset.row);
        const toCol = parseInt(clickedSquareElement.dataset.col);
        const pieceOnClickedSquare = boardState[toRow][toCol];

        if (selectedPiece) {
            const { piece: selectedPieceCode, row: fromRow, col: fromCol } = selectedPiece;
            const pieceColor = selectedPieceCode.charAt(0);

            if (fromRow === toRow && fromCol === toCol) {
                deselectPiece();
                return;
            }

            if (pieceOnClickedSquare && pieceOnClickedSquare.charAt(0) === pieceColor) {
                selectPiece(toRow, toCol, pieceOnClickedSquare);
                return;
            }

            if (isMoveValid(selectedPieceCode, fromRow, fromCol, toRow, toCol, pieceOnClickedSquare)) {
                const pieceType = selectedPieceCode.substring(1);
                const pieceColor = selectedPieceCode.charAt(0);

                let isEnPassantCapture = false;
                if (pieceType === 'P' &&
                    enPassantTargetSquare &&
                    toRow === enPassantTargetSquare.row &&
                    toCol === enPassantTargetSquare.col &&
                    !boardState[toRow][toCol] &&
                    Math.abs(fromCol - toCol) === 1) {
                    isEnPassantCapture = true;
                }

                boardState[toRow][toCol] = selectedPieceCode;
                boardState[fromRow][fromCol] = null;

                if (isEnPassantCapture) {
                    const capturedPawnRow = pieceColor === 'w' ? toRow + 1 : toRow - 1;
                    boardState[capturedPawnRow][toCol] = null;
                }

                if (pieceType === 'K' && Math.abs(fromCol - toCol) === 2) {
                    let rookFromCol, rookToCol, rookPieceCode;
                    if (toCol === 6) {
                        rookFromCol = 7;
                        rookToCol = 5;
                        castlingAvailability[pieceColor + 'R_kingside'] = false;
                    } else if (toCol === 2) {
                        rookFromCol = 0;
                        rookToCol = 3;
                        castlingAvailability[pieceColor + 'R_queenside'] = false;
                    }
                    rookPieceCode = pieceColor + 'R';
                    boardState[fromRow][rookToCol] = rookPieceCode;
                    boardState[fromRow][rookFromCol] = null;
                }

                if (pieceType === 'K') {
                    castlingAvailability[pieceColor + 'K'] = false;
                } else if (pieceType === 'R') {
                    const originalRookRow = pieceColor === 'w' ? 7 : 0;
                    if (fromRow === originalRookRow) {
                        if (fromCol === 0) castlingAvailability[pieceColor + 'R_queenside'] = false;
                        if (fromCol === 7) castlingAvailability[pieceColor + 'R_kingside'] = false;
                    }
                }

                enPassantTargetSquare = null;
                if (pieceType === 'P' && Math.abs(fromRow - toRow) === 2) {
                    enPassantTargetSquare = { row: (fromRow + toRow) / 2, col: fromCol, pieceColor };
                }

                if (pieceType === 'P') {
                    const promotionRank = pieceColor === 'w' ? 0 : 7;
                    if (toRow === promotionRank) {
                        let promotedPieceType = '';
                        while (!['Q', 'R', 'B', 'N'].includes(promotedPieceType)) {
                            const choice = prompt('ارتقای پیاده! انتخاب کنید (Q, R, B, N):', 'Q');
                            promotedPieceType = choice ? choice.toUpperCase() : 'Q';
                        }
                        boardState[toRow][toCol] = pieceColor + promotedPieceType;
                    }
                }

                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                deselectPiece();
            } else {
                console.log(`حرکت نامعتبر برای ${selectedPieceCode} از [${fromRow},${fromCol}] به [${toRow},${toCol}]`);
            }
        } else {
            if (pieceOnClickedSquare) {
                const pieceColor = pieceOnClickedSquare.charAt(0);
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

    if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', () => {
            isBoardFlipped = !isBoardFlipped;
            renderBoard();
        });
    } else {
        console.error('دکمه چرخاندن صفحه پیدا نشد!');
    }

    chessboardContainer.addEventListener('click', handleSquareClick);
    renderBoard();
});
