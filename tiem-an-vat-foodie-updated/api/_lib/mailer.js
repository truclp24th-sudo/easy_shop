import nodemailer from "nodemailer";

// ================= SMTP =================
// Transporter được tạo 1 lần và tái sử dụng giữa các lần gọi function
// (Vercel có thể "hâm nóng" lại cùng một instance function).
let transporter;

export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: Number(process.env.MAIL_PORT) === 465, // 465 = SSL, 587 = STARTTLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
}

export function getFrom() {
  return process.env.MAIL_FROM || `"EasyShop" <${process.env.MAIL_USER}>`;
}

// URL gốc của website, dùng để chèn link đánh giá sản phẩm trong email.
// Trên Vercel, VERCEL_URL được tự động cung cấp (không có https://).
// Có thể override bằng biến SITE_URL nếu dùng domain riêng.
export function getSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Cho phép gọi API từ trình duyệt (an toàn để giữ dù cùng domain)
export function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function itemsListHtml(items) {
  return items
    .map(
      (item) => `
        <li>
          ${item.productName} <b>x${item.quantity}</b>
        </li>
      `
    )
    .join("");
}
