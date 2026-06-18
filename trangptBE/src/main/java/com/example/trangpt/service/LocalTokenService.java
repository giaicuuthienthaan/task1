package com.example.trangpt.service;

import com.example.trangpt.dto.TokenResponse;
import com.example.trangpt.entity.User;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;
import com.nimbusds.jose.jwk.source.ImmutableSecret;           

@Service
public class LocalTokenService {
    private final NimbusJwtEncoder jwtEncoder;
    private final String issuer;

    public LocalTokenService(
            @Value("${app.security.local-jwt-secret}") String localJwtSecret,
            @Value("${app.security.local-jwt-issuer}") String issuer
    ) {
        this.jwtEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(localJwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        this.issuer = issuer;
    }

    public TokenResponse createToken(User user) {
        Instant now = Instant.now();
        long expiresIn = 3600;
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expiresIn))
                .subject(user.getUsername())
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("token_source", "database")
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
        )).getTokenValue();

        return new TokenResponse(token, null, null, expiresIn, "Bearer");
    }
}
