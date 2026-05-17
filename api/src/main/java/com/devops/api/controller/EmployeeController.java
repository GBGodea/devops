package com.devops.api.controller;

import com.devops.api.dto.EmployeeRequest;
import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import com.devops.api.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "*"
})
public class EmployeeController {
    private final EmployeeRepository repository;
    private final EmployeeService employeeService;

    public EmployeeController(
            EmployeeRepository repository,
            EmployeeService employeeService
    ) {
        this.repository = repository;
        this.employeeService = employeeService;
    }

    @PostMapping("/employees")
    public ResponseEntity<String> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        if (repository.existsEmployeeByIdentificator(request.getIdentificator())) {
            return ResponseEntity.
                    status(HttpStatus.CONFLICT)
                    .body("Employee already exists");
        }

        Employee employee = toEmployee(request, null);
        return employeeService.createUser(employee);
    }

    @GetMapping("/employees")
    public List<Employee> getAllEmployees() {
        employeeService.countEmployees();
        return repository.findAll();
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<String> updateEmployee(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeRequest request) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Employee employee = toEmployee(request, id);
        return employeeService.updateUser(employee);
    }

    @DeleteMapping("/employees/{identificator}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Integer identificator) {
        if (!repository.existsEmployeeByIdentificator(identificator)) {
            return ResponseEntity.notFound().build();
        }

        return employeeService.deleteEmployee(identificator);
    }

    private static Employee toEmployee(EmployeeRequest request, UUID id) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setIdentificator(request.getIdentificator());
        employee.setName(request.getName());
        employee.setSurname(request.getSurname());
        employee.setPatronymic(request.getPatronymic());
        employee.setPosition(request.getPosition());
        employee.setSalary(request.getSalary());
        return employee;
    }
}
