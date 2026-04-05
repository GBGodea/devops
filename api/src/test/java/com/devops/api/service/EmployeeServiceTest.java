package com.devops.api.service;

import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeServiceTest {

    private final SimpleMeterRegistry registry = new SimpleMeterRegistry();

    @Test
    void createUser_savesEmployee_andReturns201() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo, registry);

        Employee e = new Employee();
        e.setIdentificator(123);
        e.setName("Ivan");
        e.setSurname("Petrov");
        e.setPosition("Dev");
        e.setSalary(1000);

        when(repo.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<String> res = service.createUser(e);

        ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
        verify(repo).save(saved.capture());
        assertThat(saved.getValue().getIdentificator()).isEqualTo(123);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isEqualTo("Employee created");
        assertThat(registry.counter("employees.created").count()).isEqualTo(1.0);
    }

    @Test
    void createUser_incrementsCounterOnEachCall() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        SimpleMeterRegistry localRegistry = new SimpleMeterRegistry();
        EmployeeService service = new EmployeeService(repo, localRegistry);

        when(repo.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        Employee e = new Employee();
        e.setIdentificator(1);
        e.setName("A");
        e.setSurname("B");
        e.setPosition("C");
        e.setSalary(10);

        service.createUser(e);
        service.createUser(e);
        service.createUser(e);

        assertThat(localRegistry.counter("employees.created").count()).isEqualTo(3.0);
    }

    @Test
    void getEmployee_delegatesToRepository() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo, registry);

        UUID id = UUID.randomUUID();
        Employee expected = new Employee();
        expected.setId(id);

        when(repo.getEmployeesById(id)).thenReturn(expected);

        Employee actual = service.getEmployee(id);

        verify(repo).getEmployeesById(id);
        assertThat(actual).isSameAs(expected);
    }

    @Test
    void updateUser_savesEmployee_andReturns200() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo, registry);

        Employee e = new Employee();
        e.setId(UUID.randomUUID());
        e.setIdentificator(1);
        e.setName("A");
        e.setSurname("B");
        e.setPosition("C");
        e.setSalary(10);

        when(repo.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<String> res = service.updateUser(e);

        verify(repo).save(e);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isEqualTo("Employee updated");
        assertThat(registry.counter("employees.updated").count()).isEqualTo(1.0);
    }

    @Test
    void deleteEmployee_deletesByIdentificator_andReturns204() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo, registry);

        ResponseEntity<Void> res = service.deleteEmployee(77);

        verify(repo).deleteByIdentificator(77);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(registry.counter("employees.deleted").count()).isEqualTo(1.0);
    }

    @Test
    void countEmployees_incrementsListRequestsCounter() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        SimpleMeterRegistry localRegistry = new SimpleMeterRegistry();
        EmployeeService service = new EmployeeService(repo, localRegistry);

        when(repo.count()).thenReturn(5L);

        long count = service.countEmployees();

        assertThat(count).isEqualTo(5L);
        assertThat(localRegistry.counter("employees.list.requests").count()).isEqualTo(1.0);

        service.countEmployees();
        assertThat(localRegistry.counter("employees.list.requests").count()).isEqualTo(2.0);
    }

    @Test
    void employeesTotalGauge_reflectsRepositoryCount() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        SimpleMeterRegistry localRegistry = new SimpleMeterRegistry();
        new EmployeeService(repo, localRegistry);

        when(repo.count()).thenReturn(0L);
        assertThat(localRegistry.get("employees.total").gauge().value()).isEqualTo(0.0);

        when(repo.count()).thenReturn(42L);
        assertThat(localRegistry.get("employees.total").gauge().value()).isEqualTo(42.0);
    }
}
