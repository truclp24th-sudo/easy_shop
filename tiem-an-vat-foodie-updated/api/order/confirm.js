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
      subject: `✅ Đơn hàng ${order.id} đã được xác nhận`,
      html: `
  <h2>🎉 Đơn hàng của bạn đã được xác nhận</h2>
  <p>Xin chào <b>${order.customerName}</b>,</p>
  <p>Đơn hàng của bạn đã được cửa hàng xác nhận và đang chuẩn bị để giao.</p>
  <hr>
  <p><b>Mã đơn:</b> ${order.id}</p>
  <p><b>Sản phẩm:</b></p>
  <ul>
    ${itemsListHtml(order.items)}
  </ul>
  <p><b>Tổng tiền:</b> ${order.total.toLocaleString()} VNĐ</p>
  <hr>
  <h3 style="color:green;">🟢 Trạng thái đơn hàng: Đã xác nhận</h3>
  <p>📦 Đơn hàng đang được chuẩn bị. Chúng tôi sẽ sớm bàn giao cho đơn vị vận chuyển.</p>
  <br>
  <p>❤️ Cảm ơn bạn đã mua sắm tại EasyShop!</p>
`,
    });

    console.log("✅ Đã gửi email xác nhận cho đơn", order.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi gửi email /api/order/confirm:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
