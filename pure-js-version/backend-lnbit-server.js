// ✅ LNBits Backend Server v1.2 สำหรับ Snake Game
// รัน node backend-lnbit-server.js

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

// 🌟 Wallet สำหรับรับเงินจากผู้เล่น (ใช้สร้าง invoice และดึงยอดคงเหลือ)
const LNBits_Wallet1_Info = " https://lnbits.notoshi.win/api/v1/wallet";
const LNBits_Wallet1_ReadKey = ""; // 🔐 LNBits Wallet Read Key (ซ่อนบางส่วนเพื่อความปลอดภัย)
const LNBits_Wallet1_API = " https://lnbits.notoshi.win/api/v1/payments";

let invoiceStatus = {}; // เก็บสถานะการจ่ายเงินของแต่ละ invoice
let scores = [];        // เก็บอันดับคะแนนของผู้เล่น (top 10)

app.use(cors());
app.use(express.json());

// ✅ 1. สร้าง invoice สำหรับการจ่าย 100 sats
app.get("/create-invoice", async (req, res) => {
  try {
    const payload = {
      out: false,
      amount: 100,
      memo: "Unlock Snake Game"
    };

    const response = await axios.post(LNBits_Wallet1_API, payload, {
      headers: {
        "X-Api-Key": LNBits_Wallet1_ReadKey,
        "Content-Type": "application/json"
      }
    });

    const invoice = response.data;
    console.log("🔍 ค่า keys ทั้งหมดจาก LNBits:", Object.keys(invoice));

    //invoiceStatus[invoice.payment_hash] = false;
    res.json({
      //payment_request: invoice.payment_request,
      payment_request: invoice.bolt11,  // ✅ ใช้ bolt11 แทน
      payment_hash: invoice.payment_hash
    });
  } catch (err) {
    console.error("❌ สร้าง invoice ไม่สำเร็จ:", err.response?.data || err.message);
    res.status(500).json({ error: "สร้าง invoice ไม่สำเร็จ" });
  }
});



//✅ 2. ตรวจสอบการจ่าย invoice จริงจาก LNBits
app.get("/check-payment/:hash", async (req, res) => {
  const hash = req.params.hash;
  if (!hash) return res.status(400).json({ error: "ไม่มี payment hash" });

  try {
    const response = await axios.get(
      `https://lnbits.notoshi.win/api/v1/payments/${hash}`,
      {
        headers: {
         "X-Api-Key": LNBits_Wallet1_ReadKey
        }
      }
    );

    const paid = response.data.paid;
    res.json({ paid });
   } catch (err) {
    console.error("❌ ตรวจสถานะ invoice ไม่สำเร็จ:", err.response?.data || err.message);
    res.status(500).json({ error: "เช็คสถานะไม่สำเร็จ" });
  }
});


// ✅ 3. บันทึกคะแนนผู้เล่น (name + time)
app.post("/submit-score", (req, res) => {
  const { name, time } = req.body;
  if (!name || typeof time !== 'number') {
    return res.status(400).json({ error: "ต้องใส่ชื่อและเวลา" });
  }
  scores.push({ name, time });
  scores.sort((a, b) => a.time - b.time); // เรียงเวลาเร็วสุด
  scores = scores.slice(0, 10); // เก็บแค่ top 10
  res.json({ leaderboard: scores });
});

// ✅ 4. ส่งอันดับผู้เล่น
app.get("/leaderboard", (req, res) => {
  res.json({ leaderboard: scores });
});

// ✅ 5. แสดงยอด pool เฉพาะ 70% ของยอด wallet
app.get("/get-pool", async (req, res) => {
  try {
    const walletInfo = await axios.get(LNBits_Wallet1_Info, {
      headers: {
        "X-Api-Key": LNBits_Wallet1_ReadKey,
        "Content-Type": "application/json",
      },
    });
    const balance = walletInfo.data.balance; // หน่วย millisats
    const sats = Math.floor(balance / 1000);
    const seventyPercent = Math.max(0, Math.floor((sats - 100) * 0.7));
    res.json({ total: seventyPercent });
  } catch (err) {
    console.error("❌ Error fetching wallet balance:", err.message);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลยอดคงเหลือได้" });
  }
});

// ✅ เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`⚡ LNBits backend running at http://localhost:${PORT}`);
});
