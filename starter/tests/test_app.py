import app as app_module
import sudoku_logic


def test_index_page_renders(client):
    response = client.get('/')

    assert response.status_code == 200
    assert b'Sudoku Game' in response.data


def test_index_page_includes_dark_mode_toggle(client):
    response = client.get('/')

    assert response.status_code == 200
    assert b'theme-toggle' in response.data
    assert b'Dark Mode' in response.data


def test_new_game_returns_puzzle(client):
    response = client.get('/new?clues=30')

    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data['puzzle'], list)
    assert len(json_data['puzzle']) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in json_data['puzzle'])


def test_check_solution_requires_active_game(client):
    response = client.post('/check', json={'board': [[0] * sudoku_logic.SIZE for _ in range(sudoku_logic.SIZE)]})

    assert response.status_code == 400
    assert response.get_json()['error'] == 'No game in progress'


def test_check_solution_reports_incorrect_cells(client):
    puzzle, solution = sudoku_logic.generate_puzzle(35)
    app_module.CURRENT['puzzle'] = puzzle
    app_module.CURRENT['solution'] = solution

    response = client.post('/check', json={'board': solution})

    assert response.status_code == 200
    assert response.get_json()['incorrect'] == []


def test_hint_reveals_one_cell_and_tracks_usage(client):
    puzzle, solution = sudoku_logic.generate_puzzle(35)
    app_module.CURRENT['puzzle'] = puzzle
    app_module.CURRENT['solution'] = solution
    app_module.CURRENT['hints_used'] = 0

    response = client.post('/hint')

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['hints_used'] == 1
    assert len(json_data['revealed']) == 1
    row, col, value = json_data['revealed'][0]
    assert solution[row][col] == value
    assert app_module.CURRENT['puzzle'][row][col] == value
    assert app_module.CURRENT['puzzle'][row][col] != 0
    assert app_module.CURRENT['puzzle'][row][col] == solution[row][col]
