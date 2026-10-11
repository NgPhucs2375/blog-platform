<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::get('/auth/github', function () {
    $clientId = (string) config('services.github.client_id');
    if ($clientId === '') {
        return redirect('/?oauth=github_not_configured');
    }

    $state = Str::random(48);
    session(['github_oauth_state' => $state]);

    return redirect()->away('https://github.com/login/oauth/authorize?'.http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => config('services.github.redirect'),
        'scope' => 'read:user user:email',
        'state' => $state,
    ]));
});

Route::get('/auth/github/callback', function (Request $request) {
    $expectedState = (string) session('github_oauth_state', '');
    session()->forget('github_oauth_state');
    if ($expectedState === '' || ! hash_equals($expectedState, (string) $request->query('state'))) {
        return redirect('/?oauth=github_state_error');
    }
    $data = $request->validate(['code' => 'required|string|max:500']);
    $exchange = Http::asForm()->acceptJson()->timeout(10)->post('https://github.com/login/oauth/access_token', [
        'client_id' => config('services.github.client_id'),
        'client_secret' => config('services.github.client_secret'),
        'code' => $data['code'],
        'redirect_uri' => config('services.github.redirect'),
    ]);
    $accessToken = $exchange->json('access_token');
    if (! $exchange->successful() || ! $accessToken) {
        return redirect('/?oauth=github_exchange_error');
    }
    $apiRequest = $request->duplicate([], ['access_token' => $accessToken]);
    $apiRequest->setMethod('POST');
    $apiRequest->headers->set('Accept', 'application/json');
    $result = app(AuthController::class)->social($apiRequest, 'github')->getData(true);
    if (! ($result['success'] ?? false) || empty($result['data'])) {
        return redirect('/?oauth=github_login_error');
    }

    return response()->view('oauth-complete', ['sessionData' => $result['data']]);
})->middleware('throttle:10,1');

Route::get('/reset-password', fn () => view('welcome'));

Route::get('/', function () {
    return view('welcome');
});
