package com.devops.api.repository;

import com.devops.api.model.Employee;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    boolean existsEmployeeByIdentificator(@NotNull Integer identificator);

    void deleteByIdentificator(Integer identificator);

    Employee getEmployeesById(UUID id);

    Optional<Employee> findByIdentificator(Integer identificator);
}
