package com.domain.review.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "store")
public class Store {
    @Id
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private String licenseUrl;

    @Column(length = 20)
    private String status;

    @Column(nullable = false)
    private Long ownerId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // H3 인덱스: 해상도 7 ~ 10까지 별도 컬럼
    @Column(name = "h3_index_7")
    private Long h3Index7;

    @Column(name = "h3_index_8")
    private Long h3Index8;

    @Column(name = "h3_index_9")
    private Long h3Index9;

    @Column(name = "h3_index_10")
    private Long h3Index10;
}
