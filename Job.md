4. THÀNH VIÊN 4 – BACKEND DEVELOPER 3
Vai trò: Comment + Reply + Search/Filter + Pagination + SystemLogs.
4.1. Quản lý bình luận
•	API lấy danh sách bình luận của bài viết.
•	API tạo bình luận.
•	API Reply bình luận.
•	API duyệt bình luận.
•	API ẩn bình luận.
•	API xóa bình luận.
•	Kiểm tra User phải đăng nhập và tài khoản đang Active.
•	Chỉ cho bình luận dưới bài viết Published.
•	Chỉ bình luận Approved được hiển thị công khai.
4.2. Reply phân cấp
•	Sử dụng ParentId để xác định bình luận cha.
•	Xử lý cấu trúc cây Comment – Reply.
•	Đảm bảo khi bình luận cha bị ẩn/xóa thì xử lý phù hợp đối với các bình luận con.
•	Đảm bảo toàn vẹn dữ liệu khi xóa bình luận.
4.3. Search và Filter
•	Tìm kiếm bài viết theo Keyword trong Title hoặc Content.
•	Lọc theo Category.
•	Lọc theo Author.
•	Lọc theo khoảng thời gian.
•	Hỗ trợ kết hợp nhiều tiêu chí.
•	Luôn đảm bảo truy vấn public chỉ lấy bài Published.
•	Mặc định sắp xếp bài viết mới nhất trước.
4.4. Pagination
•	Xử lý page và pageSize.
•	Tính totalItems và totalPages.
•	Trả về dữ liệu phân trang theo format thống nhất.
4.5. SystemLogs
•	Xây dựng Logging Service.
•	Ghi các hành động CREATE, UPDATE, DELETE và CHANGE_STATUS.
•	Lưu user_id, action, target_type, target_id, old_value, new_value và created_at.
•	API cho Admin tra cứu nhật ký.
•	Hỗ trợ lọc log theo User, Action, Target và thời gian.
•	Không cung cấp chức năng sửa/xóa SystemLogs.
•	Phối hợp với TV2 để bảo đảm việc ghi log được thực hiện nhất quán với thao tác chính.

IV. PHÂN CHIA MODULE VÀ TRÁCH NHIỆM
Module	                TV1	            TV2	    TV3	      TV4	      TV5
Phân tích & tài liệu	Chính	                                      Hỗ trợ khi cần
Database	            Tài liệu	    Chính	Hỗ trợ	  Hỗ trợ	
Authentication	        Tài liệu/Test	Chính			              UI
Authorization	        Tài liệu/Test	Chính	Hỗ trợ	  Hỗ trợ      UI
User Management	        Tài liệu/Test	API			                  UI
Category	            Tài liệu/Test		    API		              UI
Post	                Tài liệu/Test		    API		              UI
Post Moderation	        Tài liệu/Test		    API		              UI
Comment	                Tài liệu/Test			          API	      UI
Search/Filter	        Tài liệu/Test			          API	      UI
SystemLogs	            Tài liệu/Test			          API	      UI
Reports/Statistics	    Tài liệu/Test			          Hỗ trợ API  UI + Integration
Testing	                Lead	        Module	Module	  Module  Frontend/Integration
Integration	            Điều phối	    Backend	Backend	  Backend Frontend
