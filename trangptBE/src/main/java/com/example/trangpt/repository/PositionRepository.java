package com.example.trangpt.repository;

import com.example.trangpt.entity.Position;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByCode(String code);
}
