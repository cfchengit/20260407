let points = [];
let gameState = 'START'; // 狀態機：'START', 'PLAYING', 'FAIL', 'WIN'
let passCount = 0;       // 記錄過關次數
let numPoints = 10;      // 設定產生 10 個點
let segmentWidth;        // 每一段通道的 X 軸寬度

function setup() {
  createCanvas(windowWidth, windowHeight); // 變更為全螢幕
  initGame(true);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 確保視窗縮放時維持全螢幕
}

function initGame(reset = false) {
  if (reset) passCount = 0; // 若選擇重置，將過關次數歸零
  points = [];
  gameState = 'START';
  segmentWidth = width / (numPoints - 1);
  
  // 產生 10 個點，X 座標依據全螢幕寬度等距分佈
  for (let i = 0; i < numPoints; i++) {
    let x = i * segmentWidth;
    let yTop = random(100, height - 100);
    
    // 難度機制：過關次數越多，通道寬度上限逐漸減少，但嚴格限制在 20 到 45 間
    let minGap = 80;
    let maxGap = max(80, 150 - passCount * 2);
    let gap = random(minGap, maxGap);
    let yBottom = yTop + gap;
    points.push({ x: x, yTop: yTop, yBottom: yBottom });
  }
}

function draw() {
  background(220);

  // 畫出安全區域(通道)，以利玩家辨識
  noStroke();
  fill(200, 255, 200);
  beginShape();
  // 加入畫布外的虛擬控制點，確保曲線兩端也能平滑，且維持完美的 X 軸等距
  curveVertex(-segmentWidth, points[0].yTop); 
  for (let p of points) curveVertex(p.x, p.yTop);
  curveVertex(width + segmentWidth, points[points.length - 1].yTop);
  
  curveVertex(width + segmentWidth, points[points.length - 1].yBottom);
  for (let i = points.length - 1; i >= 0; i--) curveVertex(points[i].x, points[i].yBottom);
  curveVertex(-segmentWidth, points[0].yBottom);
  endShape(CLOSE);

  // 用 curveVertex 指令畫出上方線條 (平滑曲線)
  stroke(0);
  strokeWeight(2);
  noFill();
  beginShape();
  curveVertex(-segmentWidth, points[0].yTop);
  for (let p of points) curveVertex(p.x, p.yTop);
  curveVertex(width + segmentWidth, points[points.length - 1].yTop);
  endShape();

  // 用 curveVertex 指令畫出下方線條
  beginShape();
  curveVertex(-segmentWidth, points[0].yBottom);
  for (let p of points) curveVertex(p.x, p.yBottom);
  curveVertex(width + segmentWidth, points[points.length - 1].yBottom);
  endShape();

  // 遊戲狀態機處理
  if (gameState === 'START') {
    // 開始畫面：在左側起點畫出開始按鈕區塊
    fill(0, 200, 0);
    noStroke();
    let startY = points[0].yTop;
    let startH = points[0].yBottom - startY;
    rect(0, startY, 30, startH); 

    fill(0);
    textAlign(LEFT, CENTER);
    textSize(16);
    text("點擊綠色區塊開始", 10, startY - 20);
  } else if (gameState === 'PLAYING') {
    // 畫出代表滑鼠位置的點
    fill(255, 0, 0);
    noStroke();
    circle(mouseX, mouseY, 6);
    
    // 每次畫面更新都確認是否碰到線條
    checkCollision();
  } else if (gameState === 'FAIL') {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("遊戲失敗！", width / 2, height / 2);
    textSize(16);
    text("點擊畫面重新開始", width / 2, height / 2 + 40);
  } else if (gameState === 'WIN') {
    fill(0, 0, 255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("遊戲成功！", width / 2, height / 2);
    textSize(16);
    text("點擊畫面進入下一關", width / 2, height / 2 + 40);
  }

  // 在左上角顯示目前過關次數
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(20);
  text("過關次數: " + passCount, 20, 20);
}

function checkCollision() {
  // 若滑鼠超出畫布範圍，視為失敗
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    gameState = 'FAIL';
    return;
  }

  // 成功條件：到達最右側的結束點
  if (mouseX >= width - 2) {
    gameState = 'WIN';
    return;
  }

  // 依據新計算的寬度判斷滑鼠所在的線段區間
  let i = Math.floor(mouseX / segmentWidth);
  if (i < 0) i = 0;
  if (i >= numPoints - 1) i = numPoints - 2;

  let p1 = points[i];
  let p2 = points[i + 1];

  // 取得前後控制點 (邏輯與繪圖時的虛擬控制點對齊)
  let p0_yTop = (i === 0) ? points[0].yTop : points[i - 1].yTop;
  let p0_yBottom = (i === 0) ? points[0].yBottom : points[i - 1].yBottom;
  let p3_yTop = (i === numPoints - 2) ? points[numPoints - 1].yTop : points[i + 2].yTop;
  let p3_yBottom = (i === numPoints - 2) ? points[numPoints - 1].yBottom : points[i + 2].yBottom;

  // 計算 X 軸在目前區段中的進度比例 (在等距控制點的 Catmull-Rom 曲線中，X(t) 具備完美的線性關係)
  let t = (mouseX - p1.x) / segmentWidth;
  // 使用 curvePoint 計算出目前 X 座標在曲線上所對應的精確 Y 座標
  let currentYTop = curvePoint(p0_yTop, p1.yTop, p2.yTop, p3_yTop, t);
  let currentYBottom = curvePoint(p0_yBottom, p1.yBottom, p2.yBottom, p3_yBottom, t);

  // 若滑鼠碰到或超出上下線條
  if (mouseY <= currentYTop || mouseY >= currentYBottom) {
    gameState = 'FAIL';
  }
}

function mousePressed() {
  if (gameState === 'START') {
    // 判斷是否點擊到左側起點 (綠色區塊) 才開始遊戲
    let startY = points[0].yTop;
    let startH = points[0].yBottom - startY;
    if (mouseX >= 0 && mouseX <= 30 && mouseY >= startY && mouseY <= startY + startH) {
      gameState = 'PLAYING';
    }
  } else if (gameState === 'FAIL') {
    // 失敗時，重置過關次數並重新開始
    initGame(true);
  } else if (gameState === 'WIN') {
    // 成功時，累積過關次數並進入下一關
    passCount++;
    initGame(false);
  }
}
