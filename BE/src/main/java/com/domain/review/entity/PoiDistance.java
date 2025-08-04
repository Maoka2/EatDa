package com.domain.review.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "poi_distance")
public class PoiDistance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long poiId;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private Integer distance; // 거리 (미터 단위)

    @Column(updatable = false)
    private LocalDateTime createdAt;

    public PoiDistance() {}
}
