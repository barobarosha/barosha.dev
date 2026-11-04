-- ============================================================
-- Таблица отзывов сайта baroshacode.ru
-- Выполнить один раз в phpMyAdmin (ISPmanager → Базы данных → phpMyAdmin)
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL COMMENT 'Имя автора отзыва',
  project    VARCHAR(255) NOT NULL COMMENT 'Проект, с которым работали',
  text       TEXT         NOT NULL COMMENT 'Текст отзыва',
  approved   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '0 = ждёт проверки, 1 = опубликован',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Как одобрять отзывы:
-- 1. phpMyAdmin → база → таблица reviews → вкладка «Обзор».
-- 2. У нового отзыва (approved = 0) нажать «Изменить».
-- 3. Поставить approved = 1 и сохранить — отзыв сразу появится на сайте.
-- Плохой/спам-отзыв можно просто удалить кнопкой «Удалить».
