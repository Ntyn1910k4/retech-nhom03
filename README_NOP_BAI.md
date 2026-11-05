# Bộ sản phẩm nộp Nhóm 03

**Đề tài:** Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết bị điện tử.

**Sản phẩm:** ReTech. Ngày bàn giao 02/11/2026. Tệp nộp theo hướng dẫn: **Group03.zip**. Hạn nộp trong ảnh của giảng viên: 23:59 ngày 20/12/2026.

## Các tệp chính

| Đường dẫn | Nội dung |
|---|---|
| docs/Bao_cao_Nhom03.docx | Báo cáo chỉnh sửa được, 20 trang, đủ 5 phần theo yêu cầu |
| docs/Bao_cao_Nhom03.pdf | Bản đọc và in của cùng báo cáo |
| docs/Huong_dan_su_dung.docx và PDF | Hướng dẫn thao tác, cài đặt, quản trị và xử lý lỗi, 6 trang |
| docs/Kich_ban_demo.md | Kịch bản trình diễn và câu hỏi bảo vệ |
| docs/Tai_lieu_API.md | API, dữ liệu đầu vào, quyền và trạng thái |
| source/ | Toàn bộ mã nguồn ứng dụng và migration SQL, không chứa khóa hay tài khoản mặc định |
| data/ | Danh mục 1.000 model, 150 quan sát giá, CSV/JSON, manifest, mã thu thập và snapshot dữ kiện để tái lập |
| evidence/ | Nhật ký dùng AI, 35 ca kiểm thử, 1.003 kiểm tra nguồn, QA giao diện, build, cài đặt và triển khai |
| CHECKSUMS.sha256 | Mã kiểm tra tính toàn vẹn của các tệp bàn giao |

## Chạy để chấm bài

Giải nén toàn bộ gói, mở terminal tại thư mục `source`. Cần Node.js từ 22.13 và kết nối Internet để cài thư viện.

```sh
npm ci
npm run setup:local
npm run dev
```

Mở địa chỉ terminal hiển thị. Windows có thể chạy `source/Start_ReTech.cmd`. Tạo tài khoản rồi vào **Tài khoản → Thiết lập quản trị**, nhập mã ngẫu nhiên `ADMIN_BOOTSTRAP_TOKEN` đã được tạo trong `source/.dev.vars`. Mã này chỉ dành cho bản cài local. Xem README trong source và hướng dẫn trong docs để thực hiện đầy đủ.

Kiểm tra lại bằng `npm run typecheck`, `npm run build`, `npm test`. Bộ kiểm thử sử dụng D1/R2 biệt lập, không nạp tin bán hoặc tài khoản QA vào dữ liệu ứng dụng.

## Bản xem online

https://retech-nhom03-2026.wildbarn8.chatgpt.site

Bản này đã triển khai thành công ở chế độ riêng tư, có cổng đăng nhập ChatGPT. Giảng viên chưa có quyền truy cập nên dùng source local để kiểm tra. Mã quản trị online và dịch vụ hội thoại OpenAI chưa cấu hình; quy trình quản trị đầy đủ được tái lập bằng setup local. Không dùng mã local như mã của máy chủ online.

## Đọc đúng dữ liệu

Danh mục có 410 điện thoại, 200 laptop, 100 tablet/iPad, 130 desktop/PC, 40 router/mesh và 120 TV. Mỗi dòng là model hoặc SKU có nguồn, không phải 1.000 máy vật lý đang còn trong kho.

Các mốc năm từ 2015 đến 2026 có căn cứ riêng tại `year_basis`. Năm EPA là thời điểm xuất hiện tại thị trường ghi nhận; một phần điện thoại lịch sử lấy từ snapshot GSMArena năm 2021, kết hợp nguồn hãng và bán lẻ năm 2026. Không gán mọi mốc thành ngày ra mắt toàn cầu.

Có 150 quan sát giá niêm yết thực của một nhà bán lẻ; 76 quan sát được ghép có căn cứ với 60 model trong danh mục. Model thiếu nguồn giá giữ trạng thái chưa có giá. Khoảng định giá dùng quy tắc công khai, chưa được hiệu chỉnh bằng giao dịch thị trường độc lập. Website hỗ trợ yêu cầu mua và giữ chỗ; thanh toán, kiểm tra máy và giao nhận do hai bên thỏa thuận, không thực hiện thanh toán thật trong đồ án.

ChatGPT và AI Agent đã hỗ trợ phân tích, thiết kế, viết mã, thu thập dữ liệu và kiểm thử. Tích hợp hội thoại AI trong sản phẩm có sẵn mã gọi công cụ, cần cấu hình OPENAI_API_KEY và OPENAI_MODEL trước khi dùng dịch vụ trực tiếp. Bộ tra cứu và định giá theo dữ liệu hoạt động khi chưa có khóa.
