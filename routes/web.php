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

    // Fallback before first build: simple redirect to API info
    return redirect('/api');
})->where('path', '(?!api($|/)).*');
