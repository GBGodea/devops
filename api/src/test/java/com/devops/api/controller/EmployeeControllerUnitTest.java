package com.devops.api.controller;

import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import com.devops.api.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeControllerUnitTest {

    @Test
    void createEmployee_returns409_whenIdentificatorAlreadyExists() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        Employee payload = new Employee();
        payload.setIdentificator(1);

        when(repo.existsEmployeeByIdentificator(1)).thenReturn(true);

        ResponseEntity<String> res = controller.createEmployee(payload);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(res.getBody()).isEqualTo("Employee already exists");
        verify(service, never()).createUser(any());
    }

    @Test
    void createEmployee_delegatesToService_whenNew() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        Employee payload = new Employee();
        payload.setIdentificator(1);

        when(repo.existsEmployeeByIdentificator(1)).thenReturn(false);
        when(service.createUser(payload)).thenReturn(ResponseEntity.status(HttpStatus.CREATED).body("Employee created"));

        ResponseEntity<String> res = controller.createEmployee(payload);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isEqualTo("Employee created");
        verify(service).createUser(payload);
    }

    @Test
    void getAllEmployees_delegatesToRepository() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        when(repo.findAll()).thenReturn(List.of());

        List<Employee> res = controller.getAllEmployees();

        assertThat(res).isEmpty();
        verify(repo).findAll();
    }

    @Test
    void updateEmployee_returns404_whenIdMissing() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        UUID id = UUID.randomUUID();
        Employee payload = new Employee();

        when(repo.existsById(id)).thenReturn(false);

        ResponseEntity<String> res = controller.updateEmployee(id, payload);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(service, never()).updateUser(any());
    }

    @Test
    void updateEmployee_setsId_andDelegatesToService() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        UUID id = UUID.randomUUID();
        Employee payload = new Employee();

        when(repo.existsById(id)).thenReturn(true);
        when(service.updateUser(any(Employee.class))).thenReturn(ResponseEntity.ok("Employee updated"));

        ResponseEntity<String> res = controller.updateEmployee(id, payload);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isEqualTo("Employee updated");
        assertThat(payload.getId()).isEqualTo(id);
        verify(service).updateUser(payload);
    }

    @Test
    void deleteEmployee_returns404_whenNotFound() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        when(repo.existsEmployeeByIdentificator(123)).thenReturn(false);

        ResponseEntity<Void> res = controller.deleteEmployee(123);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(service, never()).deleteEmployee(any());
    }

    @Test
    void deleteEmployee_delegatesToService_whenFound() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = mock(EmployeeService.class);
        EmployeeController controller = new EmployeeController(repo, service);

        when(repo.existsEmployeeByIdentificator(123)).thenReturn(true);
        when(service.deleteEmployee(123)).thenReturn(ResponseEntity.noContent().build());

        ResponseEntity<Void> res = controller.deleteEmployee(123);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(service).deleteEmployee(123);
    }
}
