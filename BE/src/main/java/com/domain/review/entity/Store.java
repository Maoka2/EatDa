package com.domain.review.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "store")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

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
