<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class VarietyPostsSeeder extends Seeder
{
    /**
     * Seed a varied, repeatable set of Vietnamese sample posts for the local demo.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Tổng hợp', 'slug' => 'tong-hop', 'description' => 'Những câu chuyện và góc nhìn đa dạng.', 'sort_order' => 0],
            ['name' => 'Công nghệ', 'slug' => 'cong-nghe', 'description' => 'Tin tức và góc nhìn công nghệ.', 'sort_order' => 1],
            ['name' => 'Du lịch', 'slug' => 'du-lich', 'description' => 'Trải nghiệm và cẩm nang du lịch.', 'sort_order' => 2],
            ['name' => 'Ẩm thực', 'slug' => 'am-thuc', 'description' => 'Món ngon và văn hóa ẩm thực Việt.', 'sort_order' => 3],
            ['name' => 'Đời sống', 'slug' => 'doi-song', 'description' => 'Những câu chuyện nhỏ và góc nhìn đời thường.', 'sort_order' => 4],
            ['name' => 'Âm nhạc', 'slug' => 'am-nhac', 'description' => 'Âm nhạc, thói quen nghe và những giai điệu đáng nhớ.', 'sort_order' => 5],
            ['name' => 'Thú cưng', 'slug' => 'thu-cung', 'description' => 'Những người bạn nhỏ và cuộc sống cùng thú cưng.', 'sort_order' => 6],
            ['name' => 'Sách', 'slug' => 'sach', 'description' => 'Sách hay, ghi chú đọc và những ý tưởng đọng lại.', 'sort_order' => 7],
            ['name' => 'Học tập', 'slug' => 'hoc-tap', 'description' => 'Kinh nghiệm học tập và phát triển bản thân.', 'sort_order' => 8],
        ];

        foreach ($categories as $data) {
            Category::updateOrCreate(['slug' => $data['slug']], $data + ['display_order' => $data['sort_order']]);
        }

        $authors = [
            ['username' => 'minhthu_notes', 'display_name' => 'Minh Thư'],
            ['username' => 'bao_an_di_day', 'display_name' => 'Bảo An'],
            ['username' => 'linhnghe nhac', 'display_name' => 'Linh'],
            ['username' => 'nam_ke_chuyen', 'display_name' => 'Nam kể chuyện'],
            ['username' => 'meo_va_may', 'display_name' => 'Mây và Mèo'],
        ];

        foreach ($authors as &$author) {
            $author['username'] = Str::slug($author['username'], '_');
            $user = User::firstOrCreate(
                ['email' => $author['username'].'@blog-platform.local'],
                ['username' => $author['username'], 'display_name' => $author['display_name'], 'password' => Str::random(48), 'role' => 'User', 'status' => 'Active', 'email_verified_at' => now()],
            );
            $author['id'] = $user->id;
        }
        unset($author);

        $posts = [
            ['author' => 0, 'category' => 'doi-song', 'title' => 'Một chiếc ô giữa ngày mưa và lòng tốt rất nhỏ', 'slug' => 'mot-chiec-o-giua-ngay-mua', 'image' => 'doi-ban-duoi-mua.jpg', 'content' => "Chiều tan làm, mưa đổ xuống bất ngờ. Mình đứng nép dưới mái hiên, nhìn dòng người vội vã lướt qua. Một bạn nam dừng lại, nghiêng chiếc ô về phía người đang loay hoay bên cầu thang.\n\nKhông ai nói điều gì lớn lao. Chỉ là một đoạn đường được đi chung, một chút khô ráo được nhường lại. Vậy mà cả buổi tối hôm ấy, mình cứ nhớ mãi khoảnh khắc đó.\n\nCó lẽ thành phố dễ chịu hơn không phải vì ít mưa, mà vì giữa cơn mưa vẫn có người để ý đến nhau."],
            ['author' => 3, 'category' => 'doi-song', 'title' => 'Thành phố sau cơn mưa có một vẻ dịu dàng riêng', 'slug' => 'thanh-pho-sau-con-mua', 'image' => 'pho-dem-sau-mua.jpg', 'content' => "Đèn đường phản chiếu trên mặt phố còn ướt, xe cộ thưa dần và những cửa tiệm bắt đầu kéo cửa. Thành phố ban ngày lúc nào cũng có vẻ đang chạy đua, nhưng sau cơn mưa, mọi thứ chậm lại một nhịp.\n\nMình thích đi bộ đoạn đường về nhà vào những tối như vậy. Không cần bật nhạc, chỉ nghe tiếng nước chảy dọc vỉa hè và tiếng bước chân của chính mình.\n\nNếu hôm nay quá ồn ào, thử dành cho mình mười phút đi chậm nhé."],
            ['author' => 4, 'category' => 'thu-cung', 'title' => 'Mèo đi biển: chuyến du lịch đầu tiên của boss', 'slug' => 'meo-di-bien-chuyen-di-dau-tien', 'image' => 'meo-di-bien.jpg', 'content' => "Kế hoạch ban đầu là đưa boss ra biển để chụp vài tấm ảnh xinh. Kết quả: boss ngồi im nhìn sóng, còn sen chạy theo giữ khăn, nước và chiếc túi vận chuyển.\n\nĐiều bất ngờ là sau vài phút làm quen, boss bắt đầu tò mò với tiếng sóng và mùi gió biển. Chuyến đi ngắn thôi nhưng cả nhà có thêm một câu chuyện để kể.\n\nNếu đưa thú cưng đi chơi, hãy chuẩn bị chỗ nghỉ mát, nước sạch và đừng ép bé lại gần nơi đông người."],
            ['author' => 2, 'category' => 'am-nhac', 'title' => 'Vì sao tiếng đĩa than khiến một buổi tối chậm lại?', 'slug' => 'tieng-dia-than-cho-buoi-toi-cham-lai', 'image' => 'may-dia-than.jpg', 'content' => "Có một nghi thức nhỏ mình rất thích: chọn đĩa, phủi bụi, đặt kim xuống và ngồi yên nghe hết một mặt. Tiếng lách tách rất nhẹ ở đầu bài giống như lời nhắc rằng mình không cần chuyển sang thứ khác ngay lập tức.\n\nNghe nhạc theo cách ấy khiến mình để ý hơn đến khoảng lặng giữa hai câu hát, cách nhạc cụ đi vào rồi rời khỏi bản phối.\n\nKhông cần có máy đĩa than mới làm được điều này. Chỉ cần chọn một album, bật từ đầu đến cuối và để điện thoại sang bên cạnh."],
            ['author' => 1, 'category' => 'doi-song', 'title' => 'Chạy trên bãi cỏ, tự nhiên thấy mình nhẹ tênh', 'slug' => 'chay-tren-bai-co-thay-minh-nhe-tenh', 'image' => 'doi-ban-tren-dong-co.jpg', 'content' => "Hồi nhỏ, chạy mà không nhìn đồng hồ là chuyện bình thường. Lớn lên rồi, đôi khi mình biến cả buổi đi bộ thành một mục tiêu cần hoàn thành.\n\nCuối tuần trước, mình thử để điện thoại trong túi, đi ra bãi cỏ gần hồ và chạy một đoạn ngắn. Không đếm bước, không xem tốc độ. Chỉ nghe tiếng gió và cảm nhận chân chạm đất.\n\nMình về nhà vẫn mệt, nhưng đầu óc nhẹ hơn. Có những ngày vận động không cần thành tích; chỉ cần cơ thể được vui."],
            ['author' => 0, 'category' => 'cong-nghe', 'title' => 'Dùng AI để học nhanh hơn mà vẫn giữ được tư duy của mình', 'slug' => 'dung-ai-de-hoc-nhanh-va-giu-tu-duy', 'image' => null, 'content' => "Mình thường nhờ AI giải thích một khái niệm bằng ví dụ đơn giản, sau đó tự viết lại bằng lời của mình. Nếu chưa hiểu, mình hỏi tiếp về phần còn mơ hồ thay vì chép nguyên câu trả lời.\n\nCách này giúp tiết kiệm thời gian tìm điểm bắt đầu, nhưng phần kiểm tra nguồn và kết luận vẫn cần mình tự làm. Một câu trả lời trôi chảy chưa chắc đã đúng.\n\nVới mình, AI hữu ích nhất khi đóng vai người gợi ý và phản biện, còn việc học thật sự vẫn diễn ra lúc mình tự kết nối các ý tưởng."],
            ['author' => 1, 'category' => 'du-lich', 'title' => 'Một ngày ở Đà Lạt không cần lịch trình kín mít', 'slug' => 'mot-ngay-da-lat-khong-can-lich-trinh-day', 'image' => null, 'content' => "Buổi sáng ăn một món nóng, đi bộ qua con dốc có hàng thông, rồi ngồi ở quán nhỏ nhìn sương tan. Buổi chiều chọn một điểm đến mình thật sự thích, thay vì cố ghé thật nhiều nơi.\n\nĐi du lịch chậm có một điều hay: mình nhớ cảm giác của chuyến đi rõ hơn danh sách địa điểm. Mùi cà phê, chiếc áo khoác mượn bạn, đoạn đường bất ngờ đẹp dưới nắng — những thứ ấy ở lại lâu hơn.\n\nLần tới đến Đà Lạt, hãy chừa một khoảng trống trong lịch trình cho điều tình cờ."],
            ['author' => 3, 'category' => 'sach', 'title' => 'Đọc vài trang mỗi tối tốt hơn chờ một ngày thật rảnh', 'slug' => 'doc-vai-trang-moi-toi-tot-hon-cho-ngay-ranh', 'image' => null, 'content' => "Mình từng mua sách rồi chờ cuối tuần mới đọc. Nhưng cuối tuần thường có đủ việc khác chen vào, và cuốn sách cứ nằm nguyên trên bàn.\n\nSau đó mình đổi sang đọc năm trang trước khi ngủ. Có hôm đọc được nhiều hơn, có hôm chỉ đúng năm trang. Điều quan trọng là cuốn sách luôn mở ra và mình không phải bắt đầu lại từ đầu mỗi lần.\n\nMột thói quen nhỏ dễ giữ thường có ích hơn một kế hoạch hoàn hảo chỉ tồn tại trên giấy."],
            ['author' => 2, 'category' => 'am-nhac', 'title' => 'Một album hợp để nghe khi muốn làm mới căn phòng', 'slug' => 'album-nghe-khi-muon-lam-moi-can-phong', 'image' => null, 'content' => "Mình bật một album có nhịp vừa phải, mở cửa sổ rồi dọn từng góc nhỏ. Bài đầu tiên giúp bắt đầu, đến giữa album thì căn phòng đã gọn hơn, còn bài cuối thường vừa lúc mình pha xong một cốc trà.\n\nÂm nhạc không làm việc nhà biến mất, nhưng khiến khoảng thời gian ấy bớt nặng nề. Mỗi người có thể có một album như vậy — nghe vài nốt đầu là biết mình nên bắt tay vào việc.\n\nBạn thường bật gì khi dọn phòng?"],
            ['author' => 4, 'category' => 'thu-cung', 'title' => 'Những điều mình ước biết trước khi nhận nuôi mèo', 'slug' => 'dieu-uoc-biet-truoc-khi-nhan-nuoi-meo', 'image' => null, 'content' => "Mèo không phải lúc nào cũng thích được bế, và mỗi bé cần thời gian khác nhau để quen nhà mới. Mình chuẩn bị khay cát, chỗ trốn yên tĩnh, bát ăn riêng và lịch khám thú y trước ngày đón bé về.\n\nĐiều mình không chuẩn bị được là cảm giác có một sinh vật nhỏ chờ mình về nhà. Đổi lại là trách nhiệm lâu dài: chăm sức khỏe, giữ an toàn và kiên nhẫn khi bé còn sợ.\n\nNhận nuôi là một cam kết, nhưng cũng là một tình bạn rất đặc biệt."],
            ['author' => 0, 'category' => 'hoc-tap', 'title' => 'Cách mình chia một bài tập lớn thành việc nhỏ dễ bắt đầu', 'slug' => 'chia-bai-tap-lon-thanh-viec-nho', 'image' => null, 'content' => "Khi nhìn một bài tập lớn, mình hay nghĩ ngay đến tất cả những gì chưa làm và rồi trì hoãn. Gần đây mình thử viết ra ba bước đầu tiên thật cụ thể: đọc yêu cầu, tạo khung ý, tìm một nguồn tham khảo.\n\nMỗi bước chỉ cần đủ nhỏ để làm trong khoảng hai mươi phút. Sau khi hoàn thành bước đầu, mình thường thấy bước kế tiếp bớt đáng sợ hơn.\n\nKhông phải lúc nào cũng có động lực trước khi bắt đầu. Đôi khi động lực xuất hiện sau khi mình đã làm được một việc nhỏ."],
            ['author' => 1, 'category' => 'doi-song', 'title' => 'Một buổi tối không lướt điện thoại trước khi ngủ', 'slug' => 'mot-buoi-toi-khong-luot-dien-thoai', 'image' => null, 'content' => "Mình để điện thoại sạc ở bàn làm việc, chuẩn bị quần áo cho sáng mai và đọc vài trang sách. Ban đầu tay cứ với sang chỗ cũ theo thói quen, nhưng sau một lúc mình bắt đầu thấy căn phòng yên hơn.\n\nKhông phải tối nào mình cũng làm được. Nhưng chỉ cần thỉnh thoảng có một khoảng nghỉ khỏi thông báo, mình đã dễ nhận ra mình đang mệt hay đang cần điều gì.\n\nBạn có thói quen nhỏ nào giúp kết thúc ngày nhẹ nhàng hơn không?"],
            ['author' => 3, 'category' => 'cong-nghe', 'title' => 'Sao lưu ảnh quan trọng: việc nhỏ nên làm trước khi quá muộn', 'slug' => 'sao-luu-anh-quan-trong-truoc-khi-qua-muon', 'image' => null, 'content' => "Ảnh trong điện thoại thường là bản duy nhất của những khoảnh khắc mình muốn giữ. Mình bắt đầu sao lưu theo tháng, giữ thêm một bản trên ổ cứng và kiểm tra thử xem tệp có mở được không.\n\nMột quy tắc dễ nhớ là giữ ít nhất hai bản ở hai nơi khác nhau. Đừng quên kiểm tra dung lượng và bảo vệ tài khoản bằng xác thực hai bước.\n\nMất vài phút mỗi tháng vẫn tốt hơn phát hiện bản sao lưu chưa từng chạy vào đúng ngày cần nó."],
            ['author' => 2, 'category' => 'du-lich', 'title' => 'Đi bộ qua một khu phố lạ là cách mình nhớ một thành phố', 'slug' => 'di-bo-qua-khu-pho-la-de-nho-thanh-pho', 'image' => null, 'content' => "Mình thích chọn một khu phố rồi đi bộ không mục tiêu quá cụ thể. Có thể là một tiệm bánh nhỏ, một ban công đầy cây hoặc con ngõ dẫn ra bờ sông.\n\nĐi bộ giúp mình nhìn thấy những chi tiết thường bị bỏ qua khi ngồi trên xe: biển hiệu cũ, tiếng rao buổi sáng, cách người dân chào nhau. Những thứ ấy làm thành phố có gương mặt riêng.\n\nChỉ cần mang giày dễ đi, xem trước đường về và dành thời gian quan sát."],
            ['author' => 4, 'category' => 'doi-song', 'title' => 'Nhà có thêm một chú mèo thì những ngày thường cũng khác', 'slug' => 'nha-co-them-mot-chu-meo-ngay-thuong-cung-khac', 'image' => 'meo-di-bien.jpg', 'content' => "Buổi sáng có thêm tiếng chân chạy quanh hành lang. Buổi trưa có một cái bóng nằm đúng chỗ nắng chiếu vào. Tối đến, chú mèo ngồi cạnh bàn như thể đang giám sát mọi việc.\n\nNhịp sống không thay đổi quá nhiều, nhưng mình để ý đến những khoảng nghỉ hơn. Có lúc chỉ cần dừng lại vài phút để chơi với bé, mình đã bớt căng thẳng.\n\nMột người bạn nhỏ không giải quyết mọi chuyện, nhưng khiến căn nhà có thêm tiếng động vui."],
            ['author' => 0, 'category' => 'am-nhac', 'title' => 'Playlist cho chuyến xe buýt về nhà lúc thành phố lên đèn', 'slug' => 'playlist-chuyen-xe-buyt-ve-nha-luc-len-den', 'image' => 'pho-dem-sau-mua.jpg', 'content' => "Mình chọn những bài hát không quá vội, xếp từ vài giai điệu sáng đến những bài dịu hơn ở cuối danh sách. Chuyến xe buýt vẫn đông, đèn đường vẫn lướt qua ô cửa, nhưng tai nghe tạo ra một khoảng riêng vừa đủ.\n\nĐôi khi mình bỏ tai nghe xuống để nghe tiếng thành phố. Những bài hát ấy không làm đường về ngắn hơn, chỉ khiến mình có thời gian nhìn lại một ngày đã qua.\n\nBạn có bài nào luôn nghe trên đường về nhà không?"],
            ['author' => 4, 'category' => 'thu-cung', 'title' => 'Boss nói muốn đi biển, sen chuẩn bị nguyên một kế hoạch', 'slug' => 'boss-meo-muon-di-bien-sen-len-ke-hoach', 'image' => 'meo-den-giua-bien.jpg', 'content' => "Boss bảo muốn ngắm biển. Sen nghe xong chuẩn bị túi vận chuyển, khăn, nước uống, đồ ăn, đồ chơi và cả lịch nghỉ giữa đường. Boss thì chỉ cần ngồi yên nhìn sóng với vẻ mặt rất bình thản.\n\nNhìn ảnh thì chuyến đi có vẻ như một cuộc phiêu lưu lớn, nhưng điều quan trọng nhất vẫn là để bé thấy an toàn và thoải mái. Nếu boss không thích chỗ đông, mình đổi kế hoạch về nhà cũng được.\n\nĐi chơi vui nhất khi cả người lẫn mèo đều không bị ép phải vui theo một lịch trình."],
            ['author' => 1, 'category' => 'doi-song', 'title' => 'Tâm trạng khi lịch làm việc hỏi: hôm nay mình ổn chứ?', 'slug' => 'tam-trang-khi-lich-lam-viec-hoi-minh-on-chu', 'image' => 'tam-trang-lich-lam-viec.jpg', 'content' => "Có những buổi sáng mình mở máy tính với quyết tâm xử lý hết mọi việc. Mười phút sau, danh sách việc cần làm nhìn lại mình bằng ánh mắt rất nghiêm túc.\n\nMình học cách chọn một việc quan trọng nhất, làm từng bước rồi nghỉ ngắn. Không cần biến ngày nào cũng thành ngày năng suất kỷ lục. Có hôm hoàn thành được việc cần thiết và ăn trưa đúng giờ đã là một kết quả tốt.\n\nNếu hôm nay hơi quá tải, thử thu nhỏ danh sách xuống còn ba việc nhé."],
            ['author' => 3, 'category' => 'doi-song', 'title' => 'Khi bạn nói “mình bình tĩnh mà” nhưng deadline đang tới', 'slug' => 'minh-binh-tinh-ma-nhung-deadline-dang-toi', 'image' => 'ngua-binh-tinh.jpg', 'content' => "Mình: cứ từ từ, còn thời gian.\n\nCũng là mình, vài phút sau: mở cùng lúc tài liệu, lịch, ghi chú và ba tab tìm cách làm nhanh hơn.\n\nNhững lúc như vậy, mình cố dừng lại để xác định việc nào thật sự cần làm trước. Chia nhỏ đầu việc và báo sớm nếu cần thêm thời gian thường hiệu quả hơn hoảng loạn một mình.\n\nBạn có câu nào hay tự nói với mình mỗi khi deadline tới gần không?"],
            ['author' => 2, 'category' => 'hoc-tap', 'title' => 'Gương mặt của mình khi giảng viên nói “bài này đơn giản thôi”', 'slug' => 'guong-mat-khi-nghe-bai-nay-don-gian-thoi', 'image' => 'ngua-nghe-bai-don-gian.jpg', 'content' => "Nghe câu “bài này đơn giản thôi”, mình thường gật đầu trước rồi mới mở đề ra đọc kỹ. Đến dòng thứ ba thì bắt đầu tự hỏi có phải mình bỏ lỡ buổi học nào không.\n\nSau vài lần, mình nhận ra hỏi lại phần chưa hiểu không có gì đáng ngại. Ghi rõ chỗ mắc, thử làm một ví dụ nhỏ rồi nhờ bạn hoặc giảng viên giải thích thường giúp mình tiến bộ nhanh hơn.\n\nAi cũng từng có lúc nhìn một bài tập và cần thêm một lời giải thích. Quan trọng là mình tiếp tục hỏi và thử."],
            ['author' => 0, 'category' => 'cong-nghe', 'title' => 'Độ Mixi và sức hút của một góc livestream thân quen', 'slug' => 'do-mixi-suc-hut-cua-goc-livestream-than-quen', 'image' => 'do-mixi-goc-gaming.jpg', 'content' => "Một góc máy tính sáng đèn, vài câu chuyện đời thường và không khí trò chuyện gần gũi — đôi khi đó là điều khiến người xem muốn quay lại một buổi livestream. Độ Mixi là một trong những gương mặt quen thuộc của cộng đồng streamer Việt.\n\nSức hút của nội dung trực tiếp nằm ở cảm giác cùng tham gia: người xem bình luận, người phát sóng phản hồi, rồi cả hai phía tạo nên những khoảnh khắc chỉ có trong buổi hôm đó.\n\nBạn thường thích xem livestream vì game, vì câu chuyện hay vì không khí cộng đồng?"],
            ['author' => 3, 'category' => 'doi-song', 'title' => 'Ảnh chế biến một khoảnh khắc quen thành câu chuyện mới', 'slug' => 'anh-che-bien-khoanh-khac-quen-thanh-cau-chuyen-moi', 'image' => 'do-mixi-trang-phuc-san-khau.jpg', 'content' => "Cộng đồng mạng rất giỏi tưởng tượng: chỉ cần một khung hình quen thuộc được đặt vào bối cảnh mới, mọi người đã có thể nghĩ ra cả câu chuyện. Hình ảnh Độ Mixi trong bộ trang phục sân khấu là ví dụ vui cho sức sáng tạo ấy.\n\nẢnh chế thường vui nhất khi người xem hiểu đây là nội dung biến tấu, không nhầm với ảnh tư liệu hay thông tin thật. Một chút ghi chú rõ ràng giúp trò đùa giữ được sự thoải mái cho cả người được nhắc đến lẫn người xem.\n\nBạn từng thấy phiên bản ảnh chế nào khiến mình bật cười chưa?"],
            ['author' => 1, 'category' => 'doi-song', 'title' => 'Từ ảnh viral của Tú Sena, nghĩ về cách mình đối xử với nhau trên mạng', 'slug' => 'anh-viral-tu-sena-va-su-ton-trong-tren-mang', 'image' => 'tu-sena-ao-mu.jpg', 'content' => "Một gương mặt quen thuộc trong cộng đồng game như Tú Sena có thể xuất hiện trong rất nhiều cuộc trò chuyện và ảnh chế. Nhưng khi bức ảnh gắn với khoảnh khắc riêng tư hoặc sức khỏe, một chút chừng mực sẽ làm không gian mạng dễ chịu hơn.\n\nMình có thể chia sẻ điều khiến mình quan tâm mà không suy đoán chuyện cá nhân, không chế giễu và không biến một hình ảnh thành kết luận về ai đó. Sự tử tế trên mạng đôi khi chỉ bắt đầu từ việc dừng lại trước khi bấm chia sẻ.\n\nGiữ được tiếng cười mà vẫn tôn trọng người thật phía sau bức ảnh — điều đó luôn đáng quý."],
        ];

        foreach ($posts as $postData) {
            $author = $authors[$postData['author']];
            $category = Category::where('slug', $postData['category'])->firstOrFail();
            $coverImage = $postData['image'] ? '/demo-images/'.$postData['image'] : null;

            Post::updateOrCreate(
                ['slug' => $postData['slug']],
                [
                    'title' => $postData['title'],
                    'content' => $postData['content'],
                    'excerpt' => Str::limit(str_replace("\n", ' ', $postData['content']), 180),
                    'cover_image' => $coverImage,
                    'author_id' => $author['id'],
                    'category_id' => $category->id,
                    'status' => 'Published',
                    'view_count' => 0,
                    'published_at' => now()->subDays(random_int(0, 10)),
                ],
            );
        }
    }
}
