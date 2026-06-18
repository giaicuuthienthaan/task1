package com.example.trangpt.dto;

import java.util.List;

public record MeResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String status,
        boolean superAdmin,
        List<String> roles,
        List<String> permissions
) {
}
