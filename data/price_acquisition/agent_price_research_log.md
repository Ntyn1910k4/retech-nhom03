# Nhật ký Agent thu thập giá tham khảo

Ngày thực hiện: 02 tháng 11 năm 2026.

Nhiệm vụ được giao là thu thập quan sát giá có nguồn cho thiết bị điện tử có thật, giữ rõ loại giá, tình trạng và thời điểm ghi nhận; không tạo giá hay giao dịch giả.

## Các thao tác đã thực hiện

1. Thử các nguồn danh mục nhà bán lẻ công khai. CellphoneS trả nội dung HTML thành công; một số nguồn khác trả lỗi HTTP 503 hoặc đường dẫn không tồn tại, nên không được dùng làm bằng chứng.
2. Trích tên, giá hiển thị chính, đường dẫn sản phẩm, ảnh và tình trạng từ thẻ sản phẩm của 9 danh mục CellphoneS.
3. Loại thẻ trùng đường dẫn, không có giá số hoặc không đúng loại thiết bị. Giữ đúng 150 quan sát, gồm 36 điện thoại, 30 laptop, 28 tablet, 18 TV, 18 PC và 20 router.
4. Lưu bản HTML nén gzip, dấu kiểm SHA 256 và đoạn thẻ sản phẩm nguyên gốc gắn với từng quan sát. Lưu dữ liệu ứng dụng riêng, không trộn HTML vào giao diện.
5. Chạy kiểm tra nguồn cục bộ bằng `validate_prices.py`. Kết quả thực tế được ghi trong `price_validation.json`, gồm số kiểm tra đã chạy và từng kết quả.
6. Đọc trang chi tiết để bổ sung thông số và năm giới thiệu khi nguồn có dữ kiện. Dữ liệu JavaScript Nuxt được phân tích dưới dạng văn bản và giá trị nguyên thủy, không thực thi mã từ website.

## Kiểm soát chất lượng phát hiện trong quá trình làm

Lần trích xuất Nuxt ban đầu chưa giới hạn phạm vi đối tượng nên có thể đọc thông số của sản phẩm so sánh nằm cùng trang. Ví dụ, trang iPhone 17 Pro có một đối tượng so sánh cũ ghi năm 2022, trong khi đối tượng sản phẩm được chọn ghi tháng 09 năm 2025. Agent đã phát hiện mâu thuẫn, giới hạn việc đọc vào đối tượng thông số của sản phẩm đang xem, và đối chiếu trang Apple Support của iPhone 17 Pro ghi năm giới thiệu 2025.

Nguồn đối chiếu chính thức: https://support.apple.com/en-us/125090

Giá trong 150 quan sát không bị thay đổi bởi quá trình bổ sung thông số. Các bản ghi không có năm hoặc thông số rõ ràng vẫn để trống. Nguồn, thời điểm, đoạn chứng cứ và mã kiểm tra được giữ lại để nhóm kiểm tra độc lập.

## Giới hạn của kết quả

Giá thu thập là giá rao bán của nhà bán lẻ, gồm máy mới và một số tình trạng máy đã qua sử dụng. Không có giá giao dịch hoàn tất và không có kiểm định vật lý độc lập. Các điều kiện ưu đãi, tồn kho hoặc khu vực có thể ảnh hưởng mức giá thực tế tại thời điểm người dùng mua hàng. Bộ dữ liệu này phục vụ minh họa và tham chiếu có nguồn, không được diễn giải thành khảo sát toàn thị trường.
