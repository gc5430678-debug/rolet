# الهدايا والذهب المجاني وجواهر المرسل (0.10%)

## المطلوب في الباك اند

### 1. تخزين الذهب المجاني (في الباك اند فقط)

الذهب المجاني (من مهمة 5 رسائل، تسجيل الدخول، إلخ) يُخزن في **الباك اند** في `freeGold` — لا تخزين محلي.  
انظر `TASK_5_MESSAGES_BACKEND.md` و `BACKEND_CLAIM_TASK_IMPLEMENTATION.js`.

---

### 2. إرسال هدية — خصم من freeGold أولاً

عند إرسال هدية، يُخصم الذهب من المحفظة (المخزنة في الباك اند) بهذا الترتيب:
1. **أولاً من freeGold** (المجاني)
2. **ثانياً من chargedGold** (المشحون) إذا لم يكفِ المجاني

مثال: المستخدم لديه 20 مجاني و 100 مشحون، يرسل هدية 25 ذهب:
- يُخصم 20 من freeGold
- يُخصم 5 من chargedGold

---

### 3. جواهر المرسل (0.10%)

عند إرسال هدية بنجاح، يُمنح **المرسل** جواهر (diamonds) بقيمة **0.10%** من قيمة الهدية.

| قيمة الهدية | جواهر المرسل (0.10%) |
|-------------|----------------------|
| 10 ذهب      | 0.01                 |
| 100 ذهب     | 0.10                 |
| 500 ذهب     | 0.50                 |
| 1000 ذهب    | 1.00                 |

---

## واجهة POST /api/messages/send

التطبيق يرسل عند إرسال هدية:

```json
{
  "toUserId": "...",
  "text": "GIFT:peacock:500",
  "giftAmount": 500
}
```

- `text` بصيغة `GIFT:نوع_الهدية:القيمة`
- `giftAmount` قيمة الهدية بالذهب (اختياري، يمكن استخراجها من text)

---

## المنطق المطلوب في الباك اند

```
1. استخرج userId (المرسل) من التوكن
2. إذا text يبدأ بـ "GIFT:" أو giftAmount موجود:
   أ. تحقق من رصيد المرسل (freeGold + chargedGold >= giftAmount)
   ب. اخصم من freeGold أولاً، ثم chargedGold
   ج. أضف giftAmount للمستلم (أو حسب منطقك)
   د. احسب: diamondsForSender = giftAmount * 0.001  (0.10%)
   هـ. أضف diamondsForSender إلى diamonds في محفظة المرسل
3. احفظ الرسالة
4. أرجع الاستجابة
```

---

## مثال كود (Node.js + Prisma)

```js
// عند استلام رسالة هدية
if (text?.startsWith("GIFT:") || body.giftAmount) {
  const amount = body.giftAmount ?? parseInt(text.split(":")[2], 10) || 0;
  if (amount > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const total = (wallet?.freeGold ?? 0) + (wallet?.chargedGold ?? 0);
    if (total < amount) {
      return res.status(400).json({ success: false, message: "رصيد غير كافٍ" });
    }

    const takeFromFree = Math.min(wallet.freeGold ?? 0, amount);
    const takeFromCharged = amount - takeFromFree;

    await prisma.wallet.update({
      where: { userId },
      data: {
        freeGold: { decrement: takeFromFree },
        chargedGold: { decrement: takeFromCharged },
        totalGold: { decrement: amount },
        diamonds: { increment: amount * 0.001 },  // 0.10% للمرسل
      },
    });

    // أضف الذهب للمستلم (toUserId)
    await prisma.wallet.update({
      where: { userId: toUserId },
      data: {
        freeGold: { increment: amount },
        totalGold: { increment: amount },
      },
    });
  }
}
```

---

## ملاحظات

- **0.10%** = `0.001` في الكود (1% = 0.01)
- الجواهر تُضاف للمرسل فقط، وليس للمستلم
- الذهب المجاني يُستخدم أولاً عند الخصم
