package com.example.trangpt.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminOverviewResponse(
        List<UserItem> users,
        List<RoleItem> roles,
        List<PermissionItem> permissions,
        List<PositionItem> positions
) {
    public record UserItem(
            Long id,
            String username,
            String email,
            String password,
            String fullName,
            Long positionId,
            String positionName,
            String status,
            List<String> roles,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record RoleItem(
            Long id,
            String code,
            String name,
            String description,
            List<String> permissions,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record PermissionItem(
            Long id,
            String code,
            String name,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record PositionItem(
            Long id,
            String code,
            String name,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}
