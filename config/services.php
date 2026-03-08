<?php

return [
    'whatsapp' => [
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    ],
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
    ],
];
