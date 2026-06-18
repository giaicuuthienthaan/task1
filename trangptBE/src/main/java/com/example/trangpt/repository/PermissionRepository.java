package com.example.trangpt.repository;

import com.example.trangpt.entity.Permission;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByName(String name);

    Optional<Permission> findByCode(String code);
}
