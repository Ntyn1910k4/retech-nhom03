# ReTech AI — Bộ dữ liệu thiết bị có nguồn

Bộ dữ liệu phục vụ đồ án của Nhóm 03. Mỗi dòng là một mẫu thiết bị hoặc SKU có thật được ghi nhận trong nguồn; đây không phải danh sách 1.000 máy vật lý đang có trong kho. Dữ liệu được thu thập ngày **02/11/2026**.

## Tệp sử dụng

- `devices.json`: danh mục đúng 1.000 bản ghi; được website sử dụng.
- `devices.csv`: cùng dữ liệu ở dạng CSV UTF-8 có BOM, thuận tiện mở bằng Excel.
- `prices_joined.json`: các quan sát giá thật, điều kiện máy và biến thể; `device_id` chỉ được gắn khi có căn cứ ghép chính xác.
- `dataset_stats.json`: thống kê thực tế, số bản ghi có ảnh/giá, phân bố năm và mã SHA-256.
- `SOURCE_MANIFEST.json`: nguồn gốc, phạm vi, ngày chụp dữ liệu và ghi chú sử dụng nguồn.
- `build_catalog.py`: chuẩn hóa và chọn mẫu theo quy tắc có thể kiểm tra lại.
- `fetch_sources.py`, `fetch_apple.py`, `fetch_router_launches.py`: tải nguồn gốc để tái lập dữ liệu.

## Ý nghĩa của năm

`release_year` phải được đọc cùng `year_basis`. Các nguồn có mục đích khác nhau nên không gán mọi mốc thành “năm ra mắt toàn cầu”.

| `year_basis` | Ý nghĩa |
|---|---|
| `manufacturer_model_year` | Năm giới thiệu hoặc năm của thế hệ thiết bị do nhà sản xuất ghi rõ |
| `source_released_year` | Năm phát hành được nguồn GSMArena ghi trong trạng thái thiết bị |
| `source_announced_year` | Năm công bố khi nguồn không ghi năm phát hành |
| `market_availability_date` | Ngày sản phẩm bắt đầu có bán ở thị trường được EPA liệt kê |
| `manufacturer_announcement_year` | Năm thông cáo chính thức của nhà sản xuất công bố model router/mesh |
| `retailer_explicit_model_year` | Năm model được ghi rõ trong tiêu đề sản phẩm thật của nhà bán lẻ |
| `retailer_specification_release_year` | Năm trích từ trường ngày/tháng/năm ra mắt trong trang thông số thật |

`release_date` chỉ chứa ngày đầy đủ khi nguồn cung cấp ngày đầy đủ. Không tự gán ngày 01/01 cho một năm hoặc ngày 01 cho một tháng.

## Giá và biến thể

Danh mục kỹ thuật và quan sát giá là hai loại bản ghi riêng. Giá hiển thị trên thẻ sản phẩm là mức giá quan sát được của một biến thể, có thể khác dung lượng hoặc tình trạng mà khách hàng muốn định giá. Cần đọc `price_variant`, `price_condition`, `price_observed_at` và đối chiếu `prices_joined.json`.

- Chỉ dùng giá có `source_url` và thời điểm quan sát.
- Giá của nhà bán lẻ là **giá rao**, không phải giao dịch đã hoàn tất.
- Giá của sản phẩm mới không tự động trở thành giá máy cũ.
- Model chưa có giá tham khảo giữ `price = null`; website hiển thị trạng thái thiếu giá.
- Chuỗi `historical_price_text` trong thông số GSMArena là dữ liệu của bản chụp 2021; không dùng làm giá năm 2026.
- Biến thể dung lượng, tình trạng mới/cũ được giữ ở từng quan sát giá để công cụ định giá lọc đúng.

## Ảnh và nguồn

`image_url` là đường dẫn ảnh được nguồn thực tế cung cấp. Nếu nguồn không có ảnh, trường này để trống. Website có thể dùng hình minh họa danh mục có nhãn rõ; không gắn ảnh của model khác rồi coi là ảnh sản phẩm thật. Quyền với ảnh và nội dung nguồn thuộc chủ sở hữu tương ứng; bộ dữ liệu không tuyên bố sở hữu các tài sản đó.

Các bản ghi EPA mô tả thị trường Hoa Kỳ/Canada hoặc thị trường trong trường `markets`; không tự coi đó là model phân phối chính hãng tại Việt Nam. Nguồn điện thoại GSMArena là bản chụp **01/02/2021**, được kết hợp với danh mục Apple và nhà bán lẻ cập nhật năm 2026. Các thiết bị lịch sử có thật vẫn được giữ để phục vụ tra cứu giai đoạn từ 2015.

## Từ điển trường

| Trường | Nội dung |
|---|---|
| `id` | Định danh ổn định, băm từ danh tính có nguồn |
| `category` | `phone`, `laptop`, `tablet`, `desktop`, `router`, `tv` |
| `brand`, `name`, `model` | Hãng, tên hiển thị, model hoặc mã định danh được nguồn ghi nhận |
| `release_year`, `release_date`, `year_basis` | Mốc năm/ngày và ngữ nghĩa của mốc |
| `specs` | Các thông số quan sát được; không tự bù trường thiếu |
| `aliases` | Tên thế hệ hoặc mã model thật để ghép tham chiếu |
| `image_url` | Ảnh từ nguồn, hoặc `null` |
| `source_name`, `source_url` | Nhà cung cấp và đường dẫn nguồn của bản ghi |
| `source_record_id`, `source_dataset_url` | Mã bản ghi và tệp/bài tổng hợp gốc |
| `retrieved_at`, `source_as_of` | Ngày thu thập và ngày bản chụp lịch sử nếu có |
| `quote_ids` | Các quan sát giá được ghép có căn cứ |
| `price`, `price_currency`, `price_type` | Giá rao được nguồn ghi nhận, tiền tệ và loại giá |
| `price_condition`, `price_variant` | Tình trạng, dung lượng/cấu hình của giá được chọn |
| `price_source_url`, `price_observed_at` | Nguồn và thời điểm quan sát giá |

## Tái lập và kiểm tra

Chạy `python acquire_all.py --raw-dir ./raw`, sau đó `python build_catalog.py --raw-dir ./raw --prices ./prices_enriched.json --output-dir ./output`. Bản chụp nguồn gốc và các tệp chỉ mục đi kèm cho phép chạy lại ngoại tuyến. Giữ nguyên các bản chụp đầu vào để tái tạo đúng cùng kết quả. Dữ liệu trực tiếp có thể được nguồn cập nhật sau ngày nêu trên; khi tải lại cần kiểm tra cấu trúc và chạy toàn bộ kiểm tra dữ liệu. Việc thay đổi các quan sát giá phải có nguồn mới, không được sửa số tiền tùy ý để làm đẹp bài demo.
