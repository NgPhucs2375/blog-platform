#!/bin/sh
set -eu

php artisan migrate --force
php artisan schedule:work --no-interaction &
exec apache2-foreground
