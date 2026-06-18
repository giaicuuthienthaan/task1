package com.example.trangpt.controller;

import com.example.trangpt.dto.AdminOverviewResponse;
import com.example.trangpt.dto.AdminRequests.PositionRequest;
import com.example.trangpt.dto.AdminRequests.RoleRequest;
import com.example.trangpt.dto.AdminRequests.UserRequest;
import com.example.trangpt.dto.MeResponse;
import com.example.trangpt.service.AdminCrudService;
import com.example.trangpt.service.AdminOverviewService;
import com.example.trangpt.service.AuthService;
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
@RequestMapping("/api/admin")
public class AdminController {
    private final AuthService authService;
    private final AdminOverviewService adminOverviewService;
    private final AdminCrudService adminCrudService;

    public AdminController(
            AuthService authService,
            AdminOverviewService adminOverviewService,
            AdminCrudService adminCrudService
    ) {
        this.authService = authService;
        this.adminOverviewService = adminOverviewService;
        this.adminCrudService = adminCrudService;
    }

    @GetMapping("/overview")
    public AdminOverviewResponse overview(@AuthenticationPrincipal Jwt jwt) {
        requireSuperAdmin(jwt);
        return adminOverviewService.getOverview();
    }

    @PostMapping("/users")
    public void createUser(@AuthenticationPrincipal Jwt jwt, @RequestBody UserRequest request) {
        requireSuperAdmin(jwt);
        adminCrudService.createUser(request);
    }

    @PutMapping("/users/{id}")
    public void updateUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody UserRequest request) {
        requireSuperAdmin(jwt);
        adminCrudService.updateUser(id, request);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireSuperAdmin(jwt);
        adminCrudService.deleteUser(id);
    }

    @PostMapping("/roles")
    public void createRole(@AuthenticationPrincipal Jwt jwt, @RequestBody RoleRequest request) {
        requireSuperAdmin(jwt);
        adminCrudService.createRole(request);
    }

    @PutMapping("/roles/{id}")
    public void updateRole(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody RoleRequest request) {
        requireSuperAdmin(jwt);
        adminCrudService.updateRole(id, request);
    }

    @DeleteMapping("/roles/{id}")
    public void deleteRole(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireSuperAdmin(jwt);
        adminCrudService.deleteRole(id);
    }

    @PostMapping("/positions")
    public void createPosition(@AuthenticationPrincipal Jwt jwt, @RequestBody PositionRequest request) {
        requireSuperAdmin(jwt);
        adminCrudService.createPosition(request);
    }

    @PutMapping("/positions/{id}")
    public void updatePosition(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestBody PositionRequest request
    ) {
        requireSuperAdmin(jwt);
        adminCrudService.updatePosition(id, request);
    }

    @DeleteMapping("/positions/{id}")
    public void deletePosition(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        requireSuperAdmin(jwt);
        adminCrudService.deletePosition(id);
    }

    private void requireSuperAdmin(Jwt jwt) {
        MeResponse me = authService.getCurrentUser(jwt);
        if (!me.superAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super Admin access required");
        }
    }
}
