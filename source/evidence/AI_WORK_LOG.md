# Minh chứng sử dụng ChatGPT và AI Agent

Ngày thực hiện: 02/11/2026. Đề tài: Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết bị điện tử. Nhật ký này tóm tắt các công việc thực sự được thực hiện trong phiên xây dựng sản phẩm, không thay cho ảnh chụp một cuộc hội thoại lịch sử.

## Yêu cầu nhận được

Người dùng yêu cầu hoàn thiện source code và các tệp nộp theo ảnh hướng dẫn của giảng viên, giao diện đẹp, dữ liệu thật của 1.000 thiết bị từ năm 2015 đến nay thuộc điện thoại, laptop, router, PC, tablet/iPad và TV. Ảnh hướng dẫn yêu cầu báo cáo năm phần và minh chứng AI ở phân tích, thiết kế, hiện thực, kiểm thử; tệp nộp đặt tên Group03.zip.

## Phân tích và thiết kế

ChatGPT chuyển yêu cầu thành danh mục chức năng gồm tra cứu, lọc, so sánh, lưu thiết bị, tài khoản, đăng tin, duyệt tin, yêu cầu mua, định giá và nhật ký. Hai loại dữ liệu được xác định riêng: hồ sơ model có nguồn và quan sát giá niêm yết có điều kiện. Không biến danh mục model thành hàng tồn kho giả hoặc tự sinh giá thị trường.

Thiết kế chọn giao diện thương mại tông trắng ngà, xanh đậm và xanh nhạt; ảnh thật theo model, sơ đồ danh mục có nhãn khi thiếu ảnh. Kiến trúc thực tế gồm React, TypeScript, Vinext, Worker, D1 và R2. Danh mục được đóng gói để tái lập bản nộp; D1 quản lý dữ liệu phát sinh của người dùng.

## Các nhiệm vụ Agent đã giao

| Nhiệm vụ | Phạm vi giao thực tế | Kết quả có tệp kiểm chứng |
|---|---|---|
| real_device_data | Thu thập 1.000 model thực, năm có căn cứ, sáu nhóm, nguồn từng dòng; không tự điền giá hay thông số thiếu | devices.json, devices.csv, SOURCE_MANIFEST.json, DATA_VALIDATION.json, SEMANTIC_AUDIT.json |
| price_references | Thu thập 150 quan sát giá thật kèm tình trạng, cấu hình, URL, thời điểm và chứng cứ trích xuất | prices.json, prices.csv, price_validation.json, mã thu thập |
| submission_documents | Chuẩn bị báo cáo theo năm phần và hướng dẫn, chờ số liệu kiểm tra thực trước khi chốt | DOCX, PDF, kịch bản demo, tài liệu API |
| finish_documents | Tiếp tục hoàn tất tài liệu từ các tệp đã có sau khi người dùng nhắc lại yêu cầu | Bộ tài liệu cuối, kiểm tra bố cục toàn bộ trang |

Các Agent xử lý phần việc có ranh giới. Agent chính triển khai giao diện, API, bảo mật, tích hợp dữ liệu, kiểm thử, cài đặt và đóng gói. Danh sách trên mô tả hoạt động của AI trong phiên làm việc, không gán những công việc đó thành đóng góp đã xác minh của từng sinh viên.

## Hiện thực và các sửa lỗi có thật

1. Tạo API tài khoản, cookie phiên HttpOnly, băm mật khẩu PBKDF2, kiểm tra quyền sở hữu và quyền quản trị. Khóa bí mật không đặt ở giao diện.
2. Tạo luồng đăng tin chờ duyệt, công bố sau duyệt, gửi yêu cầu mua và hoàn tất. Bổ sung chỉ mục duy nhất có điều kiện để chặn hai yêu cầu đang mở trên cùng tin. Các thay đổi trạng thái liên quan được xử lý bằng batch.
3. Tách bộ tính giá khỏi phần hội thoại. Công cụ chỉ sử dụng quan sát có nguồn; nhiều cấu hình chưa chọn trả needs_variant; thiếu căn cứ trả insufficient_data.
4. Rà soát phát hiện bộ phân loại dựa chuỗi pad từng nhận nhầm Coolpad thành tablet; đã sửa ranh giới tên và kiểm tra lại kích thước thiết bị.
5. Khi phân tích trang bán lẻ, dữ liệu Nuxt có cả sản phẩm được chọn và sản phẩm so sánh. Agent phát hiện năm/thông số không nhất quán, sửa phạm vi trích xuất theo sản phẩm chính và kiểm tra lại bản cuối.
6. Loại bản ghi có ký tự giải mã hỏng trong tên hãng, thay bằng hồ sơ thật khác; chuẩn hóa cách viết hãng và giữ source_brand.
7. Ca upload ban đầu thất bại do bộ kiểm thử Node và runtime dùng đối tượng FormData khác nhau. Sửa bộ kiểm thử để mã hóa multipart thật trước khi gửi; API cũng trả lỗi 400 cho multipart sai. Sau sửa, upload hợp lệ và chặn ảnh giả đều đạt.
8. Kiểm tra cài đặt bằng thư mục sạch, build, áp dụng hai migration local; chạy lại migration không làm mất dữ liệu. Khóa package-lock được đối chiếu đúng đặc tả dependency và kiểm tra npm ci ở chế độ dry run.

## Kiểm thử và bằng chứng

- `acceptance-results.json`: kết quả thực thi production Worker với Miniflare và D1/R2 biệt lập. Tài khoản và yêu cầu QA là dữ liệu tạm của ca thử, không được nạp vào chợ thiết bị thật.
- `DATA_VALIDATION.json`, `SEMANTIC_AUDIT.json`: kiểm tra cấu trúc, nguồn, năm, định danh và phân loại của danh mục.
- `price_validation.json`: kiểm tra quan sát giá, nguồn và chứng cứ trích xuất.
- `BROWSER_QA.md`: các thao tác trực tiếp trên giao diện desktop và khung điện thoại.
- `build-log.txt`, `setup-check-log.txt`: nhật ký build và cài đặt local.

Không có khóa dịch vụ OpenAI trong phiên này nên chưa xác minh trực tiếp phản hồi từ một model trả phí. Website ghi đúng chế độ tra cứu dữ liệu khi chưa cấu hình AI. Bộ mã tích hợp function calling được bàn giao để cấu hình và kiểm tra tiếp; không ghi một kết quả AI trực tiếp chưa diễn ra thành minh chứng đã đạt.

## Mẫu prompt tái sử dụng

Các câu sau là mẫu hướng dẫn cho lần tái lập hoặc phát triển tiếp, không phải bản chép nguyên văn của lịch sử hội thoại đã xảy ra:

- Phân tích: Hãy chuyển yêu cầu website mua bán thiết bị thành các tình huống sử dụng và tiêu chí nghiệm thu, phân biệt catalog với tin bán thực.
- Thiết kế: Thiết kế schema tài khoản, tin đăng, yêu cầu mua và nhật ký; nêu điều kiện ngăn hai người cùng giữ chỗ một tin.
- Hiện thực: Viết công cụ định giá chỉ dùng quan sát có nguồn, cùng model và cấu hình; trả trạng thái thiếu dữ liệu khi không đủ căn cứ.
- Kiểm thử: Đề xuất ca thử cho quyền sở hữu, phiên đăng nhập, upload ảnh, cạnh tranh giữ chỗ và nguồn giá; chạy trên cơ sở dữ liệu biệt lập và lưu kết quả thực.

## Kiểm tra tái lập trước khi đóng gói

Đã sửa bộ trích xuất dung lượng của 27 model Apple để dừng trước phần Model trong trang gốc. Không đổi ID, tên model, năm hay quan sát giá. Bộ dữ liệu sau làm sạch đạt lại 1.003 kiểm tra và được tái lập offline từ snapshot dữ kiện với SHA-256 trùng tuyệt đối. Kết quả tại catalog-replay-check.json.
