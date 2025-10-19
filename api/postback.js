import express from "express";
import admin from "firebase-admin";

const app = express();

// ✅ Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "earn-captcha-bot-latest",
      clientEmail: "firebase-adminsdk@earn-captcha-bot-latest.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

app.get("/api/postback", async (req, res) => {
  try {
    const { subid, reward } = req.query;
    if (!subid || !reward) {
      return res.status(400).send("Missing subid or reward");
    }

    // 🔢 Convert reward in USD → Coins (1 USD = 5000 coins)
    const usd = parseFloat(reward);
    const coins = Math.round(usd * 5000);

    // 🔥 Update Firestore user balance
    const userRef = db.collection("users").doc(subid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).send("User not found");
    }

    const newBalance = (userSnap.data().balance || 0) + coins;
    await userRef.update({ balance: newBalance });

    console.log(`✅ ${coins} coins added to ${subid}`);
    res.send("OK");
  } catch (e) {
    console.error(e);
    res.status(500).send("Error updating coins");
  }
});

export default app;
