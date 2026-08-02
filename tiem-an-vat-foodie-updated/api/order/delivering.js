import { getTransporter, getFrom, setCorsHeaders, itemsListHtml } from "../_lib/mailer.js";

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

    await transporter.sendMail({
      from: getFrom(),
      to: order.customerEmail,
      subject: `🚚 Đơn hàng ${order.id} đang được giao`,
      html: `
        <h2>🚚 Đơn hàng đang được giao</h2>
        <p>Xin chào <b>${order.customerName}</b>,</p>
        <p>Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển.</p>
        <hr>
        <p><b>Mã đơn:</b> ${order.id}</p>
        <p><b>Sản phẩm:</b></p>
        <ul>
          ${itemsListHtml(order.items)}
        </ul>
        <p><b>Tổng tiền:</b> ${order.total.toLocaleString()} VNĐ</p>
        <hr>
        <h3 style="color:#0ea5e9;">
          🚚 Trạng thái: Đang giao hàng
        </h3>
        <p>Vui lòng để ý điện thoại để nhận hàng.</p>
        <br>
        <p>❤️ EasyShop cảm ơn bạn đã mua sắm!</p>
      `,
    });

    console.log("✅ Đã gửi email đang giao cho đơn", order.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi gửi email /api/order/delivering:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
