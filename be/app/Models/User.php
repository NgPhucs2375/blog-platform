<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['username', 'email', 'password', 'role', 'status', 'bio', 'google_id', 'created_by', 'updated_by', 'deleted_by'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function apiArray(): array
    {
        return [
            'id' => $this->id,
            'userName' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'isActive' => $this->status === 'Active',
            'createdAt' => $this->created_at?->toISOString(),
            'createdBy' => $this->created_by,
            'updatedAt' => $this->updated_at?->toISOString(),
            'updatedBy' => $this->updated_by,
            'deletedAt' => $this->deleted_at?->toISOString(),
            'deletedBy' => $this->deleted_by,
            'isDeleted' => $this->trashed(),
        ];
    }
}
