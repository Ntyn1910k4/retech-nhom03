# ReTech

Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết bị điện tử.

Đồ án Nhóm 03, UTH. Website có danh mục thiết bị thực, đối chiếu nguồn, định giá có giải thích và quy trình đăng tin, duyệt tin, gửi yêu cầu mua. Dữ liệu thu thập ngày 02/11/2026.

## Khởi chạy

Cần Node.js từ 22.13, npm và kết nối Internet để cài thư viện, xem ảnh hoặc mở nguồn ngoài. Không cần tài khoản Cloudflare cho chế độ local.

```sh
npm ci
npm run setup:local
npm run dev
```

Mở địa chỉ được terminal hiển thị. Trên Windows có thể chạy `Start_ReTech.cmd` từ thư mục này. Lệnh setup xây ứng dụng, áp dụng các migration còn thiếu và tự tạo mã quản trị trong `.dev.vars`. Lần chạy sau giữ nguyên cơ sở dữ liệu local.

Tạo tài khoản trong website. Trong **Tài khoản → Thiết lập quản trị**, nhập giá trị `ADMIN_BOOTSTRAP_TOKEN` từ `.dev.vars`. Mỗi máy có mã riêng; bộ source không chứa tài khoản hay mật khẩu mặc định. Khởi tạo quyền trên máy chủ cần mã bí mật đã cấu hình, không cấp quyền bằng cách sửa giao diện.

## Chức năng

- Danh mục đúng 1.000 hồ sơ từ năm 2015 đến 2026, gồm điện thoại, laptop, tablet/iPad, desktop/PC, router/mesh và TV.
- Tìm kiếm, lọc hãng/năm/danh mục/giá; phân trang; so sánh tối đa ba thiết bị; xem thông số và mở nguồn.
- Lưu thiết bị trong tài khoản; lưu trên trình duyệt khi chưa đăng nhập.
- Đăng ký, đăng nhập, đăng xuất; mật khẩu PBKDF2; phiên ngẫu nhiên có hạn sử dụng, lưu SHA256 tại máy chủ.
- Đăng bán và tải ảnh thực tế; tin mới chờ duyệt; quản trị kiểm duyệt và xem nhật ký.
- Gửi yêu cầu mua, giữ chỗ, xác nhận, hủy và đánh dấu đã bán. Cơ sở dữ liệu chặn hai yêu cầu mở cùng giữ một tin.
- Định giá với nguồn VND đủ mới, lọc cấu hình và tình trạng; lưu lịch sử khi đăng nhập; thông báo thiếu dữ liệu.
- Trợ lý tra cứu dữ liệu và tích hợp hội thoại OpenAI gọi công cụ tùy cấu hình máy chủ.

## Dữ liệu và phạm vi giá

`data/devices.json` là danh mục kỹ thuật thực; `data/prices.json` là 150 quan sát giá thật của CellphoneS. 76 quan sát được ghép có căn cứ với 60 model trong danh mục. Các model còn lại giữ trạng thái chưa có giá phù hợp. Giá rao tại nhà bán lẻ khác với giá giao dịch hoàn tất, giá thu mua hoặc hàng đang có tại ReTech.

Mỗi hồ sơ có nguồn và căn cứ xác định năm. 400 mốc năm từ EPA là thời điểm có bán tại thị trường được ghi nhận. Nguồn điện thoại GSMArena dùng bản chụp 01/02/2021, kết hợp nguồn hãng và dữ liệu nhà bán lẻ năm 2026. Xem `DATA_SOURCES.md`, manifest và từ điển dữ liệu trong thư mục `data` của gói nộp.

Ước tính ưu tiên giá cùng tình trạng. Khi phải quy đổi, hệ số mới=1, cũ đẹp=0,8, trầy=0,65, kích hoạt=0,92, trưng bày=0,85, đổi bảo hành=0,88 và cần sửa=0,45 là **quy tắc thử nghiệm chưa hiệu chỉnh**. Giá từng mẫu được chuẩn hóa, lấy trung vị và trừ chi phí sửa chữa đã xác nhận. Biên 5% là biên quy tắc, không phải khoảng tin cậy thống kê. Không đưa ra phần trăm chính xác hoặc sai số dự báo khi chưa có dữ liệu giao dịch đối chứng.

## Hội thoại AI

ChatGPT và các AI Agent đã hỗ trợ xây dựng, thu thập dữ liệu, thiết kế và kiểm thử đồ án. Tích hợp hội thoại trong website sử dụng Responses API với các công cụ `search_devices` và `estimate_device_price`.

Muốn bật dịch vụ này, cấu hình `OPENAI_API_KEY` và `OPENAI_MODEL` tại máy chủ hoặc `.dev.vars` local, rồi khởi động lại. Chọn model có hỗ trợ function calling theo tài liệu OpenAI tại thời điểm triển khai. Không đưa khóa vào mã phía trình duyệt. Khi thiếu cấu hình, giao diện ghi rõ **Tra cứu theo dữ liệu** và không giả vờ kết nối ChatGPT. Tích hợp OpenAI chưa được kiểm thử trực tiếp bằng khóa trả phí trong bộ nộp này.

## Kiểm tra tái lập

```sh
npm run typecheck
npm run build
npm test
```

`npm test` thực thi production Worker đã build trong Miniflare với D1/R2 biệt lập, áp dụng migration và chạy các ca chấp nhận. Tài khoản và giao dịch QA chỉ tồn tại trong môi trường kiểm thử tạm thời, không phải dữ liệu bán hàng mẫu. Kết quả ghi ở `evidence/acceptance-results.json`.

## Cấu trúc

```text
app/          Giao diện và API
lib/          Danh mục, định giá, bảo mật và kiểu dữ liệu
db/           Schema Drizzle
drizzle/      Migration SQL và metadata
data/         1.000 hồ sơ và quan sát giá có nguồn
public/       Font, biểu tượng và dữ liệu tải xuống
tests/        Kiểm thử production Worker
scripts/      Build và cài đặt local
config/       Ví dụ biến môi trường
```

Ứng dụng dùng React, TypeScript, Vinext và Cloudflare Workers; D1 lưu tài khoản/giao dịch, R2 lưu ảnh. Danh mục bất biến được đóng gói trong ứng dụng để tái lập đúng bản nộp. Bộ source không gồm `node_modules`, cơ sở dữ liệu cá nhân, khóa API hoặc trạng thái đăng nhập.

Sản phẩm học tập hỗ trợ liên hệ và giữ chỗ. Kiểm tra máy, thanh toán và giao nhận do hai bên thỏa thuận; ứng dụng không thực hiện thanh toán thật hay tự chứng nhận chất lượng thiết bị.
