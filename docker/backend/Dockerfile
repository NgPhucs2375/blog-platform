FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        curl-dev \
        freetype-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        libzip-dev \
        libxml2-dev \
        oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        dom \
        exif \
        gd \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        simplexml \
        xml \
        zip \
    && rm -rf /tmp/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY --chmod=755 entrypoint.sh /usr/local/bin/blog-backend-entrypoint

ENTRYPOINT ["blog-backend-entrypoint"]

EXPOSE 9000
