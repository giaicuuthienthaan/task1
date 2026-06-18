package com.example.trangpt.service;

import com.example.trangpt.dto.TokenExchangeRequest;
import com.example.trangpt.dto.LoginRequest;
import com.example.trangpt.dto.TokenResponse;
import com.example.trangpt.entity.User;
import com.example.trangpt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class KeycloakTokenService {
    private final RestClient restClient;
    private final UserRepository userRepository;
    private final LocalTokenService localTokenService;
    private final String tokenUri;
    private final String clientId;
    private final String clientSecret;
    private final String superAdminUsername;

    public KeycloakTokenService(
            UserRepository userRepository,
            LocalTokenService localTokenService,
            @Value("${keycloak.token-uri}") String tokenUri,
            @Value("${keycloak.client-id}") String clientId,
            @Value("${keycloak.client-secret}") String clientSecret,
            @Value("${app.security.super-admin-username}") String superAdminUsername
    ) {
        this.restClient = RestClient.builder().build();
        this.userRepository = userRepository;
        this.localTokenService = localTokenService;
        this.tokenUri = tokenUri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.superAdminUsername = superAdminUsername;
    }

    public TokenResponse exchangeCode(TokenExchangeRequest request) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("grant_type", "authorization_code");
        body.add("code", request.code());
        body.add("redirect_uri", request.redirectUri());
        body.add("code_verifier", request.codeVerifier());

        return restClient.post()
                .uri(tokenUri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(TokenResponse.class);
    }

    public TokenResponse login(LoginRequest request) {
        if (!superAdminUsername.equalsIgnoreCase(request.username())) {
            return loginDatabaseUser(request);
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("grant_type", "password");
        body.add("username", request.username());
        body.add("password", request.password());

        return restClient.post()
                .uri(tokenUri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(TokenResponse.class);
    }

    private TokenResponse loginDatabaseUser(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .filter(foundUser -> "ACTIVE".equalsIgnoreCase(foundUser.getStatus()))
                .filter(foundUser -> request.password() != null && request.password().equals(foundUser.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        return localTokenService.createToken(user);
    }
}
