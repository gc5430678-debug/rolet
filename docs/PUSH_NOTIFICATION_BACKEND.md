# إشعارات الدفع عند استلام رسالة جديدة

عند إرسال رسالة، التطبيق يرسل للخادم بيانات المرسل (`senderForNotification`) لاستخدامها في إشعار المستلم.

## ما يرسله التطبيق

في `POST /api/messages/send` الجسم يحتوي الآن على:

```json
{
  "toUserId": "...",
  "text": "...",
  "senderForNotification": {
    "senderName": "اسم المرسل",
    "senderProfileImageUrl": "https://..."
  }
}
```

- `senderName`: اسم المرسل (مطلوب للإشعار)
- `senderProfileImageUrl`: رابط صورة المرسل (اختياري) — رابط كامل للصورة

## ما يجب على الخادم فعله

عند استلام رسالة جديدة بنجاح:

1. **احصل على push token المستلم** من قاعدة البيانات (يُسجّل عبر `POST /api/auth/push-token`)
2. **أرسل إشعار Expo Push** إلى المستلم باستخدام:
   - **title**: اسم المرسل (`senderForNotification.senderName`)
   - **body**: معاينة الرسالة (أول 50 حرف مثلاً، أو "رسالة صوتية" / "صورة" حسب النوع)
   - **image**: صورة المرسل (`senderForNotification.senderProfileImageUrl`) — لظهورها في الإشعار على أندرويد
   - **data**: للتنقل عند الضغط، مثلاً `{ "screen": "chat", "otherId": "<fromUserId>" }`

## مثال طلب Expo Push API

```javascript
// بعد حفظ الرسالة بنجاح
const recipientPushToken = await getPushTokenForUser(toUserId);
if (!recipientPushToken) return;

const message = await saveMessage(...);
const sender = senderForNotification || { senderName: "شخص", senderProfileImageUrl: null };

// معاينة النص
let body = (text || "").slice(0, 50);
if (text?.startsWith("🎤")) body = "رسالة صوتية";
else if (text?.startsWith("GIFT:")) body = "هدية";
else if (imageUrl) body = "صورة";

await fetch("https://exp.host/--/api/v2/push/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: recipientPushToken,
    title: sender.senderName,
    body,
    sound: "default",
    channelId: "messages",
    priority: "high",
    data: { screen: "chat", otherId: fromUserId },
    ...(sender.senderProfileImageUrl && { image: sender.senderProfileImageUrl }),
  }),
});
```

## ملاحظات

- **Android**: الحقل `image` يعرض الصورة في الإشعار (Big Picture)
- **iOS**: قد تحتاج `mutableContent: true` لعرض صورة مخصصة عبر Notification Service Extension
- **قناة أندرويد**: التطبيق يستخدم `channelId: "messages"` — استخدم نفس القيمة
