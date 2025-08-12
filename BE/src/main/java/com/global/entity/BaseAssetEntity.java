package com.global.entity;

import com.global.constants.AssetType;
import com.global.constants.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class BaseAssetEntity extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    protected AssetType type;

    protected String path;

    @NotBlank
    protected String prompt;

    @NotNull
    @Enumerated(EnumType.STRING)
    protected Status status = Status.PENDING;

    /**
     * Asset 상태 업데이트
     */
    public void updateStatus(Status status) {
        this.status = status;
    }

    /**
     * Asset URL 업데이트
     */
    public void updatePath(String assetUrl) {
        this.path = assetUrl;
    }

    /**
     * Asset 삭제 (BaseEntity의 delete() 메서드 활용)
     */
    public void deleteAsset() {
        this.delete();
    }

    /**
     * 상태 확인 편의 메서드
     */
    public boolean isPending() {
        return Status.PENDING == this.status;
    }

    public boolean isSuccess() {
        return Status.SUCCESS == this.status;
    }

    public boolean isFail() {
        return Status.FAIL == this.status;
    }

    public void processCallback(Status status, String path) {
        this.updateStatus(status);
        if (status.isSuccess() && path != null && !path.isBlank()) {
            this.updatePath(path);
        }
    }

    // 테스트용
    public void setId(Long id) {
        this.id = id;
    }
}
