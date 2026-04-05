package com.devops.api.service;

import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmployeeService {
    private final EmployeeRepository repository;
    private final Counter createCounter;
    private final Counter updateCounter;
    private final Counter deleteCounter;
    private final Counter getAllCounter;

    public EmployeeService(
            EmployeeRepository repository,
            MeterRegistry meterRegistry
    ) {
        this.repository = repository;

        this.createCounter = Counter.builder("employees.created")
                .description("Total employees created")
                .register(meterRegistry);

        this.updateCounter = Counter.builder("employees.updated")
                .description("Total employees updated")
                .register(meterRegistry);

        this.deleteCounter = Counter.builder("employees.deleted")
                .description("Total employees deleted")
                .register(meterRegistry);

        this.getAllCounter = Counter.builder("employees.list.requests")
                .description("Total requests to list employees")
                .register(meterRegistry);

        Gauge.builder("employees.total", repository, EmployeeRepository::count)
                .description("Current number of employees in the database")
                .register(meterRegistry);
    }

    public ResponseEntity<String> createUser(Employee employee) {
        repository.save(employee);
        createCounter.increment();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Employee created");
    }

    public Employee getEmployee(UUID id) {
        return repository.getEmployeesById(id);
    }

    public long countEmployees() {
        getAllCounter.increment();
        return repository.count();
    }

    @Transactional
    public ResponseEntity<String> updateUser(Employee employee) {
        repository.save(employee);
        updateCounter.increment();
        return ResponseEntity.ok("Employee updated");
    }

    @Transactional
    public ResponseEntity<Void> deleteEmployee(Integer identificator) {
        repository.deleteByIdentificator(identificator);
        deleteCounter.increment();
        return ResponseEntity.noContent().build();
    }
}
