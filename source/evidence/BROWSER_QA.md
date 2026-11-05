# Kiểm tra giao diện thực tế

Thực hiện ngày 02/11/2026 bằng trình duyệt trên bản preview của ứng dụng.

| Nội dung | Quan sát thực tế |
|---|---|
| Trang chủ desktop | Logo, điều hướng, ảnh model thật, danh mục sáu nhóm và danh sách thiết bị hiển thị; không còn giao diện starter |
| Tìm kiếm | Nhập iPhone 16 Pro Max, kết quả còn đúng một hồ sơ Apple iPhone 16 Pro Max |
| Chi tiết | Mở model, xem năm 2024, mã máy, thông số và liên kết Apple Support; có quan sát CellphoneS đúng tình trạng |
| Định giá | Mẫu cũ đẹp 256GB có giá nguồn 26.490.000 đồng; giá gợi ý 26.490.000 đồng; dải quy tắc 25.170.000 đến 27.810.000 đồng; nguồn và ngày hiện rõ |
| Điện thoại | Dùng iframe 390px, vùng nội dung hữu dụng 375px; menu thu gọn, hero và danh mục chuyển thành bố cục điện thoại |
| Tràn ngang | Đọc kích thước DOM của trang trong iframe: clientWidth=375, scrollWidth=375 |
| Bộ lọc điện thoại | Nút Bật bộ lọc mở danh mục, thương hiệu, năm và giá; các thẻ nằm trong hai cột |

Đây là kiểm tra giao diện và thao tác trên trình duyệt. Các quyền, lưu dữ liệu, ảnh R2 và tranh chấp giữ chỗ được xác minh thêm trong kiểm thử production Worker riêng. Nhật ký không khẳng định đã chạy trên mọi trình duyệt hoặc mọi thiết bị vật lý.
