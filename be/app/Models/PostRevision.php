<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostRevision extends Model
{
    public $timestamps = false;

    protected $fillable = ['post_id', 'user_id', 'title', 'content', 'excerpt', 'created_at'];
}
