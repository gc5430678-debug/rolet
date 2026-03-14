# دليل إطارات البروفايل الفخمة

## الإطارات المتوفرة حالياً

1. **بدون إطار** — عرض الصورة بدون إطار
2. **ذهبي متحرك** — إطار ذهبي مع تأثير shimmer متحرك
3. **بنفسجي VIP** — إطار بنفسجي مع نبض خفيف
4. **أزرق ملكي** — إطار أزرق مع نبض خفيف

## إضافة إطارات Lottie (مثل SVIP في الصورة)

للحصول على إطارات فخمة مثل الصورة (أسود وأبيض، أسود وأحمر مع رموز):

1. **تحميل من LottieFiles**
   - اذهب إلى [lottiefiles.com/free-animations/profile-frame](https://lottiefiles.com/free-animations/profile-frame)
   - أو ابحث عن "VIP frame" أو "profile border"
   - حمّل ملف JSON

2. **وضع الملف**
   - أنشئ مجلد `rolet/assets/animations/frames/`
   - ضع الملف باسم `vip-frame.json` (أو أي اسم)

3. **تحديث الكود**
   - في `ProfileFrameView.tsx` أضف دعم `lottie-vip1`
   - في `frameStorage.ts` أضف `lottie-vip1` إلى `FrameId` و `VALID_FRAMES`
   - في `DecorationsScreen` أضف خيار الإطار الجديد

## ملاحظة

الإطارات Lottie تحتاج أن يكون مركز الإطار شفافاً لعرض صورة البروفايل تحته. ابحث عن إطارات مصممة للبروفايل (profile frame / avatar border).
