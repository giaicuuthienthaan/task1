package com.example.trangpt.service;

import com.example.trangpt.dto.AdminOverviewResponse;
import com.example.trangpt.dto.AdminOverviewResponse.PermissionItem;
import com.example.trangpt.dto.AdminOverviewResponse.PositionItem;
import com.example.trangpt.dto.AdminOverviewResponse.RoleItem;
import com.example.trangpt.dto.AdminOverviewResponse.UserItem;
import com.example.trangpt.entity.Permission;
import com.example.trangpt.entity.Position;
import com.example.trangpt.entity.Role;
import com.example.trangpt.entity.User;
import com.example.trangpt.repository.PermissionRepository;
import com.example.trangpt.repository.PositionRepository;
import com.example.trangpt.repository.RoleRepository;
import com.example.trangpt.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOverviewService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PositionRepository positionRepository;

    public AdminOverviewService(
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

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        return new AdminOverviewResponse(
                userRepository.findAll().stream().map(this::toUserItem).toList(),
                roleRepository.findAll().stream().map(this::toRoleItem).toList(),
                permissionRepository.findAll().stream().map(this::toPermissionItem).toList(),
                positionRepository.findAll().stream().map(this::toPositionItem).toList()
        );
    }

    private UserItem toUserItem(User user) {
        Position position = user.getPosition();
        List<String> roles = user.getRoles().stream()
                .map(Role::getCode)
                .sorted()
                .toList();

        return new UserItem(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getFullName(),
                position == null ? null : position.getId(),
                position == null ? null : position.getName(),
                user.getStatus(),
                roles,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private RoleItem toRoleItem(Role role) {
        List<String> permissions = role.getPermissions().stream()
                .map(Permission::getCode)
                .sorted()
                .toList();

        return new RoleItem(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                permissions,
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }

    private PermissionItem toPermissionItem(Permission permission) {
        return new PermissionItem(
                permission.getId(),
                permission.getCode(),
                permission.getName(),
                permission.getDescription(),
                permission.getCreatedAt(),
                permission.getUpdatedAt()
        );
    }

    private PositionItem toPositionItem(Position position) {
        return new PositionItem(
                position.getId(),
                position.getCode(),
                position.getName(),
                position.getDescription(),
                position.getCreatedAt(),
                position.getUpdatedAt()
        );
    }
}
