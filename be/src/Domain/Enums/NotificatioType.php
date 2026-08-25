<?php

namespace src\Domain\Enums;

enum NotificationType: string
{
    case POST_APPROVED = 'POST_APPROVED';       // Bài viết đã được duyệt
    case POST_REJECTED = 'POST_REJECTED';       // Bài viết bị từ chối
    case NEW_COMMENT = 'NEW_COMMENT';           // Có bình luận mới trên bài viết
    case COMMENT_REPLY = 'COMMENT_REPLY';       // Có người trả lời bình luận
    case NEW_LIKE = 'NEW_LIKE';                 // Có người thích bài viết
    case NEW_FOLLOWER = 'NEW_FOLLOWER';         // Có người theo dõi mới
    case SYSTEM = 'SYSTEM';                     // Thông báo chung từ hệ thống
}