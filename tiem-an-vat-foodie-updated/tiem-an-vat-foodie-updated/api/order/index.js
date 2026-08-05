import { getTransporter, getFrom, setCorsHeaders } from "../_lib/mailer.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const order = req.body;

  try {
    const transporter = getTransporter();
    const from = getFrom();

    // ================= Email cho Admin =================
    await transporter.sendMail({
      from,
      to: process.env.MAIL_ADMIN || process.env.MAIL_USER,
      subject: `🛒 Đơn hàng mới ${order.id}`,
      html: `
        <h2>📦 Có đơn hàng mới</h2>
        <p><b>Mã đơn:</b> ${order.id}</p>
        <p><b>Khách hàng:</b> ${order.customerName}</p>
        <p><b>Email:</b> ${order.customerEmail}</p>
        <p><b>SĐT:</b> ${order.customerPhone}</p>
        <p><b>Địa chỉ:</b> ${order.customerAddress}</p>
        <p><b>Ghi chú:</b> ${order.customerNotes || "Không có"}</p>
        <p><b>Tổng tiền:</b> ${order.total.toLocaleString()} VNĐ</p>
        <hr>
        <h3>Sản phẩm</h3>
        <ul>
          ${order.items
            .map(
              (item) => `
                <li>
                  ${item.productName}
                  - SL: ${item.quantity}
                  - ${item.price.toLocaleString()}đ
                </li>
              `
            )
            .join("")}
        </ul>
      `,
    });

    // ================= Email cho Khách =================
    await transporter.sendMail({
      from,
      to: order.customerEmail,
      subject: "🎉 Đặt hàng thành công",
      html: `
  <h2>🎉 Cảm ơn bạn đã đặt hàng tại EasyShop ❤️</h2>
  <p>Xin chào <b>${order.customerName}</b>,</p>
  <p>Đơn hàng của bạn đã được ghi nhận thành công.</p>
  <hr>
  <p><b>Mã đơn:</b> ${order.id}</p>
  <p><b>Sản phẩm:</b></p>
  <ul>
    ${order.items
      .map(
        (item) => `
          <li>
            ${item.productName} <b>x${item.quantity}</b>
          </li>
        `
      )
      .join("")}
  </ul>
  <p><b>Tổng tiền:</b> ${order.total.toLocaleString()} VNĐ</p>
  <hr>
  <h3 style="color:orange;">🟡 Trạng thái đơn hàng: Chờ xác nhận</h3>
  <p>Shop sẽ xác nhận đơn hàng trong thời gian sớm nhất.</p>
  <br>
  <p>❤️ Cảm ơn bạn đã mua sắm tại EasyShop!</p>
`,
    });

    console.log("✅ Đã gửi email Admin + Khách cho đơn", order.id);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Lỗi gửi email /api/order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
