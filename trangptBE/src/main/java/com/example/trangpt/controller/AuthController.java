package com.example.trangpt.controller;

import com.example.trangpt.dto.MeResponse;
import com.example.trangpt.dto.LoginRequest;
import com.example.trangpt.dto.TokenExchangeRequest;
import com.example.trangpt.dto.TokenResponse;
import com.example.trangpt.service.AuthService;
import com.example.trangpt.service.KeycloakTokenService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
public class AuthController {
    private final AuthService authService;
    private final KeycloakTokenService keycloakTokenService;

    public AuthController(AuthService authService, KeycloakTokenService keycloakTokenService) {
        this.authService = authService;
        this.keycloakTokenService = keycloakTokenService;
    }

    @PostMapping("/api/auth/token")
    public TokenResponse exchangeToken(@RequestBody TokenExchangeRequest request) {
        return keycloakTokenService.exchangeCode(request);
    }

    @PostMapping("/api/auth/login")
    public TokenResponse login(@RequestBody LoginRequest request) {
        return keycloakTokenService.login(request);
    }

    @GetMapping({"/api/me", "/api/auth/me"})
    public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        return authService.getCurrentUser(jwt);
    }
}
