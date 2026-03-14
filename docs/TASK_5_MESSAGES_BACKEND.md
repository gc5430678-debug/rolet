# مهمة: أرسل 5 رسائل واحصل على ذهب مجاني

> ⚠️ **إذا ظهر خطأ 404:** الباك اند لا يحتوي على المسار `POST /api/wallet/claim-task-five-messages`.  
> انظر ملف `BACKEND_CLAIM_TASK_IMPLEMENTATION.js` لنسخ كود جاهز.  
> **الذهب المجاني والهدايا:** انظر `GIFT_AND_DIAMONDS_BACKEND.md` لتفاصيل استخدام الذهب المجاني في الهدايا و 0.10% جواهر للمرسل.

## المطلوب

عند إرسال المستخدم **5 رسائل** خلال اليوم، يُمنح **ذهب مجاني** — بنفس آلية **تسجيل الدخول الأسبوعي** (مكافآت متصاعدة، تخزين في `freeGold`).

- **التخزين:** في الباك اند فقط — `freeGold` في المحفظة (نفس مكان تسجيل الدخول)
- **لا تخزين محلي:** التطبيق لا يخزن الذهب محلياً
- **إرسال هدية:** يمكن استخدام الذهب المجاني في الهدايا — يُخصم من `freeGold` أولاً ثم `chargedGold` (انظر `GIFT_AND_DIAMONDS_BACKEND.md`)

## 1. واجهة حالة المهمة

```
GET /api/wallet/task-five-messages
Authorization: Bearer <token>

Response: {
  "success": true,
  "task": {
    "messagesSentToday": 0,   // عدد الرسائل المرسلة اليوم (0–5)
    "claimedToday": false,    // true إذا تم استلام 15 ذهب اليوم
    "reward": 15
  }
}
```

التطبيق يعرض "5 | X" حيث X باللون الأحمر حتى يصل لـ 5. عند claimedToday يعرض "تم تحصيل ✓" و "عد بكرى".

## 2. أين يُنفّذ منح المكافأة

داخل معالج `POST /api/messages/send` — **بعد حفظ الرسالة بنجاح فقط**.

⚠️ **مهم:** لا تُحسب الرسالة إلا إذا تم حفظها فعلياً في قاعدة البيانات. إذا فشل الحفظ أو رجع الخطأ، لا تُضف للعداد.

## المنطق

```
1. عند استلام رسالة جديدة:
   - احفظ الرسالة
   - استخرج fromId (المرسل) من التوكن

2. عدّ رسائل المرسل اليوم:
   - SELECT COUNT(*) FROM messages WHERE fromId = ? AND createdAt >= بداية_اليوم_UTC

3. إذا العدد = 5 (أي هذه الرسالة الخامسة):
   - أضف 15 إلى freeGold في المحفظة
   - UPDATE wallet SET freeGold = freeGold + 15, totalGold = totalGold + 15 WHERE userId = ?
   - (أو استخدم جدول منفصل للمحفظة حسب بنيتك)

4. أرجع الاستجابة كالمعتاد
```

## مكافآت متصاعدة (مثل تسجيل الدخول)

يمكن تطبيق مكافآت متصاعدة مثل تسجيل الدخول الأسبوعي:

| الرسالة | الذهب |
|---------|-------|
| 1       | 1     |
| 2       | 2     |
| 3       | 3     |
| 4       | 4     |
| 5       | 5     |
| **المجموع** | **15** |

أو مكافأة واحدة عند إكمال 5: **15 ذهب**.

## ملاحظات

- **بداية اليوم:** استخدم منتصف الليل UTC أو حسب منطقتك الزمنية.
- **التكرار:** المكافأة تُمنح مرة واحدة يومياً — عند إكمال 5 رسائل. لا تُمنح مرة أخرى حتى اليوم التالي.
- **freeGold vs chargedGold:** الذهب يُضاف إلى `freeGold` (مجاني) — نفس تخزين تسجيل الدخول.
- **totalGold:** يجب تحديثه أيضاً: `totalGold = freeGold + chargedGold`.
- **إرسال هدية:** الذهب المجاني يُستخدم أولاً عند إرسال هدية (انظر `GIFT_AND_DIAMONDS_BACKEND.md`).

## مثال كود (Node.js)

```js
// بعد حفظ الرسالة
const todayStart = new Date();
todayStart.setUTCHours(0, 0, 0, 0);

const count = await db.messages.count({
  where: {
    fromId: userId,
    createdAt: { gte: todayStart },
  },
});

if (count === 5) {
  await db.wallet.update({
    where: { userId },
    data: {
      freeGold: { increment: 15 },
      totalGold: { increment: 15 },
    },
  });
  // اختياري: إرجاع رسالة في الاستجابة
  // res.data.bonusTask = { task: "5_messages", reward: 15 };
}
```

## استجابة اختيارية للعميل

يمكن إرجاع حقل في `POST /api/messages/send` عند منح المكافأة:

```json
{
  "success": true,
  "message": { ... },
  "bonusTask": {
    "task": "5_messages",
    "reward": 15,
    "message": "مبروك! أكملت مهمة 5 رسائل وحصلت على 15 ذهب مجاني"
  }
}
```

التطبيق يمكنه عرض تنبيه للمستخدم عند استلام `bonusTask`.

---

## 3. مسار بديل: المطالبة عند عدم إرجاع bonusTask في send

إذا لم يُرجع `POST /api/messages/send` حقل `bonusTask`، سيستدعي التطبيق مساراً منفصلاً:

```
POST /api/wallet/claim-task-five-messages
Authorization: Bearer <token>
Content-Type: application/json
Body: {}

Response: {
  "success": true,
  "task": {
    "messagesSentToday": 5,
    "claimedToday": true,
    "reward": 15
  }
}
```

**المنطق المطلوب:**

1. استخرج `userId` من التوكن
2. عدّ رسائل المرسل اليوم: `SELECT COUNT(*) FROM messages WHERE fromId = ? AND createdAt >= بداية_اليوم_UTC`
3. إذا العدد >= 5 ولم يُستلم المستخدم المكافأة اليوم:
   - أضف 15 إلى `freeGold` و `totalGold`
   - ضع علامة في قاعدة البيانات (مثلاً جدول `task_claims` أو `claimedToday` في ملف المستخدم)
4. أرجع `success: true` و `task` كما في المثال

إذا استلم المستخدم المكافأة مسبقاً، أرجع `success: false` أو `claimedToday: true` في `task` دون إضافة ذهب.
