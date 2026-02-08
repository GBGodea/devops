package com.devops.api.service;

import com.devops.api.model.Employee;
import com.devops.api.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmployeeServiceTest {

    @Test
    void createUser_savesEmployee_andReturns201() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo);

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
    }

    @Test
    void getEmployee_delegatesToRepository() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo);

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
        EmployeeService service = new EmployeeService(repo);

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
    }

    @Test
    void deleteEmployee_deletesByIdentificator_andReturns204() {
        EmployeeRepository repo = mock(EmployeeRepository.class);
        EmployeeService service = new EmployeeService(repo);

        ResponseEntity<Void> res = service.deleteEmployee(77);

        verify(repo).deleteByIdentificator(77);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
