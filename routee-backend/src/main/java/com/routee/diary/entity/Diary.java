package com.routee.diary.entity;

import com.routee.auth.entity.User;
import com.routee.schedule.entity.Schedule;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "diaries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long diaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false, unique = true)
    private Schedule schedule;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 10)
    private String emoji;

    @Column(length = 50)
    private String coverColor;

    @Column(columnDefinition = "LONGTEXT")
    private String photosJson;  // base64 사진 JSON 배열

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void update(String content, String emoji, String coverColor, String photosJson) {
        this.content     = content;
        this.emoji       = emoji;
        this.coverColor  = coverColor;
        this.photosJson  = photosJson;
    }
}
