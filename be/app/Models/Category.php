<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'sort_order', 'display_order', 'created_by', 'updated_by'];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function apiArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'slug' => $this->slug,
            'description' => $this->description, 'sortOrder' => $this->sort_order,
            'displayOrder' => $this->display_order];
    }
}
