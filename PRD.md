Chào bạn, tôi đã nắm rõ yêu cầu của bạn. Chúng ta sẽ thay đổi kiến trúc từ PostgreSQL sang **MongoDB** để tận dụng khả năng ghi dữ liệu (Write-heavy) cực nhanh và cấu trúc Document linh hoạt, kết hợp với chiến lược **Offline-first** để đạt tốc độ tra cứu < 100ms.

Dưới đây là phương án tối ưu hóa toàn diện cho hệ thống **SPEED-PRICE**.

---

## 1. Kiến trúc Dữ liệu Tối ưu Tốc độ (High-Speed Architecture)

Để đạt tốc độ "không độ trễ", chúng ta sẽ sử dụng mô hình kết hợp:

* **Write Path:** Client -> MongoDB Atlas (via Mongoose/Prisma) để lưu trữ vĩnh viễn.
* **Read Path:** IndexedDB (Local) -> Phục vụ tra cứu tức thì ngay cả khi mất mạng.

### Cấu trúc Document MongoDB (BSON)

Tôi sẽ lược bỏ các quan hệ phức tạp, ưu tiên **Flatten Data** để query một lần là có đủ thông tin.

```javascript
// Collection: products
{
  _id: ObjectId(),
  barcode: "8934567890123", // Đánh Index Unique & Hashed
  name: "Sữa đặc Ông Thọ đỏ 380g",
  search_slug: "sua dac ong tho do 380g 8934567890123", // Để tìm kiếm không dấu siêu tốc
  prices: {
    retail: 25000,
    wholesale: 23500
  },
  unit: "Lon",
  location: "Kệ A1-04",
  images: ["https://cdn.com/thumb_50.jpg"], // Chỉ lưu URL ảnh đã nén
  updatedAt: 1707900000000 // Timestamp để đồng bộ
}

```

---

## 2. Tối ưu UI/UX: Thiết kế "Một Chạm" (Thumb-Driven Design)

Vì đối tượng là nhân viên bán hàng di chuyển nhiều, UI phải tập trung vào khu vực **"Bottom Zone"** (nơi ngón cái dễ chạm tới).

* **Bottom Navigation Bar:**
* **Nút Quét (Giữa):** Lớn nhất, nổi bật để kích hoạt Camera ngay lập tức.
* **Ô Tìm kiếm:** Nằm ngay trên thanh điều hướng, không đặt ở đỉnh màn hình.


* **Kết quả dạng Card:** Hiển thị giá khổng lồ (Font size > 24px) để nhìn rõ trong môi trường kho bãi thiếu sáng.
* **Phản hồi xúc giác (Haptic Feedback):** Rung nhẹ khi quét thành công hoặc có lỗi.

---

## 3. Đặc tả Kỹ thuật cho AI Agent

Tôi sẽ cấu hình logic xử lý cho hệ thống như sau:

### A. Cơ chế Đồng bộ (The Sync Engine)

Sử dụng **Change Streams** của MongoDB để đẩy dữ liệu mới nhất về Client ngay khi có thay đổi (Real-time).

```typescript
// Logic tra cứu ưu tiên Local
async function fastSearch(query: string) {
  // 1. Tìm trong IndexedDB trước (Tốc độ ~1-5ms)
  const localResult = await db.products
    .where('barcode').equals(query)
    .or('search_slug').startsWithIgnoreCase(query)
    .toArray();

  if (localResult.length > 0) return localResult;

  // 2. Nếu không thấy, mới gọi API MongoDB (Fallback)
  return fetch(`/api/search?q=${query}`);
}

```

### B. Xử lý Nhập liệu Siêu tốc (Bulk & HID)

* **HID Listener:** Agent sẽ tạo một Global Listener để bắt sự kiện từ súng quét mã vạch (giả lập bàn phím). Nó sẽ tự động gom các ký tự nhận được trong khoảng thời gian < 50ms thành một mã vạch hoàn chỉnh mà không cần người dùng focus vào ô nhập.
* **MongoDB BulkWrite:** Khi nhập file Excel 10.000 dòng, sử dụng lệnh `db.collection.bulkWrite()` để xử lý trong 1 request duy nhất, giảm thiểu Round-trip thời gian thực.

---

## 4. Danh sách Công nghệ (Final Stack)

| Thành phần | Công nghệ lựa chọn | Lý do |
| --- | --- | --- |
| **Database** | **MongoDB Atlas** | Ghi dữ liệu cực nhanh, mở rộng linh hoạt. |
| **Frontend** | **Next.js 16 (PWA)** | Hỗ trợ Offline-first, cài đặt như App. |
| **Local DB** | **Dexie.js** | Wrapper cho IndexedDB tốt nhất hiện nay. |
| **Scan Lib** | **Canvas-based Scanner** | Tối ưu hóa FPS để nhận diện mã vạch trong < 0.5s. |
| **Styling** | **Tailwind CSS** | Giao diện gọn nhẹ, load cực nhanh. |
| **UI** | **Shadcn UI + framer-motion** | Giao diện gọn nhẹ, load cực nhanh. |
---

## 5. Các kịch bản xử lý lỗi (Edge Cases)

1. **Mã vạch lạ:** Nếu quét mã không có trong DB, hiện ngay Overlay: **"Mã mới: [123...] - Thêm nhanh?"**. Click vào sẽ tự động focus vào ô nhập giá, bàn phím số (Numeric) tự bật lên.
2. **Mạng chập chờn:** Toàn bộ dữ liệu nhập khi Offline sẽ được lưu vào một hàng đợi (Queue) trong IndexedDB và tự động `POST` lên MongoDB khi tín hiệu xanh trở lại.

> **Bạn có muốn tôi viết chi tiết mã nguồn cho Component "Smart Barcode Scanner" tích hợp với logic lưu trữ vào MongoDB không?**