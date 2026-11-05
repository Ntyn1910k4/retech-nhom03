# Nhật ký kiểm tra chất lượng dữ liệu — 02/11/2026

## 1. Kiểm tra nguồn và mốc thời gian

- Lấy năm của bản ghi EPA từ `date_available_on_market`, không từ ngày chứng nhận.
- Giữ `year_basis` riêng cho năm model, năm phát hành, năm công bố và mốc có bán tại thị trường nguồn.
- Loại model chứng nhận có ký tự đại diện `*`, sản phẩm bị hủy, tin đồn và mục còn “coming soon” trong bản chụp GSMArena.
- Không suy luận năm ra mắt router từ phiên bản firmware OpenWrt. Nguồn OpenWrt đã khảo sát nhưng không được dùng để tạo năm trong danh mục cuối cùng.
- Nguồn TP-Link C3150/C5400 có dateline ghi nhầm 2015 trong thân bài; phần ngày xuất bản hiển thị **06/01/2016** và nội dung CES 2016. Năm lấy theo ngày xuất bản, không sao chép lỗi dateline.

## 2. Lỗi phân loại Coolpad được Agent kiểm tra chéo phát hiện

Agent phụ trách tài liệu kiểm tra thông số màn hình và phát hiện ba smartphone xuất hiện trong nhóm tablet của bản dựng trung gian: Coolpad Conjr (5.0 inch), Coolpad Cool 2 (5.7 inch), Coolpad Cool 3 Plus (5.71 inch).

**Nguyên nhân:** điều kiện kiểm tra chuỗi `'pad '` trong tên vô tình khớp phần cuối tên hãng `Coolpad`, dù tên này không có nghĩa là máy tính bảng.

**Điều chỉnh đã thực hiện:**

1. Bỏ điều kiện substring chung `'pad '`.
2. Dùng ranh giới từ cho `Tab`, `Tablet`, `Pad`, `Slate` và tên dòng tablet cụ thể như MediaPad, MatePad, ZenPad, Pixel C, Amazon Fire.
3. Kiểm tra chéo màn hình: tablet nhỏ hơn 6.5 inch và điện thoại có màn hình lớn bất thường được đưa vào danh sách rà soát.
4. Với thiết bị màn hình lớn chưa xác minh được loại, loại khỏi tập chọn thay vì ép thành điện thoại để đủ số lượng.
5. Tạo lại bộ chọn để giữ đúng 1.000 model có nguồn và đủ sáu nhóm.

Lỗi này có thật trong bản dựng trung gian và được sửa trong quá trình phối hợp giữa Agent dữ liệu và Agent tài liệu; không trình bày như một kiểm thử thành công ngay từ đầu.

## 3. Sửa cách đọc thông số sản phẩm từ trang nhà bán lẻ

Agent thu thập giá phát hiện trang Nuxt chứa cả thông số sản phẩm được chọn và sản phẩm so sánh cũ. Cách đọc rộng ban đầu lấy nhầm một số trường; ví dụ iPhone 17 Pro bị gắn mốc 09/2022 từ sản phẩm so sánh.

Agent sửa parser để giới hạn đúng khối thông số của sản phẩm được chọn. iPhone 17 Pro sau sửa có mốc 09/2025; nguồn Apple chính thức được dùng ưu tiên khi ghép model. Giá và URL quan sát gốc không bị tự sửa để khớp dữ liệu mong muốn.

## 4. Kết quả kiểm tra sau sửa

Kết quả máy đọc được nằm trong `DATA_VALIDATION.json`, gồm số kiểm tra thực sự chạy, đối chiếu model/năm với nguồn EPA và GSMArena, kiểm tra khóa duy nhất, ngày hợp lệ, liên kết nguồn, dòng giá và tính đồng nhất CSV/JSON. Bổ sung kiểm tra semantic nhóm thiết bị nằm trong `SEMANTIC_AUDIT.json`.

Các kiểm tra này xác nhận tính nhất quán cấu trúc và khả năng truy nguồn. Chúng không phải phép đo sai số dự đoán giá bán lại trong thực tế.

## Chuẩn hóa thông số Apple trước bàn giao

Đã làm sạch trường dung lượng của 27 model Apple: dừng trích xuất trước phần Model để loại mô tả theo sau. Không đổi model, ID, năm, giá hoặc nguồn. Đã chạy lại kiểm tra nguồn trên snapshot dữ kiện.
