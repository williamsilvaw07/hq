<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'avatar_url' => 'sometimes|nullable|string|max:500',
        ]);

        $data = $request->only('name', 'email', 'avatar_url');
        if (!empty($data)) {
            $user->update($data);
        }

        return response()->json([
            'data' => $this->userData($user->fresh()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated.']);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,gif,webp|max:2048',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $path = $file->store('avatars/' . $user->id, 'public');
        $url = '/storage/' . $path;

        $user->update(['avatar_url' => $url]);

        return response()->json([
            'data' => $this->userData($user->fresh()),
        ]);
    }

    private function userData($user): array
    {
        return $user->only('id', 'name', 'email', 'avatar_url');
    }
}
