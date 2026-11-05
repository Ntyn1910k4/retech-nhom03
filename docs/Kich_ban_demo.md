# Kịch bản trình diễn ReTech

Đề tài: Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết bị điện tử

Nhóm 03 · 02/11/2026

Website riêng tư: https://retech-nhom03-2026.wildbarn8.chatgpt.site

## Chuẩn bị

- Chạy `npm ci`, `npm run setup:local` rồi `npm run dev` theo README; kiểm tra dữ liệu trước buổi trình diễn.
- Website riêng tư mở cổng đăng nhập ChatGPT và yêu cầu quyền truy cập. Người chấm chưa có quyền dùng source local. Bản đã triển khai chưa cấu hình mã quản trị và OpenAI. Dùng bản local cùng mã trong `.dev.vars` để trình diễn đầy đủ luồng duyệt tin; mã local không áp dụng cho website online.
- Chuẩn bị tài khoản người bán, người mua và quản trị theo hướng dẫn; không dùng thông tin bí mật trong ảnh minh chứng.
- Mở sẵn báo cáo, dữ liệu có nguồn và nhật ký kiểm thử.

## Diễn biến

- **1 phút:** Giới thiệu bài toán, nhóm người dùng và phạm vi dữ liệu.
- **2 phút:** Tìm theo model, lọc theo loại và năm, mở nguồn, so sánh hai thiết bị.
- **2 phút:** Định giá một model có nguồn giá; giải thích quy tắc và thử trường hợp thiếu dữ liệu.
- **2 phút:** Đăng nhập người bán, tạo tin; quản trị duyệt; người mua gửi yêu cầu.
- **1 phút:** Mở minh chứng AI, nhật ký kiểm thử và nêu giới hạn đã ghi nhận.

## Ví dụ định giá

Chọn Apple iPhone 16 Pro Max, cấu hình 256GB, tình trạng cũ đẹp, chi phí sửa chữa 0. Quan sát giá niêm yết tại CellphoneS là 26.490.000 đồng ngày 02/11/2026. Với đúng một mẫu cùng tình trạng, giá gợi ý là 26.490.000 đồng và dải quy tắc là 25.170.000 đến 27.810.000 đồng. Kết quả đã được xem trên trình duyệt và phải đọc kèm nhãn ít quan sát, nguồn và phương pháp; đây không phải giá bảo đảm giao dịch.

Nguồn quan sát: [CellphoneS – iPhone 16 Pro Max 256GB cũ đẹp](https://cellphones.com.vn/iphone-16-pro-max256gb-cu-dep.html). Giá là bản chụp thời điểm ghi nhận, không phải cam kết giá còn hiệu lực khi bảo vệ.

Giải thích rõ giá tại nguồn, tình trạng mẫu, ngày ghi nhận và quy tắc điều chỉnh. Không gọi dải 5% là khoảng tin cậy hoặc độ chính xác đã kiểm chứng.

## Câu hỏi bảo vệ thường gặp

**Vì sao dùng AI Agent?** ChatGPT hỗ trợ phân tích, thiết kế, viết mã, thu thập dữ liệu và kiểm thử. Trong hội thoại website, mô hình chỉ có các công cụ tra model và định giá được máy chủ cho phép.

**Có đủ giá của cả 1000 model không?** Số model catalog và số quan sát giá là hai đại lượng khác nhau. Mở thống kê kèm dữ liệu để trình bày độ phủ thực tế. Các model thiếu căn cứ trả trạng thái chưa đủ dữ liệu.

**Dữ liệu là thật hay giả lập?** Tên và thông số model có nguồn. Quan sát giá lấy từ nguồn bán lẻ kèm ngày. Tài khoản, tin đăng và yêu cầu tạo khi demo là thao tác minh họa trong ứng dụng, không phải chứng cứ giao dịch thị trường.

**Giá ước tính chính xác đến mức nào?** Bộ đồ án kiểm tra tính đúng của quy tắc và nguồn. Chưa có giá giao dịch độc lập để công bố sai số hay một phần trăm chính xác trên thị trường.

**Khi không có khóa OpenAI thì sao?** Khi chưa cấu hình OPENAI_API_KEY và OPENAI_MODEL, website dùng chế độ tra cứu cục bộ và bộ tính giá theo dữ liệu. Chế độ này không được mô tả là hội thoại mô hình đang hoạt động. Khi có cấu hình, máy chủ có thể gọi OpenAI Responses API; việc kiểm tra trực tiếp chế độ này được ghi riêng trong kết quả kiểm thử.

**Minh chứng AI ở đâu?** Mở phần 5 báo cáo, mã nguồn, script thu thập và nhật ký kiểm thử. Các mẫu prompt được ghi là mẫu tái sử dụng, không giả thành lịch sử đã xảy ra.

## Kết thúc

Mở danh sách tệp bàn giao và chỉ rõ cách chạy lại, phạm vi kiểm thử cùng các giới hạn được ghi nhận.
