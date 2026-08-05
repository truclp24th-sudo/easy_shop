import { getTransporter, getFrom, getSiteUrl, setCorsHeaders } from "../_lib/mailer.js";

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
    const siteUrl = getSiteUrl();

    await transporter.sendMail({
      from: getFrom(),
      to: order.customerEmail,
      subject: `⭐ Đơn hàng ${order.id} đã được giao thành công`,
      html: `
        <h2>🎉 Giao hàng thành công!</h2>
        <p>Xin chào <b>${order.customerName}</b>,</p>
        <p>EasyShop rất vui vì đơn hàng của bạn đã được giao thành công.</p>
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
        <h3 style="color:green;">
          ⭐ Trạng thái: Đã giao thành công
        </h3>
        <p>Cảm ơn bạn đã tin tưởng và mua sắm tại EasyShop.</p>
        <p>Hy vọng sẽ tiếp tục được phục vụ bạn trong những đơn hàng tiếp theo. ❤️</p>
        <br>
        <p>
  Nếu hài lòng với sản phẩm, hãy để lại đánh giá để giúp cửa hàng ngày càng phát triển nhé!
</p>

${order.items
  .map(
    (item) => `
  <p style="margin:18px 0;">
    <b>${item.productName}</b><br>
    <a
      href="${siteUrl}/?product=${item.productId}&order=${order.id}"
      style="
        display:inline-block;
        margin-top:8px;
        padding:12px 24px;
        background:#ff9800;
        color:white;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;">
      ★★★★★ Đánh giá ${item.productName}
    </a>
  </p>
`
  )
  .join("")}
      `,
    });

    console.log("✅ Đã gửi email giao hàng thành công cho đơn", order.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi gửi email /api/order/completed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
