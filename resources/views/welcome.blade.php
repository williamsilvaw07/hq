<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>William HQ</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Figtree', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            text-align: center;
            max-width: 32rem;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
            background: linear-gradient(90deg, #f8fafc, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .tagline {
            font-size: 1.125rem;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 2rem;
        }
        .badge {
            display: inline-block;
            font-size: 0.75rem;
            color: #64748b;
            background: rgba(30, 41, 59, 0.8);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            margin-top: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="logo">William HQ</h1>
        <p class="tagline">williamhq.com</p>
        <p class="badge">Laravel · Webhooks & integrations</p>
    </div>
</body>
</html>
