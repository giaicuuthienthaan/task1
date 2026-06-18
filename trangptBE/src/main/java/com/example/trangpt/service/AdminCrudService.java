package com.example.trangpt.service;

import com.example.trangpt.dto.AdminRequests.PositionRequest;
import com.example.trangpt.dto.AdminRequests.ProfileUpdateRequest;
import com.example.trangpt.dto.AdminRequests.RoleRequest;
import com.example.trangpt.dto.AdminRequests.UserRequest;
import com.example.trangpt.entity.Permission;
import com.example.trangpt.entity.Position;
import com.example.trangpt.entity.Role;
import com.example.trangpt.entity.User;
import com.example.trangpt.repository.PermissionRepository;
import com.example.trangpt.repository.PositionRepository;
import com.example.trangpt.repository.RoleRepository;
import com.example.trangpt.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminCrudService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PositionRepository positionRepository;

    public AdminCrudService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PositionRepository positionRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.positionRepository = positionRepository;
    }

    @Transactional
    public void createUser(UserRequest request) {
        User user = new User();
        applyUser(user, request);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> notFound("User not found"));
        applyUser(user, request);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void createRole(RoleRequest request) {
        Role role = new Role();
        applyRole(role, request);
        role.setCreatedAt(LocalDateTime.now());
        role.setUpdatedAt(LocalDateTime.now());
        roleRepository.save(role);
    }

    @Transactional
    public void updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> notFound("Role not found"));
        applyRole(role, request);
        role.setUpdatedAt(LocalDateTime.now());
        roleRepository.save(role);
    }

    @Transactional
    public void assignPermissions(Long roleId, List<String> permissionCodes) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> notFound("Role not found"));
        role.setPermissions(resolvePermissions(permissionCodes));
        role.setUpdatedAt(LocalDateTime.now());
        roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    @Transactional
    public void createPosition(PositionRequest request) {
        Position position = new Position();
        applyPosition(position, request);
        position.setCreatedAt(LocalDateTime.now());
        position.setUpdatedAt(LocalDateTime.now());
        positionRepository.save(position);
    }

    @Transactional
    public void updatePosition(Long id, PositionRequest request) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> notFound("Position not found"));
        applyPosition(position, request);
        position.setUpdatedAt(LocalDateTime.now());
        positionRepository.save(position);
    }

    @Transactional
    public void deletePosition(Long id) {
        positionRepository.deleteById(id);
    }

    @Transactional
    public void updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> notFound("User not found"));
        user.setEmail(request.email());
        user.setPassword(request.password());
        user.setFullName(request.fullName());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private void applyUser(User user, UserRequest request) {
        user.setUsername(request.username());
        user.setKeycloakUserId(request.username());
        user.setEmail(request.email());
        user.setPassword(request.password());
        user.setFullName(request.fullName());
        user.setStatus(request.status());
        user.setPosition(resolvePosition(request.positionId()));
        user.setRoles(resolveRoles(request.roleCodes()));
    }

    private void applyRole(Role role, RoleRequest request) {
        role.setCode(request.code());
        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissions(resolvePermissions(request.permissionCodes()));
    }

    private void applyPosition(Position position, PositionRequest request) {
        position.setCode(request.code());
        position.setName(request.name());
        position.setDescription(request.description());
    }

    private Position resolvePosition(Long positionId) {
        if (positionId == null) {
            return null;
        }
        return positionRepository.findById(positionId)
                .orElseThrow(() -> notFound("Position not found"));
    }

    private Set<Role> resolveRoles(List<String> roleCodes) {
        Set<Role> roles = new HashSet<>();
        if (roleCodes == null) {
            return roles;
        }
        for (String roleCode : roleCodes) {
            if (roleCode == null || roleCode.isBlank()) {
                continue;
            }
            roles.add(roleRepository.findByCode(roleCode.trim())
                    .orElseThrow(() -> notFound("Role not found: " + roleCode)));
        }
        return roles;
    }

    private Set<Permission> resolvePermissions(List<String> permissionCodes) {
        Set<Permission> permissions = new HashSet<>();
        if (permissionCodes == null) {
            return permissions;
        }
        for (String permissionCode : permissionCodes) {
            if (permissionCode == null || permissionCode.isBlank()) {
                continue;
            }
            permissions.add(permissionRepository.findByCode(permissionCode.trim())
                    .orElseThrow(() -> notFound("Permission not found: " + permissionCode)));
        }
        return permissions;
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
