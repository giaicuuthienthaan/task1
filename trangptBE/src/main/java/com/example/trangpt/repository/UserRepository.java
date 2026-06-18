package com.example.trangpt.repository;

import com.example.trangpt.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByKeycloakUserId(String keycloakUserId);
}
