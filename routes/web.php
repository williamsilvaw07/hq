<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (Fintech Tracker SPA)
|--------------------------------------------------------------------------
| All non-API GET requests serve the Next.js app (built to public/).
*/

Route::get('/{path?}', function () {
    $path = request()->path();

    // Serve Next.js static export: /dashboard -> public/dashboard/index.html, etc.
    if ($path && file_exists(public_path($path . '/index.html'))) {
        return response()->file(public_path($path . '/index.html'));
    }

    // Default: serve the SPA entry (root index.html)
    $index = public_path('index.html');
    if (file_exists($index)) {
        return response()->file($index);
    }

    // Fallback before frontend is built: simple message (build frontend and copy out/* to public/)
    return response('<html><head><title>William HQ</title></head><body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem"><h1>William HQ</h1><p>Fintech Tracker will appear here once the frontend is built and deployed.</p><p><a href="/api">API</a></p></body></html>', 200, ['Content-Type' => 'text/html']);
})->where('path', '(?!api($|/)).*');
