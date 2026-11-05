# Thu thập và kiểm tra quan sát giá

Các tệp JSON giữ quan sát gốc, cấu hình, ngày, URL và đoạn thẻ giá thực đã trích xuất. Các trang HTML bán lẻ đầy đủ không được đưa vào gói nộp. Nhật ký kiểm tra nguồn của phiên thu thập được lưu tại evidence/price_validation.json. Muốn chạy lại kiểm tra có đối chiếu toàn bộ HTML, chạy acquire_prices.py để tải nguồn trước; dữ liệu trực tuyến có thể thay đổi so với ngày 02/11/2026. Không coi lần tải mới là bằng chứng cho mức giá cũ.

Snapshot catalog tại ../source_snapshot chỉ giữ dữ kiện cần cho tái lập, loại nội dung điều hướng và bài tiếp thị. Xem README_REPLAY.md để tái lập đúng 1.000 model từ dữ kiện đã lưu.
