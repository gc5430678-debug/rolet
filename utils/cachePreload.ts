/**
 * تحميل مسبق للكاش عند فتح التطبيق — يجلب كل البيانات المخزنة محلياً دفعة واحدة
 * ويُطلق جلباً متوازياً من الباك اند لملء الكاش بسرعة
 */
import { getCachedInbox, getCachedGroupChatMessages, fetchInbox, fetchGroupChatMessages } from "./messagesApi";
import { getCachedWallet, fetchWallet } from "./walletApi";
import { getCachedMoments, fetchMoments } from "./momentsApi";

let preloadStarted = false;
let backendPreloadStarted = false;

/** جلب كل البيانات من الباك اند بالتوازي — يملأ الكاش فوراً (يُصدّر للاستدعاء عند تسجيل الدخول) */
export function preloadFromBackend(): void {
  if (backendPreloadStarted) return;
  backendPreloadStarted = true;
  void Promise.all([
    fetchInbox(),
    fetchWallet(),
    fetchGroupChatMessages(),
    fetchMoments(),
  ]);
}

/** تشغيل التحميل المسبق مرة واحدة — يُستدعى عند دخول التطبيق الرئيسي */
export function preloadAppCache(): void {
  if (preloadStarted) return;
  preloadStarted = true;
  void Promise.all([
    getCachedInbox(),
    getCachedWallet(),
    getCachedMoments(),
    getCachedGroupChatMessages(),
  ]);
  preloadFromBackend();
}
