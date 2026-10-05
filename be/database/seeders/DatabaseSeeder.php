<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Tổng hợp', 'slug' => 'tong-hop', 'description' => 'Những câu chuyện và góc nhìn đa dạng.', 'sort_order' => 0],
            ['name' => 'Công nghệ', 'slug' => 'cong-nghe', 'description' => 'Tin tức và góc nhìn công nghệ.', 'sort_order' => 1],
            ['name' => 'Du lịch', 'slug' => 'du-lich', 'description' => 'Trải nghiệm và cẩm nang du lịch.', 'sort_order' => 2],
            ['name' => 'Ẩm thực', 'slug' => 'am-thuc', 'description' => 'Món ngon và văn hóa ẩm thực Việt.', 'sort_order' => 3],
        ];
        foreach ($categories as $data) {
            Category::updateOrCreate(['slug' => $data['slug']], $data + ['display_order' => $data['sort_order']]);
        }

        $author = User::firstOrCreate(
            ['email' => 'editor@blog-platform.local'],
            ['username' => 'editor-demo', 'password' => Str::random(48), 'role' => 'User', 'status' => 'Active'],
        );
        $samples = [
            ['title' => 'Bắt đầu viết blog: những điều mình ước được biết sớm hơn', 'slug' => 'bat-dau-viet-blog-nhung-dieu-nen-biet', 'category' => 'tong-hop', 'content' => 'Viết blog bắt đầu từ một điều bạn thật sự muốn chia sẻ. Hãy chọn chủ đề mình quan tâm, viết đều đặn và dần tìm ra giọng văn riêng. Những bài viết đầu tiên không cần hoàn hảo; điều quan trọng là bắt đầu và lắng nghe độc giả.'],
            ['title' => 'AI tạo sinh thay đổi cách chúng ta làm nội dung như thế nào?', 'slug' => 'ai-tao-sinh-thay-doi-cach-lam-noi-dung', 'category' => 'cong-nghe', 'content' => 'AI có thể giúp nghiên cứu, phác thảo và biên tập nhanh hơn. Trải nghiệm, góc nhìn và trách nhiệm với nội dung vẫn thuộc về người viết. Kết hợp hai phía đúng cách giúp tạo ra nội dung hữu ích và có cá tính.'],
            ['title' => '48 giờ ở Đà Lạt: lịch trình cho người đi lần đầu', 'slug' => '48-gio-o-da-lat-lich-trinh-cho-nguoi-di-lan-dau', 'category' => 'du-lich', 'content' => 'Một chuyến đi ngắn tới Đà Lạt có thể bắt đầu bằng buổi sáng ở chợ, một vòng quanh hồ Xuân Hương và buổi chiều ghé những quán cà phê trên đồi. Hãy dành thời gian khám phá chậm và chuẩn bị áo khoác cho buổi tối se lạnh.'],
            ['title' => 'Phở Nam Định và phở Hà Nội: hai sắc thái của món ăn quen thuộc', 'slug' => 'pho-nam-dinh-va-pho-ha-noi', 'category' => 'am-thuc', 'content' => 'Mỗi vùng có cách nêm nếm và phục vụ phở riêng. Nước dùng, bánh phở và thói quen ăn kèm tạo nên những sắc thái khác nhau, cùng bắt nguồn từ tình yêu dành cho món ăn Việt Nam thân thuộc.'],
        ];
        foreach ($samples as $item) {
            $category = Category::where('slug', $item['category'])->firstOrFail();
            Post::firstOrCreate(['slug' => $item['slug']], [
                'title' => $item['title'], 'content' => $item['content'], 'excerpt' => Str::limit($item['content'], 160),
                'author_id' => $author->id, 'category_id' => $category->id, 'status' => 'Published',
                'view_count' => 0, 'published_at' => now()->subDays(random_int(1, 12)),
            ]);
        }

        if (env('ADMIN_EMAIL') && env('ADMIN_PASSWORD')) {
            User::updateOrCreate(['email' => env('ADMIN_EMAIL')], [
                'username' => env('ADMIN_USERNAME', 'admin'), 'password' => env('ADMIN_PASSWORD'), 'role' => 'Admin', 'status' => 'Active',
            ]);
        }
    }
}
