<!doctype html>
<html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập thành công</title>
<body style="font:16px system-ui;background:#f5f4ee;color:#15241f;display:grid;place-items:center;min-height:100vh"><p>Đang hoàn tất đăng nhập GitHub…</p>
<script>
const data={{ Illuminate\Support\Js::from($sessionData) }};
localStorage.setItem('blog_access',data.access_token);
localStorage.setItem('blog_refresh',data.refresh_token);
localStorage.setItem('blog_user',JSON.stringify(data.user));
location.replace('/');
</script></body></html>