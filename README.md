# ReTech · Nhóm 03

**Sử dụng ChatGPT hỗ trợ xây dựng website mua bán và định giá thiết bị điện tử.**

Đồ án UTH với mã nguồn ứng dụng, dữ liệu có nguồn, báo cáo và minh chứng dùng AI Agent trong phân tích, thiết kế, hiện thực và kiểm thử.

## Chạy trong VS Code

Cài **Node.js từ 22.13**, tải hoặc clone kho này, sau đó mở thư mục bằng VS Code. Trong **Terminal → New Terminal**, chạy lần lượt:

```sh
cd source
npm ci
npm run setup:local
npm run dev
```

Mở địa chỉ được terminal hiển thị. Trên Windows, nếu PowerShell chặn `npm.ps1`, thay `npm` bằng `npm.cmd`; cũng có thể mở `source/Start_ReTech.cmd`.

Lệnh setup xây ứng dụng, áp dụng migration cho D1 local và tạo mã quản trị riêng trong `source/.dev.vars`. Đăng ký tài khoản trên website, vào **Tài khoản → Thiết lập quản trị** và nhập `ADMIN_BOOTSTRAP_TOKEN` từ tệp đó. Chi tiết ở [hướng dẫn mã nguồn](source/README.md) và [hướng dẫn sử dụng](docs/Huong_dan_su_dung.pdf).

## Nội dung kho

| Thư mục / tệp | Nội dung |
|---|---|
| [source/](source/) | React, TypeScript, Vinext, Cloudflare Worker, D1, R2; mã nguồn và migration |
| [docs/](docs/) | Báo cáo DOCX/PDF, hướng dẫn, API và kịch bản demo |
| [data/](data/) | Danh mục 1.000 model/SKU, dữ liệu giá, nguồn và snapshot tái lập |
| [evidence/](evidence/) | Nhật ký AI, kết quả kiểm thử và kiểm tra dữ liệu |
| [README_NOP_BAI.md](README_NOP_BAI.md) | Chỉ dẫn bộ sản phẩm nộp và phạm vi bàn giao |
| [CHECKSUMS.sha256](CHECKSUMS.sha256) | Mã kiểm tra các tệp trong bộ bàn giao gốc |

## Chức năng

- Tra cứu, lọc, so sánh thiết bị và lưu yêu thích.
- Đăng ký, đăng nhập; đăng tin bán có ảnh và duyệt tin bằng tài khoản quản trị.
- Gửi yêu cầu mua, giữ chỗ, xác nhận, hủy và đánh dấu đã bán.
- Định giá có giải thích dựa trên nguồn giá phù hợp; thông báo rõ khi thiếu dữ liệu.
- Trợ lý tra cứu và tích hợp hội thoại OpenAI gọi công cụ khi có cấu hình máy chủ.

## Dữ liệu và AI

Danh mục gồm **1.000 model/SKU có nguồn từ 2015–2026**: 410 điện thoại, 200 laptop, 100 tablet/iPad, 130 desktop/PC, 40 router/mesh và 120 TV. Đây là hồ sơ danh mục; các năm được giải thích tại `year_basis`.

Có **150 quan sát giá niêm yết thực của CellphoneS**; 76 quan sát ghép được với 60 model. Các thiết bị thiếu nguồn giá phù hợp giữ trạng thái chưa có giá. Quy tắc định giá thử nghiệm được công khai; chưa có dữ liệu giao dịch độc lập để công bố độ chính xác dự báo. Xem [nguồn dữ liệu](source/DATA_SOURCES.md) và [tài liệu dữ liệu](data/README_DATA.md).

Để bật hội thoại AI, cấu hình `OPENAI_API_KEY` và `OPENAI_MODEL` ở máy chủ hoặc `source/.dev.vars`, theo [mẫu cấu hình](source/config/runtime.env.example), rồi khởi động lại. Chế độ tra cứu và định giá theo dữ liệu hoạt động khi chưa có khóa. Tích hợp OpenAI chưa được kiểm thử trực tiếp bằng khóa trả phí trong bộ nộp.

## Kiểm tra

Chạy từ `source/`:

```sh
npm run typecheck
npm run build
npm test
```

Minh chứng trong bộ bàn giao ghi nhận **35/35 ca chấp nhận** và **1.003 kiểm tra dữ liệu** đã đạt. Bộ kiểm thử dùng D1/R2 biệt lập; dữ liệu QA không được nạp làm tin bán thực tế.

## Phạm vi triển khai

Các lệnh trên chạy ứng dụng cục bộ. Đưa mã nguồn lên GitHub không tự triển khai website. Dự án dùng Worker, D1 và R2 nên cần môi trường máy chủ phù hợp; GitHub Pages không chạy đầy đủ phần máy chủ này. Ứng dụng hỗ trợ liên hệ và giữ chỗ; kiểm tra máy, thanh toán và giao nhận do hai bên thỏa thuận.

Không commit `.dev.vars`, `.env`, khóa API, trạng thái đăng nhập hay cơ sở dữ liệu cá nhân. Bản quyền mã nguồn và thông báo thư viện tại [source/LICENSE](source/LICENSE) và các tệp tương ứng.
