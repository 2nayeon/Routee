USE routeedb;

-- ===========================================================
-- 기존 테이블 초기화
-- ===========================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS schedule_tmp_places;
DROP TABLE IF EXISTS timeline_items;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS folder_places;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================================
-- 1. 사용자 테이블
-- ===========================================================
CREATE TABLE users (
                       user_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
                       username       VARCHAR(50)  NOT NULL UNIQUE,
                       password       VARCHAR(255),
                       email          VARCHAR(100) NOT NULL UNIQUE,
                       role           VARCHAR(20)  NOT NULL DEFAULT 'ROLE_USER',
                       provider       VARCHAR(20)  NOT NULL DEFAULT 'local',
                       provider_id    VARCHAR(255),
                       profile_image  VARCHAR(500),
                       created_at     DATETIME NOT NULL,
                       updated_at     DATETIME NOT NULL
);

-- ===========================================================
-- 2. 장소 캐싱 테이블
-- ===========================================================
CREATE TABLE places (
                        place_id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
                        google_place_id          VARCHAR(255) NOT NULL UNIQUE,
                        place_name               VARCHAR(150) NOT NULL,
                        address                  VARCHAR(255),
                        latitude                 DOUBLE NOT NULL,
                        longitude                DOUBLE NOT NULL,
                        category                 VARCHAR(100),
                        phone_number             VARCHAR(30),
                        website                  VARCHAR(500),
                        rating                   DOUBLE,
                        opening_hours_json       TEXT,
                        opening_hours_updated_at DATETIME
);

-- ===========================================================
-- 3. 북마크 커스텀 폴더 테이블
-- ===========================================================
CREATE TABLE folders (
                         folder_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
                         folder_name VARCHAR(100) NOT NULL,
                         user_id     BIGINT NOT NULL,
                         created_at  DATETIME NOT NULL,
                         FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===========================================================
-- 4. 폴더별 저장된 장소 매핑 테이블
-- ===========================================================
CREATE TABLE folder_places (
                               folder_place_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                               folder_id       BIGINT NOT NULL,
                               place_id        BIGINT NOT NULL,
                               created_at      DATETIME NOT NULL,
                               FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
                               FOREIGN KEY (place_id)  REFERENCES places(place_id)   ON DELETE CASCADE,
                               UNIQUE KEY unique_folder_place (folder_id, place_id)
);

-- ===========================================================
-- 5. 일정 메인 테이블
-- ===========================================================
CREATE TABLE schedules (
                           schedule_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
                           title        VARCHAR(150) NOT NULL,
                           destination  VARCHAR(100),                -- 여행지명 (예: 제주도)
                           member_count INT NOT NULL DEFAULT 1,      -- 인원수
                           start_date   DATE NOT NULL,
                           end_date     DATE NOT NULL,
                           user_id      BIGINT NOT NULL,
                           created_at   DATETIME NOT NULL,
                           updated_at   DATETIME NOT NULL,
                           FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ===========================================================
-- 6. 일정별 상세 타임라인 테이블
-- ===========================================================
CREATE TABLE timeline_items (
                                timeline_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                schedule_id      BIGINT NOT NULL,
                                place_id         BIGINT NOT NULL,
                                visit_order      INT    NOT NULL,
                                visit_date       DATE   NOT NULL,
                                visit_time       TIME,
                                end_time         TIME,
                                conflict_warning TINYINT(1) NOT NULL DEFAULT 0,
                                memo             VARCHAR(500),
                                FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
                                FOREIGN KEY (place_id)    REFERENCES places(place_id)       ON DELETE CASCADE
);

-- ===========================================================
-- 7. 일정별 임시 보관함 (좋아요 → 일정으로 불러올 장소)
-- ===========================================================
CREATE TABLE schedule_tmp_places (
                                     tmp_place_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     schedule_id  BIGINT NOT NULL,
                                     place_id     BIGINT NOT NULL,
                                     created_at   DATETIME NOT NULL,
                                     FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
                                     FOREIGN KEY (place_id)    REFERENCES places(place_id)       ON DELETE CASCADE,
                                     UNIQUE KEY unique_schedule_place (schedule_id, place_id)
);
