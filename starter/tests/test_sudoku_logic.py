import sudoku_logic


def test_create_empty_board_has_correct_size():
    board = sudoku_logic.create_empty_board()

    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(cell == sudoku_logic.EMPTY for row in board for cell in row)


def test_generate_puzzle_returns_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert isinstance(puzzle, list)
    assert isinstance(solution, list)
    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)


def test_generate_puzzle_has_unique_solution():
    puzzle, _ = sudoku_logic.generate_puzzle(35)

    assert sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle), 2) == 1


def test_solution_is_valid_complete_board():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert sudoku_logic.fill_board(solution)


def test_is_safe_prevents_conflicts():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 1

    assert sudoku_logic.is_safe(board, 0, 1, 1) is False
    assert sudoku_logic.is_safe(board, 1, 0, 1) is False
    assert sudoku_logic.is_safe(board, 0, 1, 2) is True
