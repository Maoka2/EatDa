package com.domain.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Builder
@Entity
@Table(name = "poi",
        indexes = {
                @Index(name = "idx_h3_7", columnList = "h3_index_7"),
                @Index(name = "idx_h3_8", columnList = "h3_index_8"),
                @Index(name = "idx_h3_9", columnList = "h3_index_9"),
                @Index(name = "idx_h3_10", columnList = "h3_index_10")
        }
)
@NoArgsConstructor
@AllArgsConstructor
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "raw_code", length = 50)
    private String rawCode;

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
