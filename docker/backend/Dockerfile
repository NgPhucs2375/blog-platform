FROM php:8.3-fpm-alpine

# Cài đặt các thư viện hệ thống cần thiết cho PostgreSQL và công cụ biên dịch
RUN apk add --no-cache \
    libpq-dev \
    git \
    unzip \
    linux-headers \
    $PHPIZE_DEPS

# Cài đặt PHP extensions cho Database và Opcache
RUN docker-php-ext-install pdo pdo_pgsql pgsql opcache

# Cài đặt Redis và Xdebug bản tương thích mới nhất
RUN pecl install redis xdebug \
    && docker-php-ext-enable redis xdebug \
    && rm -rf /tmp/pear

# Cài đặt Composer 2.7
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 9000

CMD ["php-fpm"]