/**
 * كود جاهز لإضافة مسار POST /api/wallet/claim-task-five-messages
 * انسخ هذا الكود إلى مشروع الباك اند لديك
 *
 * التطبيق يستدعي هذا المسار عند إكمال 5 رسائل.
 * الذهب يُضاف إلى freeGold (نفس تخزين تسجيل الدخول) — يمكن استخدامه في الهدايا.
 */

// ========== مثال Express + Prisma ==========
/*
const REWARD = 15;

router.post("/api/wallet/claim-task-five-messages", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id; // من التوكن بعد فك التشفير
    if (!userId) {
      return res.json({ success: false });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // عد رسائل المرسل اليوم
    const count = await prisma.message.count({
      where: {
        fromId: userId,
        createdAt: { gte: todayStart },
      },
    });

    if (count < 5) {
      return res.json({
        success: false,
        task: { messagesSentToday: count, claimedToday: false, reward: REWARD },
      });
    }

    // تحقق: هل استلم المكافأة اليوم؟
    const taskClaim = await prisma.taskClaim.findFirst({
      where: {
        userId,
        taskType: "five_messages",
        claimedAt: { gte: todayStart },
      },
    });

    if (taskClaim) {
      return res.json({
        success: false,
        task: { messagesSentToday: count, claimedToday: true, reward: REWARD },
      });
    }

    // إضافة 15 ذهب مجاني
    await prisma.wallet.update({
      where: { userId },
      data: {
        freeGold: { increment: REWARD },
        totalGold: { increment: REWARD },
      },
    });

    // تسجيل الاستلام
    await prisma.taskClaim.create({
      data: {
        userId,
        taskType: "five_messages",
        reward: REWARD,
        claimedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      task: { messagesSentToday: count, claimedToday: true, reward: REWARD },
    });
  } catch (err) {
    console.error("claim-task-five-messages error:", err);
    return res.status(500).json({ success: false });
  }
});
*/

// ========== مثال Express + MongoDB ==========
/*
router.post("/api/wallet/claim-task-five-messages", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json({ success: false });

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const count = await db.collection("messages").countDocuments({
      fromId: userId,
      createdAt: { $gte: todayStart },
    });

    if (count < 5) {
      return res.json({ success: false, task: { messagesSentToday: count, claimedToday: false, reward: 15 } });
    }

    const existing = await db.collection("task_claims").findOne({
      userId,
      taskType: "five_messages",
      claimedAt: { $gte: todayStart },
    });

    if (existing) {
      return res.json({ success: false, task: { messagesSentToday: count, claimedToday: true, reward: 15 } });
    }

    await db.collection("wallets").updateOne(
      { userId },
      { $inc: { freeGold: 15, totalGold: 15 } }
    );

    await db.collection("task_claims").insertOne({
      userId,
      taskType: "five_messages",
      reward: 15,
      claimedAt: new Date(),
    });

    return res.json({ success: true, task: { messagesSentToday: count, claimedToday: true, reward: 15 } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});
*/

// ========== نسخة بسيطة بدون جدول task_claims ==========
// إذا كان جدول wallet يحتوي على حقل lastFiveMessagesClaim (تاريخ آخر استلام):
/*
router.post("/api/wallet/claim-task-five-messages", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json({ success: false });

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const count = await prisma.message.count({
      where: { fromId: userId, createdAt: { gte: todayStart } },
    });

    if (count < 5) {
      return res.json({ success: false, task: { messagesSentToday: count, claimedToday: false, reward: 15 } });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (wallet?.lastFiveMessagesClaim && new Date(wallet.lastFiveMessagesClaim) >= todayStart) {
      return res.json({ success: false, task: { messagesSentToday: count, claimedToday: true, reward: 15 } });
    }

    await prisma.wallet.update({
      where: { userId },
      data: {
        freeGold: { increment: 15 },
        totalGold: { increment: 15 },
        lastFiveMessagesClaim: new Date(),
      },
    });

    return res.json({ success: true, task: { messagesSentToday: count, claimedToday: true, reward: 15 } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});
*/

// ملاحظة: أضف عمود lastFiveMessagesClaim (DateTime) لجدول wallet إذا لم يكن موجوداً
