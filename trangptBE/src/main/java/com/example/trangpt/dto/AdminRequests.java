package com.example.trangpt.dto;

import java.util.List;

public final class AdminRequests {
    private AdminRequests() {
    }

    public record UserRequest(
            String username,
            String email,
            String password,
            String fullName,
            Long positionId,
            String status,
            List<String> roleCodes
    ) {
    }

    public record RoleRequest(
            String code,
            String name,
            String description,
            List<String> permissionCodes
    ) {
    }

    public record PositionRequest(
            String code,
            String name,
            String description
    ) {
    }

    public record PermissionAssignRequest(
            List<String> permissionCodes
    ) {
    }

    public record ProfileUpdateRequest(
            String email,
            String password,
            String fullName
    ) {
    }
}
