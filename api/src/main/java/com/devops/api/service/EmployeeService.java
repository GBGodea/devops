package com.devops.api.service;

import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmployeeService {
    private final EmployeeRepository repository;

    public EmployeeService(
            EmployeeRepository repository
    ) {
        this.repository = repository;
    }

    public ResponseEntity<String> createUser(Employee employee) {
        repository.save(employee);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Employee created");
    }

    public Employee getEmployee(UUID id) {
        return repository.getEmployeesById(id);
    }

    @Transactional
    public ResponseEntity<String> updateUser(Employee employee) {
        repository.save(employee);
        return ResponseEntity.ok("Employee updated");
    }

    @Transactional
    public ResponseEntity<Void> deleteEmployee(Integer identificator) {
        repository.deleteByIdentificator(identificator);
        return ResponseEntity.noContent().build();
    }
}
