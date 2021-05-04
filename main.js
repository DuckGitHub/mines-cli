const grid = [];
const gridStatus = [];

const UNCOVER_CELL = {
  TRUE: 0x10,
  FALSE: 0x20,
};

const DEFAULT_ROWS = 8;
const DEFAULT_COLUMNS = 8;
const MODE_CLICK = 1;
const MODE_LOAD = 2;

const MARK_CELL = {
  NONE: 0x1,
  FLAG: 0x2,
  DOUBTFUL: 0x4,

  ANY: 0x7,
};

const GAME_STATUS = {
  ACTIVE: 0x1,
  WIN: 0x2,
  OVER: 0x4,
};

let GAME_ID;
let GAME_ACTIVE = true;

// const BASE_URL = "http://localhost:3000/api/game";

const BASE_URL = "https://ajjse67o0i.execute-api.us-east-2.amazonaws.com/production/api/game";

window.oncontextmenu = function () {
  return false;
};

const newGame = () => {
  const loadGameForm = document.querySelector(".load-game");
  const newGameBtn = document.querySelector(".new-game");

  const rows = parseInt(document.getElementById("count-rows").value);
  const cols = parseInt(document.getElementById("count-cols").value);

  loadGameForm.style.display = "none";
  newGameBtn.style.display = "none";

  loadNewTable(
    isNaN(rows) ? DEFAULT_ROWS : rows,
    isNaN(cols) ? DEFAULT_COLUMNS : rows
  );
};

const loadNewTable = async (rows, columns) => {
  const response = await fetch(`${BASE_URL}/new/${rows}/${columns}`);
  const { id, error, mines } = await response.json();

  const game = document.getElementById("game");

  if (error) {
    game.innerHTML = errorMsg(error);
    return;
  }

  GAME_ID = id;

  game.innerHTML = gameTitle(id, mines);

  initializeGame(game, rows, columns);
};

const loadGame = async () => {
  const gameId = document.getElementById("game-id").value;
  const formLoad = document.querySelector(".form-load-game");
  const newGame = document.querySelector(".new-game");

  const response = await fetch(`${BASE_URL}/${gameId}`);
  const { found, table, rows, columns, id, mines } = await response.json();

  if (!found) {
    const msgError = document.getElementById("error-msg");

    if (msgError) return;
    formLoad.innerHTML += errorMsg("NOT FOUND GAME");
    return;
  }

  formLoad.style.display = "none";
  newGame.style.display = "none";

  GAME_ID = id;

  const game = document.getElementById("game");

  console.log(gameTitle(gameId, mines));

  game.innerHTML = gameTitle(gameId, mines);

  updateGrid(game, table, MODE_LOAD, rows, columns);
};

const primaryClick = async (id) => {
  const [fil, col] = id.split("-");
  const index = grid.indexOf(id);

  if (gridStatus[index] & (MARK_CELL.FLAG | UNCOVER_CELL.TRUE) || !GAME_ACTIVE)
    return;

  const response = await fetch(`${BASE_URL}/${GAME_ID}/${fil}/${col}`);

  const {
    table,
    rows,
    columns,
    status,
    mines,
    id: gameId,
  } = await response.json();

  const game = document.getElementById("game");

  game.innerHTML = gameTitle(gameId, mines);

  updateGrid(game, table, MODE_LOAD, rows, columns);
  checkGameStatus(game, status);
};

const secondaryClick = async (id) => {
  const button = document.getElementById(id);
  const [fil, col] = id.split("-");
  const index = grid.indexOf(id);

  if (gridStatus[index] & UNCOVER_CELL.TRUE || !GAME_ACTIVE) return;

  await fetch(`${BASE_URL}/${GAME_ID}/rc/${fil}/${col}`);

  const cellMark = gridStatus[index] & MARK_CELL.ANY;

  switch (cellMark) {
    case MARK_CELL.NONE:
      gridStatus[index] &= ~MARK_CELL.NONE;
      gridStatus[index] |= MARK_CELL.FLAG;
      break;
    case MARK_CELL.FLAG:
      gridStatus[index] &= ~MARK_CELL.FLAG;
      gridStatus[index] |= MARK_CELL.DOUBTFUL;
      break;
    case MARK_CELL.DOUBTFUL:
      gridStatus[index] &= ~MARK_CELL.DOUBTFUL;
      gridStatus[index] |= MARK_CELL.NONE;
      break;
    default:
      break;
  }

  button.className = "mark-" + (gridStatus[index] & MARK_CELL.ANY);
};

const initializeGame = (game, rows, columns) => {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const button = document.createElement("button");
      button.id = `${i}-${j}`;
      button.setAttribute("oncontextmenu", "secondaryClick(id)");
      button.setAttribute("onclick", "primaryClick(id)");
      button.className = "cell";
      game.appendChild(button);
      grid.push(`${i}-${j}`);
      gridStatus.push(UNCOVER_CELL.FALSE | MARK_CELL.NONE);
    }
    const br = document.createElement("br");
    game.appendChild(br);
  }
};

const updateGrid = (game, table, mode, rows, columns) => {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const button = document.createElement("button");
      button.id = `${i}-${j}`;
      button.setAttribute("oncontextmenu", "secondaryClick(id)");
      button.setAttribute("onclick", "primaryClick(id)");
      button.className = "mines-" + table[i][j];
      game.appendChild(button);
      if (String(table[i][j]).includes("?")) {
        const status = parseInt(table[i][j].split("-")[1]);
        grid.push(`${i}-${j}`);
        gridStatus.push(status);
        button.className = "mark-" + (status & MARK_CELL.ANY);
        continue;
      }
      if (mode === MODE_CLICK) {
        grid.push(`${i}-${j}`);
        gridStatus.push(UNCOVER_CELL.FALSE | MARK_CELL.NONE);
      } else if (mode === MODE_LOAD) {
        const index = grid.indexOf(`${i}-${j}`);
        gridStatus[index] = UNCOVER_CELL.TRUE;
      }
    }
    const br = document.createElement("br");
    game.appendChild(br);
  }
};

const gameTitle = (gameId, mines) => {
  return `
 <h1>GAME ID: <span>${gameId}</span></h1>
 <h1>MINES: ${mines}</h1>
 `;
};

const checkGameStatus = (game, status) => {
  if (status === GAME_STATUS.WIN) {
    game.innerHTML += `<br><br><br><h1 style="color: green">WIN!!!</h1>`;
    GAME_ACTIVE = false;
  } else if (status === GAME_STATUS.OVER) {
    game.innerHTML += `<br><br><br><h1 style="color: red">GAME OVER!!!</h1>`;
    GAME_ACTIVE = false;
  }
};

const errorMsg = (error) =>
  `<h1 id="error-msg" style="color:red"><span>${error}</span></h1>`;
