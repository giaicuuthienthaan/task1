package com.example.trangpt.service;

import com.example.trangpt.dto.MeResponse;
import com.example.trangpt.entity.Permission;
import com.example.trangpt.entity.Role;
import com.example.trangpt.entity.User;
import com.example.trangpt.repository.UserRepository;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final String superAdminUsername;
    private final Set<String> superAdminRoles;

    public AuthService(
            UserRepository userRepository,
            @Value("${app.security.super-admin-username}") String superAdminUsername,
            @Value("${app.security.super-admin-roles}") List<String> superAdminRoles
    ) {
        this.userRepository = userRepository;
        this.superAdminUsername = superAdminUsername;
        this.superAdminRoles = normalize(superAdminRoles);
    }

    @Transactional(readOnly = true)
    public MeResponse getCurrentUser(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing JWT");
        }

        String username = jwt.getClaimAsString("preferred_username");
        Set<String> keycloakRoles = extractKeycloakRoles(jwt);

        if (isSuperAdmin(username, keycloakRoles)) {
            return new MeResponse(
                    null,
                    username,
                    jwt.getClaimAsString("email"),
                    jwt.getClaimAsString("name"),
                    "ACTIVE",
                    true,
                    List.of("SUPER_ADMIN"),
                    List.of("*")
            );
        }

        User user = findUser(username)
                .filter(this::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not allowed"));

        List<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .filter(Objects::nonNull)
                .sorted()
                .toList();

        List<String> permissions = user.getRoles().stream()
                .map(Role::getPermissions)
                .flatMap(Collection::stream)
                .map(Permission::getCode)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        return new MeResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus(),
                false,
                roles,
                permissions
        );
    }

    private Optional<User> findUser(String username) {
        return userRepository.findByUsername(username);
    }

    private boolean isSuperAdmin(String username, Set<String> keycloakRoles) {
        if (superAdminUsername.equalsIgnoreCase(username)) {
            return true;
        }
        Set<String> normalizedRoles = normalize(keycloakRoles);
        return superAdminRoles.stream().anyMatch(normalizedRoles::contains);
    }

    private boolean isActive(User user) {
        return "ACTIVE".equalsIgnoreCase(user.getStatus());
    }

    private Set<String> extractKeycloakRoles(Jwt jwt) {
        Set<String> roles = new LinkedHashSet<>();
        addRealmRoles(jwt, roles);
        addClientRoles(jwt, roles);
        return roles;
    }

    private void addRealmRoles(Jwt jwt, Set<String> roles) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return;
        }
        Object realmRoles = realmAccess.get("roles");
        if (realmRoles instanceof Collection<?> values) {
            values.stream().filter(String.class::isInstance).map(String.class::cast).forEach(roles::add);
        }
    }

    private void addClientRoles(Jwt jwt, Set<String> roles) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess == null) {
            return;
        }
        for (Object clientAccess : resourceAccess.values()) {
            if (!(clientAccess instanceof Map<?, ?> access)) {
                continue;
            }
            Object clientRoles = access.get("roles");
            if (!(clientRoles instanceof Collection<?> values)) {
                continue;
            }
            values.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .forEach(roles::add);
        }
    }

    private Set<String> normalize(Collection<String> values) {
        if (values == null) {
            return Collections.emptySet();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
    }
}
