# Tài liệu API ReTech

Tài liệu mô tả giao diện máy chủ của bản đồ án Nhóm 03. Các đường dẫn dưới đây có cùng nguồn với website. Dữ liệu trả về dùng JSON, riêng API ảnh trả nội dung nhị phân.

## Xác thực và quy tắc chung

- Phiên sử dụng cookie `retech_session`. Đăng nhập thành công trả cookie `HttpOnly`, `SameSite=Lax`, hết hạn sau 7 ngày; HTTPS bổ sung `Secure`.
- API ghi dữ liệu kiểm tra `Origin` khi header này được cung cấp. Máy chủ kiểm tra quyền riêng cho từng thao tác.
- Lỗi nghiệp vụ có dạng `{"error":"Thông báo tiếng Việt"}`. HTTP 400 là đầu vào sai, 401 cần đăng nhập, 403 thiếu quyền, 404 không tồn tại, 409 xung đột trạng thái, 413 dữ liệu quá lớn, 429 vượt lượt, 500 lỗi nội bộ, 502 lỗi dịch vụ AI và 503 thiếu binding cần thiết.
- Các mức giới hạn lượt hiện tại tính theo phạm vi và cửa sổ một giờ: đăng ký 12, đăng nhập 30, định giá 80, tải ảnh 20, hội thoại Agent 20. Đây là cấu hình bản đồ án, không phải kết quả đo năng lực chịu tải.
- Mã model phải lấy từ API catalog; không tự dựng mã dựa trên tên thương mại.

## Catalog và model

| Phương thức | Đường dẫn | Tham số hoặc kết quả chính |
| --- | --- | --- |
| GET | `/api/summary` | Tổng model, nhóm thiết bị, hãng, mốc năm, số quan sát giá, số model có giá |
| GET | `/api/catalog` | Danh sách model và phân trang |
| GET | `/api/devices/:id` | Một model cùng nguồn và danh sách quan sát giá đã liên kết |

Tham số `/api/catalog`:

| Tên | Ý nghĩa |
| --- | --- |
| `q` | Tìm theo tên, hãng hoặc model; chuẩn hóa dấu và ký tự |
| `category` | `phone`, `laptop`, `tablet`, `desktop`, `router`, `tv` |
| `brand` | Khớp nhãn hãng của catalog |
| `year` | Mốc năm; đọc `year_basis` để hiểu ngữ nghĩa |
| `min`, `max` | Giá tham khảo thấp nhất hoặc cao nhất; model chưa có giá không khớp |
| `priced` | `true` để chỉ lấy model có quan sát giá |
| `sort` | `price_asc`, `price_desc`, `name`, `year`; mặc định ưu tiên model có ảnh và giá, xen kẽ các danh mục |
| `page`, `limit` | Trang bắt đầu từ 1; giới hạn bản ghi trong mỗi trang |

Kết quả catalog có các trường `items`, `total`, `page`, `pages`, `limit`. Mỗi model giữ `source_url`, `source_name`, `retrieved_at`, `release_year` và `year_basis`. Trường `release_year` là tên kỹ thuật; `year_basis` xác định đó là năm model, công bố, phát hành hay có mặt trên thị trường.

## Tài khoản

| Phương thức | Đường dẫn | Đầu vào hoặc quyền |
| --- | --- | --- |
| POST | `/api/auth/register` | `name`, `email`, `password` |
| POST | `/api/auth/login` | `email`, `password` |
| POST | `/api/auth/logout` | Hủy phiên hiện tại |
| GET | `/api/me` | Tài khoản hiện tại hoặc null; `ai_mode` là `local` hoặc `openai` |

Tên đăng ký từ 2 đến 80 ký tự, email tối đa 200 ký tự và mật khẩu từ 10 đến 128 ký tự. Email được chuẩn hóa chữ thường. Mật khẩu không được trả về từ API.

## Yêu thích và lịch sử

| Phương thức | Đường dẫn | Đầu vào hoặc quyền |
| --- | --- | --- |
| GET | `/api/favorites` | Cần đăng nhập; chỉ dữ liệu tài khoản hiện tại |
| POST | `/api/favorites` | `deviceId`, `saved` là boolean |
| GET | `/api/valuations` | Cần đăng nhập; 50 kết quả gần nhất của tài khoản |

## Định giá

`POST /api/valuations` nhận:

```json
{
  "deviceId": "Mã model lấy từ catalog",
  "condition": "used_good",
  "battery": 85,
  "repairCost": 0,
  "storage": "256GB"
}
```

`battery` có thể không cung cấp. `storage` có thể bỏ qua khi nguồn không ghi nhiều cấu hình khác nhau; nếu có nhiều biến thể, phải chọn một giá trị đúng như `storage_text` của quan sát nguồn. Các giá trị tình trạng gồm `new`, `used_good`, `used_scratched`, `activated`, `display`, `warranty_replacement`, `repair`.

Khi có căn cứ, kết quả có `status=estimated`, `low`, `high`, `suggested`, `sample_count`, `method`, `data_adequacy`, `assumptions`, `references` và `trace`. Khi không có quan sát giá phù hợp và đủ mới, kết quả có `status=insufficient_data`, thông báo và dấu vết tra cứu. Nếu còn nhiều cấu hình mà đầu vào chưa chọn, kết quả có `status=needs_variant`, `variants` và thông báo yêu cầu bổ sung cấu hình.

Chỉ dùng quan sát VND trong 90 ngày. Công cụ ưu tiên cùng tình trạng; nếu không có, áp dụng hệ số tình trạng thử nghiệm. Dải 5% là quy tắc của bản đồ án, không phải khoảng tin cậy thống kê. Xem toàn bộ công thức và giới hạn trong `lib/pricing.ts` và báo cáo.

## Tin đăng và ảnh

| Phương thức | Đường dẫn | Đầu vào hoặc quyền |
| --- | --- | --- |
| GET | `/api/listings` | Tin `active`; `mine=true` cần đăng nhập và lấy tin của tài khoản |
| POST | `/api/listings` | Cần đăng nhập; `deviceId`, `title`, `description`, `price`, `condition`, `imageKey` tùy chọn |
| PATCH | `/api/listings/:id` | `status`; kiểm tra chủ tin hoặc quản trị |
| POST | `/api/upload` | Cần đăng nhập; multipart trường `file` |
| GET | `/api/images/:key` | Đọc ảnh đã lưu từ R2 |

Tiêu đề từ 8 đến 160 ký tự; mô tả từ 30 đến 5.000 ký tự; giá nguyên từ 10.000 đến 1.000.000.000 đồng. Tin mới có trạng thái `pending`. Ảnh chấp nhận JPG, PNG, WebP đến 5 MB; máy chủ kiểm tra loại nội dung và dấu hiệu định dạng. Khóa ảnh của tin phải thuộc tài khoản đang gửi.

Người bán được đánh dấu `sold` đối với tin `active` hoặc `reserved`. Quản trị viên được duyệt `active`, từ chối `rejected` hoặc đánh dấu `sold` theo ràng buộc trạng thái. Không mở lại tin đang giữ chỗ hoặc đã bán bằng thao tác duyệt thông thường.

## Yêu cầu mua

| Phương thức | Đường dẫn | Đầu vào hoặc quyền |
| --- | --- | --- |
| GET | `/api/orders` | Cần đăng nhập; yêu cầu mà tài khoản là bên mua hoặc chủ tin |
| POST | `/api/orders` | `listingId`, `message`; lời nhắn từ 5 đến 1.000 ký tự |
| PATCH | `/api/orders/:id` | `status` là `accepted` hoặc `cancelled`; cần đúng bên có quyền |

Yêu cầu mới chỉ tạo khi tin đang `active` và người mua không phải chủ tin. Việc tạo yêu cầu và chuyển tin thành `reserved` thực hiện trong batch. Chỉ mục duy nhất có điều kiện trên yêu cầu mở bảo vệ một tin khỏi hai yêu cầu giữ chỗ đồng thời. Chỉ yêu cầu đang `pending` được xử lý ở API này. Người bán chấp nhận; bên mua hoặc bên bán có quyền hủy yêu cầu đang chờ. Tin có thể mở lại khi hủy. Khi người bán đánh dấu đã bán, yêu cầu liên quan được cập nhật hoàn tất theo quy tắc ứng dụng.

## Quản trị

| Phương thức | Đường dẫn | Đầu vào hoặc quyền |
| --- | --- | --- |
| GET | `/api/admin` | Vai trò `admin`; tin đăng, thống kê và audit log |
| POST | `/api/admin/bootstrap` | Tài khoản đã đăng nhập và `token` khớp `ADMIN_BOOTSTRAP_TOKEN` ở máy chủ |

Token khởi tạo là cấu hình bí mật. Sau khi cấp quyền cần thiết, người vận hành quản lý hoặc xóa token theo quy trình riêng. Không dùng token này như mật khẩu chia sẻ cho người dùng thường.

## Hội thoại Agent

`POST /api/agent` nhận `message` hoặc `messages` gồm các phần tử `{role, content}`. Vai trò đầu vào chỉ là `user` hoặc `assistant`, tối đa 8 tin gần nhất, mỗi nội dung không quá 3.000 ký tự.

- Chưa có `OPENAI_API_KEY` và `OPENAI_MODEL`: trả `mode=local`, kết quả tra cứu model và `trace`.
- Có cấu hình: gọi Responses API, chỉ cấp `search_devices` và `estimate_device_price`, giới hạn 5 vòng công cụ.
- Lỗi dịch vụ ngoài: trả lỗi 502 và thông báo bộ tra cứu/định giá dữ liệu vẫn có thể sử dụng.

Agent không có công cụ tự thanh toán hoặc tự đăng tin. Kết quả thử nghiệm trực tiếp với OpenAI được ghi riêng trong nhật ký; chỉ có mã tích hợp không đồng nghĩa đã gọi dịch vụ thành công.

## Tái kiểm tra

Dùng mã nguồn kiểm thử và README trong gói bàn giao để chạy lại. Khi sửa API, cập nhật tài liệu này cùng các ca kiểm thử liên quan. Không đưa mật khẩu, token phiên hoặc khóa API thật vào ví dụ và nhật ký.
