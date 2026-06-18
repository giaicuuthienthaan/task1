package com.example.trangpt.dto;

public record TokenExchangeRequest(
        String code,
        String redirectUri,
        String codeVerifier
) {
}
