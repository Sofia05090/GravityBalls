/* script.js - Laberinto con movimiento por giroscopio */

// Elementos DOM
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const sizeSelect = document.getElementById('sizeSelect');
const newMazeBtn = document.getElementById('newMaze');
const statusEl = document.getElementById('status');
const finishEl = document.getElementById('finish');
const speedRange = document.getElementById('speedRange');

let cols = parseInt(sizeSelect.value);
let rows = cols;
let cellSize;
let maze;
let ball;
let goal;
let sensitivity = parseFloat(speedRange.value);
let lastTime = 0;

// Ajuste de canvas
function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(rect.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', ()=>{ resizeCanvas(); draw(); });

// Celda de laberinto
function Cell(i,j){
  this.i=i;this.j=j;
  this.walls={top:true,right:true,bottom:true,left:true};
  this.visited=false;
}
Cell.prototype.neighbors=function(grid){
  const {i,j}=this;const list=[];
  const pushIf=(ni,nj,dir)=>{if(ni>=0&&ni<cols&&nj>=0&&nj<rows) list.push({cell:grid[nj][ni],dir});}
  pushIf(i,j-1,'top');pushIf(i+1,j,'right');pushIf(i,j+1,'bottom');pushIf(i-1,j,'left');
  return list;
}

// Generación de laberinto DFS
function generateMaze(c,r){
  cols=c;rows=r;
  const grid=[];for(let j=0;j<rows;j++){const row=[];for(let i=0;i<cols;i++) row.push(new Cell(i,j));grid.push(row);}
  const stack=[];const start=grid[0][0];start.visited=true;stack.push(start);
  while(stack.length){
    const current=stack[stack.length-1];
    const neighbors=current.neighbors(grid).filter(n=>!n.cell.visited);
    if(neighbors.length){
      const pick=neighbors[Math.floor(Math.random()*neighbors.length)];
      if(pick.dir==='top'){current.walls.top=false;pick.cell.walls.bottom=false;}
      if(pick.dir==='right'){current.walls.right=false;pick.cell.walls.left=false;}
      if(pick.dir==='bottom'){current.walls.bottom=false;pick.cell.walls.top=false;}
      if(pick.dir==='left'){current.walls.left=false;pick.cell.walls.right=false;}
      pick.cell.visited=true;stack.push(pick.cell);
    }else stack.pop();
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)grid[j][i].visited=false;
  return grid;
}

// Inicialización
function init(){
  cols=parseInt(sizeSelect.value);rows=cols;
  maze=generateMaze(cols,rows);resizeCanvas();
  const w=canvas.width/devicePixelRatio;const h=canvas.height/devicePixelRatio;
  cellSize=Math.min(w/cols,h/rows);
  ball={x:cellSize*0.5,y:cellSize*0.5,r:Math.max(4,cellSize*0.2),vx:0,vy:0};
  goal={i:cols-1,j:rows-1};
  finishEl.classList.add('hidden');
  statusEl.textContent='Permite movimiento del dispositivo para empezar';
}

// Dibujo
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const width=canvas.width/devicePixelRatio;const height=canvas.height/devicePixelRatio;
  const offsetX=(width-cols*cellSize)/2;const offsetY=(height-rows*cellSize)/2;
  ctx.save();ctx.translate(offsetX,offsetY);ctx.lineWidth=Math.max(1,cellSize*0.06);ctx.strokeStyle='rgba(255,255,255,0.9)';
  for(let j=0;j<rows;j++){for(let i=0;i<cols;i++){const c=maze[j][i];const x=i*cellSize,y=j*cellSize;
    ctx.fillStyle='#02172a';ctx.fillRect(x,y,cellSize,cellSize);ctx.beginPath();
    if(c.walls.top){ctx.moveTo(x,y);ctx.lineTo(x+cellSize,y);}
    if(c.walls.right){ctx.moveTo(x+cellSize,y);ctx.lineTo(x+cellSize,y+cellSize);}
    if(c.walls.bottom){ctx.moveTo(x+cellSize,y+cellSize);ctx.lineTo(x,y+cellSize);}
    if(c.walls.left){ctx.moveTo(x,y+cellSize);ctx.lineTo(x,y);}ctx.stroke();}}
  ctx.fillStyle='rgba(125,211,252,0.18)';
  ctx.fillRect(goal.i*cellSize+cellSize*0.12,goal.j*cellSize+cellSize*0.12,cellSize*0.76,cellSize*0.76);
  ctx.beginPath();ctx.fillStyle='#7dd3fc';ctx.arc(ball.x+offsetX,ball.y+offsetY,ball.r,0,Math.PI*2);ctx.fill();ctx.restore();
}

// Física básica
function clampBall(){
  ball.x=Math.max(ball.r,Math.min(cols*cellSize-ball.r,ball.x));
  ball.y=Math.max(ball.r,Math.min(rows*cellSize-ball.r,ball.y));
  const cx=Math.floor(ball.x/cellSize);const cy=Math.floor(ball.y/cellSize);
  if(cx<0||cy<0||cx>=cols||cy>=rows)return;
  const cell=maze[cy][cx];const localX=ball.x-cx*cellSize;const localY=ball.y-cy*cellSize;const pad=ball.r;
  if(cell.walls.top&&localY-pad<0){ball.y=cy*cellSize+pad;ball.vy=0;}
  if(cell.walls.bottom&&localY+pad>cellSize){ball.y=cy*cellSize+(cellSize-pad);ball.vy=0;}
  if(cell.walls.left&&localX-pad<0){ball.x=cx*cellSize+pad;ball.vx=0;}
  if(cell.walls.right&&localX+pad>cellSize){ball.x=cx*cellSize+(cellSize-pad);ball.vx=0;}
}
function update(dt){
  ball.vx*=0.995;ball.vy*=0.995;
  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;clampBall();
  const bxCell=Math.floor(ball.x/cellSize),byCell=Math.floor(ball.y/cellSize);
  if(bxCell===goal.i&&byCell===goal.j){finishEl.classList.remove('hidden');statusEl.textContent='¡Completado!';}
}
function loop(ts){
  if(!lastTime)lastTime=ts;const dt=(ts-lastTime)/16.666;lastTime=ts;
  update(dt);draw();requestAnimationFrame(loop);
}

// Giroscopio
function handleOrientation(e){
  const g=e.gamma||0,b=e.beta||0;
  const ax=(g/45)*sensitivity,ay=(b/45)*sensitivity;
  const scale=cellSize*0.4;
  ball.vx+=ax*scale;ball.vy+=ay*scale;
  statusEl.textContent='Control por giroscopio activo';
}

// Fallback teclado
window.addEventListener('keydown',ev=>{
  const speed=cellSize*0.25;
  if(ev.key==='ArrowLeft')ball.vx-=speed;
  if(ev.key==='ArrowRight')ball.vx+=speed;
  if(ev.key==='ArrowUp')ball.vy-=speed;
  if(ev.key==='ArrowDown')ball.vy+=speed;
});

// Fallback touch
let dragging=false,lastTouch=null;
canvas.addEventListener('pointerdown',e=>{dragging=true;lastTouch={x:e.clientX,y:e.clientY};});
window.addEventListener('pointerup',()=>{dragging=false;lastTouch=null});
window.addEventListener('pointermove',e=>{
  if(!dragging)return;
  const dx=e.clientX-lastTouch.x,dy=e.clientY-lastTouch.y;
  ball.vx+=dx*0.1;ball.vy+=dy*0.1;lastTouch={x:e.clientX,y:e.clientY};
});

// UI
newMazeBtn.addEventListener('click',()=>{init();});
sizeSelect.addEventListener('change',()=>{init();});
speedRange.addEventListener('input',e=>{sensitivity=parseFloat(e.target.value);});

// Permiso iOS
function enableDeviceOrientation(){
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission().then(response=>{
      if(response==='granted'){window.addEventListener('deviceorientation',handleOrientation);statusEl.textContent='Permiso concedido. Inclina tu dispositivo.';}
      else statusEl.textContent='Permiso denegado: usa teclado o arrastre.';
    }).catch(()=>{statusEl.textContent='Error solicitando permiso';});
  }else{window.addEventListener('deviceorientation',handleOrientation);statusEl.textContent='Control por giroscopio listo. Inclina el dispositivo.';}
}
init();requestAnimationFrame(loop);
canvas.addEventListener('click',()=>{enableDeviceOrientation();});
if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){statusEl.textContent='Toca el canvas para activar el giroscopio (iOS)';}
