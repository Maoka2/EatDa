package com.domain.common.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
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

    @NotNull
    @Column(length = 100)
    private String name;

    @NotNull
    @Column(length = 100)
    private String category;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    @Column(name = "raw_code", length = 50)
    private String rawCode;

    // H3 인덱스: 해상도 7 ~ 10까지 별도 컬럼
    @NotNull
    @Column(name = "h3_index_7")
    private Long h3Index7;

    @NotNull
    @Column(name = "h3_index_8")
    private Long h3Index8;

    @NotNull
    @Column(name = "h3_index_9")
    private Long h3Index9;

    @NotNull
    @Column(name = "h3_index_10")
    private Long h3Index10;
}
