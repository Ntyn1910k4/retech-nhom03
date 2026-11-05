# Giá rao bán tham khảo từ CellphoneS

Bộ dữ liệu gồm 150 quan sát giá rao bán thiết bị có thật, thu thập từ các danh mục công khai của CellphoneS ngày 02 tháng 11 năm 2026. Đơn vị tiền tệ là VND. Đây là giá chào bán của nhà bán lẻ tại thời điểm ghi nhận, không phải giá giao dịch hoàn tất hay cam kết giá cho tương lai.

## Các tệp

- `prices_compact.json`: dữ liệu ứng dụng, không kèm HTML.
- `prices.json`: 150 bản ghi đầy đủ, gồm đoạn thẻ sản phẩm chứa tên, giá và đường dẫn nguồn.
- `prices.csv`: dữ liệu phẳng UTF 8 có BOM, dùng được trong Excel.
- `prices_enriched.json` và `prices_enriched.csv`: cùng 150 quan sát, bổ sung thông số và năm khi trang chi tiết cung cấp dữ kiện.
- `product_metadata.json`: bằng chứng trích thông số của sản phẩm được chọn trên trang chi tiết.
- `enrich_product_metadata.py`: script bổ sung thông số, phân tích tĩnh dữ liệu Nuxt và JSON LD mà không thực thi JavaScript.
- `price_validation.json` và `enrichment_validation.json`: kết quả kiểm tra đã chạy thực tế.
- `price_sources_manifest.json`: nguồn danh mục, thống kê, ngày ghi nhận và SHA 256.
- `source_snapshots/`: ảnh chụp nội dung HTML gốc dạng gzip để kiểm tra lại.
- `acquire_prices.py`: script tải và trích xuất có thể chạy lại bằng thư viện chuẩn Python.

## Chạy lại

Chạy `python acquire_prices.py --refresh` để tải lại các trang công khai và cập nhật giá. Chạy không có cờ để trích xuất lại từ các bản HTML đã tải nếu chúng còn trong thư mục. Không cần khóa API.

## Phạm vi và giới hạn

Điện thoại 36, laptop 30, tablet 28, TV 18, PC 18 và router 20. Mỗi quan sát có URL sản phẩm riêng. Một model có thể có các dung lượng hoặc tình trạng khác nhau, vì vậy 150 quan sát không được diễn giải là 150 dòng model phần cứng độc lập.

Tình trạng gồm máy mới, cũ đẹp, trầy xước, đã kích hoạt, trưng bày và đổi bảo hành, giữ theo cách nhà bán lẻ mô tả. Các phân loại này không đại diện kết quả kiểm định vật lý độc lập.

Trong bộ giá ban đầu, năm phát hành chỉ được lưu khi năm có trong tên sản phẩm gốc. Bộ bổ sung thông số còn dùng trường năm ra mắt rõ ràng của sản phẩm được chọn trên trang chi tiết, giữ URL và giá trị gốc làm căn cứ. Bộ bổ sung có 51 quan sát có năm và 102 quan sát có thông số; các trường không có dữ kiện vẫn để trống. Không suy diễn năm từ tên CPU, số model hay ngày thu thập. Không thêm giá giả khi thiếu quan sát. Giá có thể thay đổi theo thời điểm, khu vực, tồn kho và điều kiện mua hàng. Dữ liệu chỉ có một hệ thống bán lẻ; không đủ để kết luận mức giá đại diện cho toàn thị trường.

Tên, thông số và giá là các dữ kiện được trích xuất. Ảnh sản phẩm vẫn là tài nguyên do nguồn phát hành cung cấp, cần ghi nguồn và kiểm tra quyền tái sử dụng khi triển khai ngoài mục đích học tập.
