<?php
declare(strict_types=1);

/**
 * Seeder: Tạo chuyên mục + bài viết demo để trang chủ có nội dung.
 * Chạy: docker exec blog_backend php database/seeders/seed_demo.php
 *
 * Seeder idempotent: chạy lại nhiều lần không bị trùng (kiểm tra theo slug).
 */

$host = getenv('DB_HOST') ?: 'postgres';
$port = getenv('DB_PORT') ?: '5432';
$db   = getenv('DB_DATABASE') ?: 'blog_db';
$user = getenv('DB_USERNAME') ?: 'blog_user';
$pass = getenv('DB_PASSWORD') ?: 'blog_secret';

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// ---------- 1. Chuyên mục demo ----------
$categories = [
    ['Công nghệ', 'cong-nghe', 'Tin tức và góc nhìn công nghệ', 1, 1],
    ['Du lịch', 'du-lich', 'Trải nghiệm và cẩm nang du lịch', 2, 2],
    ['Ẩm thực', 'am-thuc', 'Món ngon và văn hoá ẩm thực Việt', 3, 3],
];

$catStmt = $pdo->prepare(
    "INSERT INTO categories (name, slug, description, sort_order, display_order)
     VALUES (:name, :slug, :description, :sort_order, :display_order)
     ON CONFLICT (slug) DO NOTHING"
);
foreach ($categories as [$name, $slug, $desc, $sort, $display]) {
    $catStmt->execute([
        ':name' => $name, ':slug' => $slug, ':description' => $desc,
        ':sort_order' => $sort, ':display_order' => $display,
    ]);
    echo "[ok] Chuyen muc: {$name} ({$slug})\n";
}

$catIds = [];
foreach ($pdo->query("SELECT id, slug FROM categories")->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $catIds[$row['slug']] = (int)$row['id'];
}

// ---------- 2. Tác giả: ưu tiên usertest ----------
$authorStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$authorStmt->execute(['usertest']);
$authorId = $authorStmt->fetchColumn();
if ($authorId === false) {
    $authorStmt->execute(['superadmin']);
    $authorId = $authorStmt->fetchColumn();
}
if ($authorId === false) {
    fwrite(STDERR, "Không tìm thấy tài khoản usertest/superadmin để gán tác giả.\n");
    exit(1);
}
$authorId = (int)$authorId;

// ---------- 3. Bài viết demo (Published) ----------
$posts = [
    [
        'title' => 'Bắt đầu viết blog: những điều mình ước được biết sớm hơn',
        'slug' => 'bat-dau-viet-blog-nhung-dieu-nen-biet',
        'category' => 'tong-hop',
        'views' => 1250,
        'days_ago' => 1,
        'content' => "Viết blog không khó như nhiều người tưởng. Điều khó nhất không phải là kỹ năng viết, mà là vượt qua trang giấy trắng đầu tiên. Bài viết này tổng hợp những kinh nghiệm thực tế sau nhiều năm duy trì blog cá nhân.\n\nThứ nhất, hãy chọn một chủ đề bạn thật sự quan tâm. Đừng chạy theo xu hướng nếu bạn không có gì để nói về nó. Độc giả nhận ra ngay sự hời hợt. Một blog về trồng rau ban công viết bằng đam mê sẽ hấp dẫn hơn nhiều so với blog công nghệ viết cho có.\n\nThứ hai, đặt lịch viết cố định. Mỗi tuần một bài là nhịp độ bền vững cho người mới. Viết đều quan trọng hơn viết hay, vì kỹ năng chỉ cải thiện qua từng bài.\n\nThứ ba, đừng ám ảnh lượt xem trong ba tháng đầu. Hãy coi giai đoạn này là lúc luyện tay nghề và tìm giọng văn riêng. Khi đã có vài chục bài chất lượng, độc giả sẽ tự tìm đến.\n\nCuối cùng, tương tác với cộng đồng. Đọc blog người khác, bình luận chân thành, tham gia các nhóm viết lách. Viết lách là hành trình dài, và bạn không cần đi một mình.",
    ],
    [
        'title' => 'AI tạo sinh thay đổi cách chúng ta làm nội dung như thế nào?',
        'slug' => 'ai-tao-sinh-thay-doi-cach-lam-noi-dung',
        'category' => 'cong-nghe',
        'views' => 2380,
        'days_ago' => 2,
        'content' => "Trí tuệ nhân tạo tạo sinh đang định hình lại toàn bộ quy trình sản xuất nội dung, từ khâu lên ý tưởng đến biên tập và phân phối. Nhưng thay vì lo sợ bị thay thế, người làm nội dung nên xem AI như một cộng sự đắc lực.\n\nAI làm tốt nhất ở khâu nghiên cứu sơ bộ và phác thảo. Bạn có thể nhờ AI tổng hợp thông tin nền, gợi ý dàn ý, hay kiểm tra lỗi chính tả trong vài giây. Những việc tốn hàng giờ trước đây giờ chỉ còn vài phút.\n\nTuy nhiên, AI vẫn yếu ở những thứ làm nên giá trị của một bài viết hay: trải nghiệm cá nhân, góc nhìn độc đáo và cảm xúc chân thật. Một bài review quán ăn do AI viết sẽ không bao giờ có mùi thơm của món ăn hay tiếng xèo xèo trên chảo.\n\nCông thức hiệu quả nhất hiện nay là con người dẫn dắt, AI hỗ trợ. Bạn chịu trách nhiệm về ý tưởng, trải nghiệm và quan điểm. AI lo phần việc nặng nhọc lặp lại. Kết hợp đúng cách, năng suất có thể tăng gấp nhiều lần mà chất lượng không hề giảm.",
    ],
    [
        'title' => '48 giờ ở Đà Lạt: lịch trình cho người đi lần đầu',
        'slug' => '48-gio-o-da-lat-lich-trinh-cho-nguoi-di-lan-dau',
        'category' => 'du-lich',
        'views' => 3120,
        'days_ago' => 3,
        'content' => "Đà Lạt luôn là điểm đến gây thương nhớ, nhưng đi sao cho đáng với chỉ hai ngày cuối tuần? Dưới đây là lịch trình gọn nhẹ dành cho người lần đầu đặt chân đến thành phố sương mù.\n\nNgày một, buổi sáng dạo chợ Đà Lạt và ăn bánh mì xíu mại nóng hổi. Buổi chiều ghé Dinh Bảo Đại và nhà thờ Con Gà, hai công trình mang đậm dấu ấn kiến trúc Pháp. Tối đến, đừng bỏ qua sữa đậu nành nóng ở Tăng Bạt Hổ và dạo hồ Xuân Hương lộng gió.\n\nNgày hai, dậy sớm săn mây ở đồi Đa Phú hoặc cầu Đất. Sau bữa sáng với bánh ướt lòng gà, dành buổi chiều cho Thung lũng Tình Yêu hoặc Langbiang nếu thích vận động. Trước khi về, nhớ mua dâu tây, hồng treo gió và trà atiso làm quà.\n\nMẹo nhỏ: thuê xe máy theo ngày sẽ linh hoạt hơn taxi rất nhiều, giá chỉ khoảng một trăm năm mươi nghìn đồng. Và luôn mang theo áo khoác mỏng, vì Đà Lạt về đêm se lạnh quanh năm.",
    ],
    [
        'title' => 'Phở bò Nam Định và phở Hà Nội: khác nhau ở đâu?',
        'slug' => 'pho-bo-nam-dinh-va-pho-ha-noi-khac-nhau-o-dau',
        'category' => 'am-thuc',
        'views' => 1875,
        'days_ago' => 5,
        'content' => "Phở là niềm tự hào của ẩm thực Việt, nhưng ít ai biết cuộc tranh luận âm ỉ giữa phở bò Nam Định và phở Hà Nội đã kéo dài hàng chục năm. Vậy thực sự chúng khác nhau ở đâu?\n\nNước dùng là điểm khác biệt lớn nhất. Phở Nam Định thường đậm đà, béo ngậy hơn nhờ cách ninh xương kỹ và nêm nếm mạnh tay. Phở Hà Nội thanh tao, trong vắt, ngọt dịu từ xương mà không cần nhiều gia vị.\n\nSợi phở Nam Định to bản, mềm dai, trong khi sợi phở Hà Nội mảnh mai hơn. Bánh phở ngon phải vừa chín tới, không nát, quyện nước dùng mà không hút hết vị mặn.\n\nVề thịt bò, cả hai đều dùng tái, nạm, gầu, gân đầy đủ. Nhưng người Nam Định có thói quen đập dập gừng nướng cho vào nước dùng, tạo mùi thơm nồng đặc trưng khó lẫn.\n\nDù thuộc phe nào, một bát phở ngon vẫn cần đủ ba yếu tố: nước trong, bánh mềm, thịt tươi. Và quan trọng nhất là được ăn nóng, kèm quẩy giòn và chanh ớt tươi.",
    ],
    [
        'title' => 'Làm việc từ xa hiệu quả: thiết lập góc làm việc tại nhà',
        'slug' => 'lam-viec-tu-xa-hieu-qua-thiet-lap-goc-lam-viec-tai-nha',
        'category' => 'cong-nghe',
        'views' => 940,
        'days_ago' => 7,
        'content' => "Làm việc từ xa mang lại tự do, nhưng cũng dễ khiến năng suất trượt dốc nếu không có kỷ luật. Bí quyết nằm ở ba thứ: không gian, thời gian biểu và ranh giới rõ ràng.\n\nTrước hết, hãy dành một góc cố định chỉ để làm việc, dù chỉ là một chiếc bàn nhỏ cạnh cửa sổ. Não bộ cần tín hiệu không gian để chuyển sang chế độ tập trung. Làm việc trên giường hay sofa là con đường nhanh nhất đến sự uể oải.\n\nTiếp theo, giữ giờ giấc như đi văn phòng. Thức dậy, thay đồ chỉnh tề rồi mới ngồi vào bàn. Nghe có vẻ hình thức, nhưng nghi thức này giúp tâm lý sẵn sàng cho ngày làm việc.\n\nCuối cùng, học cách ngắt kết nối. Tắt thông báo công việc sau giờ hành chính, đóng laptop và cất đi. Khi nhà cũng là văn phòng, ranh giới duy nhất bảo vệ bạn khỏi kiệt sức chính là kỷ luật tự giác.",
    ],
];

$checkStmt = $pdo->prepare("SELECT id FROM posts WHERE slug = ?");
$insertStmt = $pdo->prepare(
    "INSERT INTO posts (title, slug, content, author_id, category_id, status, view_count, created_at, updated_at)
     VALUES (:title, :slug, :content, :author_id, :category_id, 'Published', :view_count, :created_at, :updated_at)"
);

foreach ($posts as $p) {
    $checkStmt->execute([$p['slug']]);
    if ($checkStmt->fetch()) {
        echo "[bo qua] Bai viet da ton tai: {$p['slug']}\n";
        continue;
    }
    $ts = date('Y-m-d H:i:s', strtotime("-{$p['days_ago']} days"));
    $insertStmt->execute([
        ':title' => $p['title'],
        ':slug' => $p['slug'],
        ':content' => $p['content'],
        ':author_id' => $authorId,
        ':category_id' => $catIds[$p['category']] ?? $catIds['tong-hop'],
        ':view_count' => $p['views'],
        ':created_at' => $ts,
        ':updated_at' => $ts,
    ]);
    echo "[ok] Bai viet: {$p['title']}\n";
}

echo "Seed demo hoan tat.\n";
