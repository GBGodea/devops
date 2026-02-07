package com.devops.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(
        name = "employee",
        uniqueConstraints = @UniqueConstraint(name = "uk_employee_identificator", columnNames = "identificator")
)
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(nullable = false)
    private Integer identificator;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false)
    private String surname;
    private String patronymic;

    @NotBlank
    @Column(nullable = false)
    private String position;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer salary;
}
