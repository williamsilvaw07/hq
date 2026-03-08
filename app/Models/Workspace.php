<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    protected $fillable = ['name', 'slug'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_users')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function workspaceUsers(): HasMany
    {
        return $this->hasMany(WorkspaceUser::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function creditCards(): HasMany
    {
        return $this->hasMany(CreditCard::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    public function whatsappConnections(): HasMany
    {
        return $this->hasMany(WhatsappConnection::class);
    }

    public function workspaceInvitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class);
    }
}
