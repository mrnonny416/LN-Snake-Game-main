// ส่วนเริ่มต้น: ตั้งค่าตัวแปรหลักสำหรับเกม
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");
let snake = [{ x: 10, y: 10 }];
let dx = 1, dy = 0;
let fruit = spawnFruit();
let collected = 0;
let timer;
let startTime;
let gameOver = false;
let finalElapsed = 0;
let playCount = 0;
let maxPlays = 3;
let playTimes = []; // ✅ เก็บเวลาแต่ละรอบ

// ฟังก์ชันสุ่มผลไม้ใหม่
function spawnFruit() {
  return {
    x: Math.floor(Math.random() * 20),
    y: Math.floor(Math.random() * 20)
  };
}

// แปลง ms เป็นเวลาแบบ 00:00.000
function formatTime(ms) {
  const mins = String(Math.floor(ms / 60000)).padStart(2, '0');
  const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const mils = String(ms % 1000).padStart(3, '0');
  return `${mins}:${secs}.${mils}`;
}

// วาดเกมในทุกเฟรม
function draw() {
  if (gameOver) return;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 400, 400);

  ctx.fillStyle = "lime";
  snake.forEach(s => ctx.fillRect(s.x * 20, s.y * 20, 20, 20));

  ctx.fillStyle = "red";
  ctx.fillRect(fruit.x * 20, fruit.y * 20, 20, 20);

  const head = {
    x: (snake[0].x + dx + 20) % 20,
    y: (snake[0].y + dy + 20) % 20
  };
  snake.unshift(head);

  if (head.x === fruit.x && head.y === fruit.y) {
    collected++;
    const collect = document.getElementById("collectSound");
    if (collect) {
      collect.currentTime = 0;
      collect.play();
    }
    updateProgress();
    if (collected >= 10) return endGame(); //จำนวนผลไม้
    fruit = spawnFruit();
  } else {
    snake.pop();
  }
}

// แสดงเวลาแบบ real-time
function updateTimer() {
  if (gameOver) {
    document.getElementById("timerDisplay").innerText = formatTime(finalElapsed);
  } else {
    const elapsed = Date.now() - startTime;
    document.getElementById("timerDisplay").innerText = formatTime(elapsed);
  }
}

function endGame() {
  clearInterval(timer);
  gameOver = true;
  finalElapsed = Date.now() - startTime;
  playTimes.push(finalElapsed); // ✅ บันทึกเวลาแต่ละรอบ

  document.getElementById("progressDisplay").style.display = "none";
  document.getElementById("bgm").pause();

  const victorySound = document.getElementById("victorySound");
  if (victorySound) {
    victorySound.currentTime = 0;
    victorySound.play();
  }
  document.body.classList.add("victory-mode");

  const overlay = document.getElementById("overlay");
  overlay.innerHTML = "";
  overlay.style.display = "flex";

  const msg1 = document.createElement("div");
  msg1.innerText = "⚡ เกมงูสายฟ้า";
  msg1.style.fontSize = "25px";
  msg1.style.marginBottom = "30px";
  msg1.style.lineHeight = "1.2";
  overlay.appendChild(msg1);

  const msg = document.createElement("div");
  msg.innerText = "ยินดีด้วย ! คุณเก็บครบทั้ง 21 ลูก";
  msg.style.fontSize = "20px";
  msg.style.lineHeight = "1.2";
  msg.style.marginBottom = "10px";
  overlay.appendChild(msg);

  const timeUsed = document.createElement("div");
  timeUsed.innerText = `คุณใช้เวลา ${formatTime(finalElapsed)}`;
  timeUsed.style.lineHeight = "1.2";
  timeUsed.style.marginBottom = "20px";
  overlay.appendChild(timeUsed);

  if (playCount < maxPlays - 1) {
    const restartBtn = document.createElement("button");
    restartBtn.innerText = `ReStart ${playCount + 1}/${maxPlays}`;
    restartBtn.onclick = () => {
      document.getElementById("progressDisplay").style.display = "block";
      overlay.style.display = "none";
      playCount++;
      collected = 0; // ✅ รีเซ็ตผลไม้ที่เก็บใหม่
      updateProgress(); // ✅ แสดงผลไม้ 0 / 21 ใหม่
      startGame();
    };
    overlay.appendChild(restartBtn);

    const endBtn = document.createElement("button");
    endBtn.innerText = "End Game";
    endBtn.onclick = () => showScoreInput();
    overlay.appendChild(endBtn);
  } else {
    showScoreInput();
  }
  // ✅ ดึงข้อมูล leaderboard แล้วแสดงใน overlay โดยตรง
  fetch("http://localhost:3000/leaderboard")
    .then(res => res.json())
    .then(data => {
      const scores = data.leaderboard;
      const board = document.createElement("div");
      board.id = "scoreboard";
      board.innerHTML = `<h2 style="text-align: center;">\ud83c\udfc6 \u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e1c\u0e39\u0e49\u0e40\u0e25\u0e48\u0e19 \ud83c\udfc6</h2>
        <div style="text-align: center;">* Reset \u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e17\u0e38\u0e01\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 21 \u0e02\u0e2d\u0e07\u0e17\u0e38\u0e01\u0e40\u0e14\u0e37\u0e2d\u0e19</div><br>` +
        scores.map((s, i) => {
          const mins = String(Math.floor(s.time / 60000)).padStart(2, '0');
          const secs = String(Math.floor((s.time % 60000) / 1000)).padStart(2, '0');
          const ms = String(s.time % 1000).padStart(3, '0');
          return `<div>${i + 1}. ${s.name} - ${mins}:${secs}.${ms}</div>`;
        }).join("");
      overlay.appendChild(board);
    })
    .catch(err => console.error("\u0e42\u0e2b\u0e25\u0e14\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e08\u0e32\u0e01 endGame:", err));
}


// แสดงผลไม้ที่เก็บได้
function updateProgress() {
  const display = document.getElementById("progressDisplay");
  if (display) display.innerText = `ผลไม้ที่เก็บได้: ${collected} / 21`;
}

// ✅ สำหรับสลับปุ่มเสียงและ toggle ! box
function toggleInfoBox() {
  const box = document.getElementById("infoBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// เปิดปิดเสียงเกม + ปรับ icon และข้อความ
let isMuted = false;
function toggleMute() {
  isMuted = !isMuted;
  const bgm = document.getElementById("bgm");
  const collect = document.getElementById("collectSound");
  const victory = document.getElementById("victorySound");
  if (bgm) bgm.muted = isMuted;
  if (collect) collect.muted = isMuted;
  if (victory) victory.muted = isMuted;

  const muteBtn = document.getElementById("muteToggle");
  muteBtn.innerText = isMuted ? "🔇 ปิด" : "🔊 เปิด";

}

// เริ่มเกมจริง (หลังจ่ายเงินแล้ว)
function startGame() {
  snake = [{ x: 10, y: 10 }];
  dx = 1; dy = 0;
  fruit = spawnFruit();
  collected = 0;
  gameOver = false;
  updateProgress(); //เริ่มจาก 0/21
  document.getElementById("progressDisplay").style.display = "block";
  startTime = Date.now();

  timer = setInterval(() => {
    draw();
    updateTimer();
  }, 150);

  const bgm = document.getElementById("bgm");
  if (bgm) {
    bgm.currentTime = 0;
    bgm.play();
  }
}

// เตรียมเริ่มเกม + แสดง invoice + ตรวจการจ่าย
async function prepareGameStart() {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("paywall").style.display = "flex";
  const invoiceBox = document.getElementById("invoiceBox");
  invoiceBox.innerText = "กำลังสร้าง invoice...";
  try {
    const res = await fetch("http://localhost:3000/create-invoice");
    const data = await res.json();
    const invoice = data.payment_request;
    const hash = data.payment_hash;

   
    // ✅ แสดง QR Code และข้อความ
    invoiceBox.innerHTML = `
      ⚡ โปรดชำระ Invoice นี้:<br><br>
      <img src="https://api.qrserver.com/v1/create-qr-code/?data=${invoice}&size=200x200" /><br>
      <code style="word-break: break-word;">${invoice}</code><br><br>
      (กำลังรอตรวจสอบการชำระเงิน...)
    `;
    const checkInterval = setInterval(async () => {
      const checkRes = await fetch(`http://localhost:3000/check-payment/${hash}`);
      const checkData = await checkRes.json();

      if (checkData.paid) {
        clearInterval(checkInterval);

        // ✅ แสดง Pay Succeed
        invoiceBox.innerHTML = `<span style="color:lime; font-weight:bold;">✅ Pay Succeed</span>`;

        // ✅ แสดงปุ่ม Start Now หลัง 1 วินาที
        setTimeout(() => {
          invoiceBox.innerHTML += `<br><br><button id="startNowBtn">▶️ Start Now</button>`;

          let countdown = 10;
          const countdownText = document.createElement("div");
          countdownText.style.marginTop = "10px";
          countdownText.style.color = "#ccc";
          invoiceBox.appendChild(countdownText);

          const countdownInterval = setInterval(() => {
            countdownText.innerText = `เริ่มเกมอัตโนมัติใน ${countdown} วินาที...`;
            if (countdown <= 0) {
              clearInterval(countdownInterval);
              document.getElementById("paywall").style.display = "none";
              startGame();
            }
            countdown--;
          }, 1000);

          document.getElementById("startNowBtn").addEventListener("click", () => {
            clearInterval(countdownInterval);
            document.getElementById("paywall").style.display = "none";
            startGame();
          });
          enableStartNowByEnter(); //เรียกฟังชั่น function enableStartNowByEnter() 
          
        }, 1000);
      }
    }, 1000);
  } catch (err) {
    invoiceBox.innerText = "เกิดข้อผิดพลาดในการสร้าง invoice";
    console.error(err);
  }
}

function enableStartNowByEnter() //กด enter แป้มพิมพ์ ได้
{ 
  document.addEventListener("keydown", function onEnterKey(e) { 
    if (e.key === "Enter") {
      const startNowBtn = document.getElementById("startNowBtn");
      if (startNowBtn && startNowBtn.offsetParent !== null) {
        startNowBtn.click();
        document.removeEventListener("keydown", onEnterKey);
      }
    }
  });
}


// กรอกชื่อผู้เล่นแล้วบันทึกลง backend
function submitScore() {
  const name = document.getElementById("playerName").value.trim();
  const selectedTime = parseInt(document.getElementById("timeSelector").value);
  if (!name || isNaN(selectedTime)) return;

  fetch("http://localhost:3000/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, time: selectedTime })
  })
    .then(res => res.json())
    .then(data => {
      drawScoreboard(data.leaderboard);
      document.getElementById("overlay").style.display = "none";
      showPostSubmitButtons();
    });
}

// ✅ ฟังก์ชันแสดงช่องกรอกชื่อผู้เล่น
function showScoreInput() {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = "";
  overlay.style.display = "flex";

  const msg = document.createElement("div");
  msg.innerText = "ยินดีด้วย ! คุณเก็บครบทั้ง 21 ลูก";
  msg.style.fontSize = "20px";
  overlay.appendChild(msg);

  //เลือกเวลา
  const timeLabel = document.createElement("div");
  timeLabel.innerText = "เลือกเวลาที่ดีที่สุด";
  overlay.appendChild(timeLabel);

  const select = document.createElement("select");
  select.id = "timeSelector";
  select.style.padding = "6px";
  select.style.margin = "6px auto";
  playTimes.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.text = `รอบ ${i + 1}: ${formatTime(t)}`;
    select.appendChild(opt);
  });
  overlay.appendChild(select);
  //const time = document.createElement("div");
  //time.innerHTML = `คุณใช้เวลา <span id='finalTime'>${formatTime(finalElapsed)}</span>`;
  //overlay.appendChild(time);

  // input name
  const input = document.createElement("input");
  input.id = "playerName";
  input.placeholder = "ใส่ Lightning Wallet ของคุณ";
  input.style.padding = "10px";
  overlay.appendChild(input);

  // ปุ่ม Enter
  const submit = document.createElement("button");
  submit.innerText = "Enter";
  submit.onclick = submitScore;
  overlay.appendChild(submit);

  // ให้พิมพ์ชื่อแล้วกด Enter ได้ด้วย
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") submitScore();
  });
}

// ✅ เพิ่มเมื่อส่งคะแนนแล้ว แสดงปุ่ม New Game
function showPostSubmitButtons() {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = "";
  overlay.style.display = "flex";

  const btn = document.createElement("button");
  btn.innerText = "New Game";
  btn.onclick = () => window.location.reload();
  overlay.appendChild(btn);
} 

// แสดงอันดับ leaderboard
function drawScoreboard(scores) {
  const board = document.getElementById("scoreboard");
  if (!scores || scores.length === 0) {
    board.innerHTML = board.innerHTML = `<h2>🏆 อันดับผู้เล่น 🏆</h2><p style="text-align: center;">ยังไม่มีข้อมูล</p>`;;
    return;
  }
  board.innerHTML = `<h2>🏆 อันดับผู้เล่น </h2><div>* Reset อันดับทุกวันที่ 21 ของทุกเดือน</div><br>` +
    scores.map((s, i) => {
      const mins = String(Math.floor(s.time / 60000)).padStart(2, '0');
      const secs = String(Math.floor((s.time % 60000) / 1000)).padStart(2, '0');
      const ms = String(s.time % 1000).padStart(3, '0');
      return `<div>${i + 1}. ${s.name} - ${mins}:${secs}.${ms}</div>`;
    }).join("");
}

function loadLeaderboard() {
  fetch("http://localhost:3000/leaderboard")
    .then(res => res.json())
    .then(data => {
      drawScoreboard(data.leaderboard);
    });
}

// ✅ โหลด leaderboard เมื่อเปิดเกม
loadLeaderboard();

window.addEventListener("DOMContentLoaded", () => {
  fetchPool();
  loadLeaderboard();
});

// ✅ ป้องกัน scroll เวลากดลูกศรควบคุมงู
document.addEventListener("keydown", e => {
  const key = String(e.key).toLowerCase();
  // Prevent page scroll for arrows and WASD
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    e.preventDefault();
  }

  if ((key === "arrowup" || key === "w") && dy === 0) {
    dx = 0; dy = -1;
  } else if ((key === "arrowdown" || key === "s") && dy === 0) {
    dx = 0; dy = 1;
  } else if ((key === "arrowleft" || key === "a") && dx === 0) {
    dx = -1; dy = 0;
  } else if ((key === "arrowright" || key === "d") && dx === 0) {
    dx = 1; dy = 0;
  }
});
