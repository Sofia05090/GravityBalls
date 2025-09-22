const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const mazeSizeSelect = document.getElementById("mazeSize");
const sensitivityInput = document.getElementById("sensitivity");

let maze, cellSize, player, goal;
let dx = 0, dy = 0;
let sensitivity = 5;

// Laberinto con backtracking
function generateMaze(size) {
  let maze = [];
  for (let i = 0; i < size; i++) {
    maze[i] = [];
    for (let j = 0; j < size; j++) {
      maze[i][j] = { visited: false, top: true, right: true, bottom: true, left: true };
    }
  }

  function carve(x, y) {
    maze[x][y].visited = true;
    let dirs = ["up","right","down","left"].sort(()=>Math.random()-0.5);

    for (let dir of dirs) {
      let nx = x, ny = y;
      if (dir === "up") nx--;
      if (dir === "down") nx++;
      if (dir === "left") ny--;
      if (dir === "right") ny++;

      if (nx >= 0 && ny >= 0 && nx < size && ny < size && !maze[nx][ny].visited) {
        if (dir === "up") { maze[x][y].top = false; maze[nx][ny].bottom = false; }
        if (dir === "down") { maze[x][y].bottom = false; maze[nx][ny].top = false; }
        if (dir === "left") { maze[x][y].left = false; maze[nx][ny].right = false; }
        if (dir === "right") { maze[x][y].right = false; maze[nx][ny].left = false; }
        carve(nx, ny);
      }
    }
  }
  carve(0, 0);
  return maze;
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      let x = j * cellSize;
      let y = i * cellSize;
      let cell = maze[i][j];
      if (cell.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+cellSize, y); ctx.stroke(); }
      if (cell.right) { ctx.beginPath(); ctx.moveTo(x+cellSize, y); ctx.lineTo(x+cellSize, y+cellSize); ctx.stroke(); }
      if (cell.bottom) { ctx.beginPath(); ctx.moveTo(x, y+cellSize); ctx.lineTo(x+cellSize, y+cellSize); ctx.stroke(); }
      if (cell.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y+cellSize); ctx.stroke(); }
    }
  }

  // Meta
  ctx.fillStyle = "lime";
  ctx.fillRect(goal.x*cellSize+cellSize/4, goal.y*cellSize+cellSize/4, cellSize/2, cellSize/2);

  // Jugador
  ctx.beginPath();
  ctx.arc(player.x, player.y, cellSize/4, 0, Math.PI*2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function updatePlayer() {
  let nextX = player.x + dx * (sensitivity / 5);
  let nextY = player.y + dy * (sensitivity / 5);

  let i = Math.floor(player.y / cellSize);
  let j = Math.floor(player.x / cellSize);

  // Colisiones
  if (dy < 0 && maze[i][j].top && player.y - cellSize/4 <= i*cellSize) dy = 0;
  if (dy > 0 && maze[i][j].bottom && player.y + cellSize/4 >= (i+1)*cellSize) dy = 0;
  if (dx < 0 && maze[i][j].left && player.x - cellSize/4 <= j*cellSize) dx = 0;
  if (dx > 0 && maze[i][j].right && player.x + cellSize/4 >= (j+1)*cellSize) dx = 0;

  player.x = Math.max(cellSize/4, Math.min(canvas.width - cellSize/4, nextX));
  player.y = Math.max(cellSize/4, Math.min(canvas.height - cellSize/4, nextY));

  // Ganar
  if (Math.floor(player.x/cellSize) === goal.x && Math.floor(player.y/cellSize) === goal.y) {
    alert("¡Ganaste!");
    startGame();
  }
}

function gameLoop() {
  updatePlayer();
  drawMaze();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const size = parseInt(mazeSizeSelect.value);
  maze = generateMaze(size);
  cellSize = canvas.width / size;
  player = { x: cellSize/2, y: cellSize/2 };
  goal = { x: size-1, y: size-1 };
  sensitivity = parseInt(sensitivityInput.value);
  dx = 0; dy = 0;
  drawMaze();
}

// === Movimiento por giroscopio ===
function enableGyroscope() {
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    // iOS
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        } else {
          alert("Se necesita permiso para usar el giroscopio.");
        }
      })
      .catch(console.error);
  } else {
    // Android y otros
    window.addEventListener("deviceorientation", handleOrientation);
  }
}

function handleOrientation(event) {
  dx = event.gamma / 10; // izquierda-derecha
  dy = event.beta / 10;  // adelante-atrás
}

// Botón de inicio
startButton.addEventListener("click", () => {
  enableGyroscope();
  startGame();
  gameLoop();
});
