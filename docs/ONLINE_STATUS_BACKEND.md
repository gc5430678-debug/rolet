# حالة الاتصال (النقطة الخضراء)

النقطة الخضراء تظهر تحت صورة المستخدم عندما يكون **مفتوحاً للتطبيق**. عند إغلاق أو تصغير التطبيق تختفي فوراً.

## كيف يعمل التطبيق

| الحدث | ما يحدث |
|-------|---------|
| المستخدم يفتح التطبيق | يستدعي `POST /api/auth/online` فوراً + كل 2 ثانية (نبض) |
| المستخدم يغلق/يُصغّر التطبيق | يستدعي `POST /api/auth/offline` فوراً — النقطة تختفي مباشرة |
| المستخدم يرجع للتطبيق | يستدعي `/online` فوراً ويعيد النبض |

## ما يحتاجه الخادم

### 1. POST /api/auth/online

عند كل استدعاء:
- استخرج `userId` من التوكن
- احفظ `lastSeenAt = now` للمستخدم

**مثال Redis:**
```js
await redis.set(`online:${userId}`, "1", "EX", 5); // TTL 5 ثوانٍ (احتياطي للإغلاق القسري)
```

### 2. POST /api/auth/offline

عند استدعاءه — احذف المستخدم من قائمة المتصلين فوراً:
```js
await redis.del(`online:${userId}`);
```

### 3. TTL قصير

استخدم TTL 5 ثوانٍ كحد أقصى — لو أُغلق التطبيق قسرياً دون استدعاء `/offline`، النقطة تختفي خلال 5 ثوانٍ.

### 4. GET /api/auth/online-users

```
Authorization: Bearer <token>

Response: { "success": true, "userIds": ["id1", "id2", ...] }
```

أرجع `userIds` للمستخدمين الموجودين في Redis (مفتاح `online:*`).

## بديل: تضمين الحالة في Inbox

بدلاً من endpoint منفصل، أضف `otherIsOnline` لكل عنصر في `GET /api/messages/inbox`:

```json
{
  "success": true,
  "messages": [
    {
      "id": "...",
      "otherId": "...",
      "otherName": "...",
      "otherIsOnline": true,
      ...
    }
  ]
}
```

التطبيق يدعم كلا الأسلوبين.
