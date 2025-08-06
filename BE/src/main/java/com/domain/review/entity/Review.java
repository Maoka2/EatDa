package com.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false, length = 500)
    private String description;

//    @ElementCollection
//    @CollectionTable(name = "review_menu", joinColumns = @JoinColumn(name = "review_id"))
//    @Column(name = "menu_name")
//    private List<String> menuNames = new ArrayList<>();
//
//    @Column(name = "asset_url", length = 500)
//    private String assetUrl;

//    @Column(name = "created_at", nullable = false)
//    private LocalDateTime createdAt;
//
//    @PrePersist
//    protected void onCreate() {
//        createdAt = LocalDateTime.now();
//    }
}
