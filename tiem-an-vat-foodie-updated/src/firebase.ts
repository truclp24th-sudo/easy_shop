import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

// Cấu hình Firebase - lấy từ biến môi trường (VITE_ để Vite expose ra frontend)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// QUAN TRỌNG: ignoreUndefinedProperties: true giúp Firestore tự bỏ qua các trường có giá trị
// "undefined" (ví dụ: để trống ô không bắt buộc như hạn dùng, giới hạn lượt dùng mã giảm giá...)
// thay vì NÉM LỖI và làm trắng trang. Mặc định Firestore KHÔNG chấp nhận undefined.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
