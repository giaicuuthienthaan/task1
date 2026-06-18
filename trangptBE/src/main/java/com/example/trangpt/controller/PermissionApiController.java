package com.example.trangpt.controller;

import com.example.trangpt.dto.AdminOverviewResponse;
import com.example.trangpt.dto.AdminOverviewResponse.PermissionItem;
import com.example.trangpt.dto.AdminOverviewResponse.RoleItem;
import com.example.trangpt.dto.AdminOverviewResponse.UserItem;
import com.example.trangpt.dto.AdminRequests.PermissionAssignRequest;
import com.example.trangpt.dto.AdminRequests.ProfileUpdateRequest;
import com.example.trangpt.dto.AdminRequests.RoleRequest;
import com.example.trangpt.dto.AdminRequests.UserRequest;
import com.example.trangpt.dto.MeResponse;
import com.example.trangpt.service.AdminCrudService;
import com.example.trangpt.service.AdminOverviewService;
import com.example.trangpt.service.AuthService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class PermissionApiController {
    private final AuthService authService;
    private final AdminOverviewService adminOverviewService;
    private final AdminCrudService adminCrudService;

    public PermissionApiController(
            AuthService authService,
            AdminOverviewService adminOverviewService,
            AdminCrudService adminCrudService
    ) {
        this.authService = authService;
        this.adminOverviewService = adminOverviewService;
        this.adminCrudService = adminCrudService;
    }

    @GetMapping("/dashboard")
    public AdminOverviewResponse dashboard(@AuthenticationPrincipal Jwt jwt) {
        requirePermission(jwt, "DASHBOARD_VIEW");
        return adminOverviewService.getOverview();
    }

    @GetMapping("/profile")
    public MeResponse profile(@AuthenticationPrincipal Jwt jwt) {
        requirePermission(jwt, "PROFILE_VIEW");
        return authService.getCurrentUser(jwt);
    }

    @PutMapping("/profile")
    public void updateProfile(@AuthenticationPrincipal Jwt jwt, @RequestBody ProfileUpdateRequest request) {
        MeResponse me = requirePermission(jwt, "PROFILE_UPDATE");
        adminCrudService.updateProfile(me.username(), request);
    }

    @GetMapping("/users")
    public List<UserItem> users(@AuthenticationPrincipal Jwt jwt) {
        requirePermission(jwt, "USER_VIEW");
        return adminOverviewService.getOverview().users();
    }

    @PostMapping("/users")
    public void createUser(@AuthenticationPrincipal Jwt jwt, @RequestBody UserRequest request) {
        requirePermission(jwt, "USER_CREATE");
        adminCrudService.createUser(request);
    }

    @PutMapping("/users/{id}")
    public void updateUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody UserRequest request) {
        requirePermission(jwt, "USER_UPDATE");
        adminCrudService.updateUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requirePermission(jwt, "USER_DELETE");
        adminCrudService.deleteUser(id);
    }

    @GetMapping("/roles")
    public List<RoleItem> roles(@AuthenticationPrincipal Jwt jwt) {
        requirePermission(jwt, "ROLE_VIEW");
        return adminOverviewService.getOverview().roles();
    }

    @PostMapping("/roles")
    public void createRole(@AuthenticationPrincipal Jwt jwt, @RequestBody RoleRequest request) {
        requirePermission(jwt, "ROLE_CREATE");
        adminCrudService.createRole(request);
    }

    @PutMapping("/roles/{id}")
    public void updateRole(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody RoleRequest request) {
        requirePermission(jwt, "ROLE_UPDATE");
        adminCrudService.updateRole(id, request);
    }

    @DeleteMapping("/roles/{id}")
    public void deleteRole(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requirePermission(jwt, "ROLE_DELETE");
        adminCrudService.deleteRole(id);
    }

    @GetMapping("/permissions")
    public List<PermissionItem> permissions(@AuthenticationPrincipal Jwt jwt) {
        requirePermission(jwt, "PERMISSION_VIEW");
        return adminOverviewService.getOverview().permissions();
    }

    @PutMapping("/roles/{id}/permissions")
    public void assignPermissions(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestBody PermissionAssignRequest request
    ) {
        requirePermission(jwt, "PERMISSION_ASSIGN");
        adminCrudService.assignPermissions(id, request.permissionCodes());
    }

    private MeResponse requirePermission(Jwt jwt, String permission) {
        MeResponse me = authService.getCurrentUser(jwt);
        if (me.superAdmin() || me.permissions().contains(permission)) {
            return me;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing permission: " + permission);
    }
}
