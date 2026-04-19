// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const apiMocks = vi.hoisted(() => ({
    fetchEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
}));

const helperMocks = vi.hoisted(() => ({
    normalizePayload: vi.fn((payload) => payload),
    sortEmployeesByIdentificator: vi.fn((items) =>
        [...items].sort((a, b) => Number(a.identificator) - Number(b.identificator))
    ),
}));

vi.mock("./lib/apiClient.js", () => ({
    fetchEmployees: apiMocks.fetchEmployees,
    createEmployee: apiMocks.createEmployee,
    deleteEmployee: apiMocks.deleteEmployee,
    updateEmployee: apiMocks.updateEmployee,
}));

vi.mock("./lib/employeePayload.js", () => ({
    normalizePayload: helperMocks.normalizePayload,
}));

vi.mock("./lib/sortEmployees.js", () => ({
    sortEmployeesByIdentificator: helperMocks.sortEmployeesByIdentificator,
}));

import App from "./App.jsx";

function deferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

function fillCreateForm(container, values = {}) {
    const identificator = container.querySelector('input[name="identificator"]');
    const name = container.querySelector('input[name="name"]');
    const surname = container.querySelector('input[name="surname"]');
    const patronymic = container.querySelector('input[name="patronymic"]');
    const position = container.querySelector('input[name="position"]');
    const salary = container.querySelector('input[name="salary"]');

    if (values.identificator !== undefined) {
        fireEvent.change(identificator, { target: { value: values.identificator } });
    }
    if (values.name !== undefined) {
        fireEvent.change(name, { target: { value: values.name } });
    }
    if (values.surname !== undefined) {
        fireEvent.change(surname, { target: { value: values.surname } });
    }
    if (values.patronymic !== undefined) {
        fireEvent.change(patronymic, { target: { value: values.patronymic } });
    }
    if (values.position !== undefined) {
        fireEvent.change(position, { target: { value: values.position } });
    }
    if (values.salary !== undefined) {
        fireEvent.change(salary, { target: { value: values.salary } });
    }
}

describe("App", () => {
    const originalConfirm = window.confirm;

    beforeEach(() => {
        apiMocks.fetchEmployees.mockReset();
        apiMocks.createEmployee.mockReset();
        apiMocks.updateEmployee.mockReset();
        apiMocks.deleteEmployee.mockReset();

        helperMocks.normalizePayload.mockReset();
        helperMocks.sortEmployeesByIdentificator.mockReset();

        helperMocks.normalizePayload.mockImplementation((payload) => payload);
        helperMocks.sortEmployeesByIdentificator.mockImplementation((items) =>
            [...items].sort((a, b) => Number(a.identificator) - Number(b.identificator))
        );

        window.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        cleanup();
        window.confirm = originalConfirm;
    });

    it("показывает skeleton при загрузке и затем рендерит сотрудников в отсортированном виде", async () => {
        const pending = deferred();

        apiMocks.fetchEmployees.mockReturnValueOnce(pending.promise);

        const { container } = render(<App />);

        expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
        expect(container.querySelectorAll("tbody tr")).toHaveLength(5);

        pending.resolve([
            {
                id: 2,
                identificator: 22,
                name: "Ivan",
                surname: "Petrov",
                patronymic: "Ivanovich",
                position: "Engineer",
                salary: 5000,
            },
            {
                id: 1,
                identificator: 11,
                name: "Anna",
                surname: "Sidorova",
                patronymic: "Olegovna",
                position: "QA",
                salary: 4000,
            },
        ]);

        await screen.findByText("Anna");

        expect(helperMocks.sortEmployeesByIdentificator).toHaveBeenCalled();
        expect(screen.getByText("2 items")).toBeInTheDocument();

        const rows = container.querySelectorAll("tbody tr");
        expect(within(rows[0]).getByText("11")).toBeInTheDocument();
        expect(within(rows[1]).getByText("22")).toBeInTheDocument();
    });

    it("показывает пустое состояние, если список пуст", async () => {
        apiMocks.fetchEmployees.mockResolvedValueOnce([]);

        render(<App />);

        expect(await screen.findByText(/Пока пусто/i)).toBeInTheDocument();
        expect(screen.getByText("0 items")).toBeInTheDocument();
    });

    it("показывает toast с ошибкой статуса при неудачной загрузке", async () => {
        apiMocks.fetchEmployees.mockRejectedValueOnce(new Error("fetchEmployees failed: 500"));

        render(<App />);

        expect(
            await screen.findByText("Не удалось загрузить список (status 500)")
        ).toBeInTheDocument();
    });

    it("создаёт сотрудника, сбрасывает форму и перезагружает список", async () => {
        apiMocks.fetchEmployees
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    id: 1,
                    identificator: 101,
                    name: "Alex",
                    surname: "Smirnov",
                    patronymic: "Petrovich",
                    position: "Dev",
                    salary: 7000,
                },
            ]);

        apiMocks.createEmployee.mockResolvedValueOnce({});

        const { container } = render(<App />);

        await screen.findByText(/Пока пусто/i);

        fillCreateForm(container, {
            identificator: "101",
            name: "Alex",
            surname: "Smirnov",
            patronymic: "Petrovich",
            position: "Dev",
            salary: "7000",
        });

        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        await waitFor(() => {
            expect(apiMocks.createEmployee).toHaveBeenCalledTimes(1);
        });

        expect(helperMocks.normalizePayload).toHaveBeenCalledWith({
            identificator: "101",
            name: "Alex",
            surname: "Smirnov",
            patronymic: "Petrovich",
            position: "Dev",
            salary: "7000",
        });

        expect(await screen.findByText("Сотрудник добавлен")).toBeInTheDocument();
        expect(apiMocks.fetchEmployees).toHaveBeenCalledTimes(2);

        expect(container.querySelector('input[name="identificator"]').value).toBe("");
        expect(container.querySelector('input[name="name"]').value).toBe("");
    });

    it("показывает ошибку при конфликте на создании", async () => {
        apiMocks.fetchEmployees.mockResolvedValueOnce([]);
        apiMocks.createEmployee.mockRejectedValueOnce(new Error("conflict"));

        const { container } = render(<App />);

        await screen.findByText(/Пока пусто/i);

        fillCreateForm(container, {
            identificator: "101",
            name: "Alex",
            surname: "Smirnov",
            patronymic: "Petrovich",
            position: "Dev",
            salary: "7000",
        });

        fireEvent.click(screen.getByRole("button", { name: "Add" }));

        expect(
            await screen.findByText("Сотрудник с таким identificator уже существует (409).")
        ).toBeInTheDocument();
    });

    it("открывает модалку редактирования и сохраняет изменения", async () => {
        const employee = {
            id: 7,
            identificator: 77,
            name: "Nina",
            surname: "Volkova",
            patronymic: "Sergeevna",
            position: "Analyst",
            salary: 6500,
        };

        apiMocks.fetchEmployees
            .mockResolvedValueOnce([employee])
            .mockResolvedValueOnce([
                { ...employee, name: "Nina Updated", salary: 7200 },
            ]);

        apiMocks.updateEmployee.mockResolvedValueOnce({});

        const { container } = render(<App />);

        await screen.findByText("Nina");

        fireEvent.click(screen.getByTitle("Edit"));

        expect(
            screen.getByText("Редактирование: #77")
        ).toBeInTheDocument();

        const nameInputs = container.querySelectorAll('input[name="name"]');
        const salaryInputs = container.querySelectorAll('input[name="salary"]');

        fireEvent.change(nameInputs[1], { target: { value: "Nina Updated" } });
        fireEvent.change(salaryInputs[1], { target: { value: "7200" } });

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(apiMocks.updateEmployee).toHaveBeenCalledTimes(1);
        });

        expect(apiMocks.updateEmployee).toHaveBeenCalledWith(7, {
            identificator: "77",
            name: "Nina Updated",
            surname: "Volkova",
            patronymic: "Sergeevna",
            position: "Analyst",
            salary: "7200",
        });

        expect(await screen.findByText("Данные обновлены")).toBeInTheDocument();
    });

    it("удаляет сотрудника после подтверждения", async () => {
        const employee = {
            id: 5,
            identificator: 55,
            name: "Petr",
            surname: "Sokolov",
            patronymic: "Ivanovich",
            position: "Manager",
            salary: 8000,
        };

        apiMocks.fetchEmployees.mockResolvedValueOnce([employee]).mockResolvedValueOnce([]);
        apiMocks.deleteEmployee.mockResolvedValueOnce({});

        render(<App />);

        await screen.findByText("Petr");

        fireEvent.click(screen.getByTitle("Delete"));

        expect(window.confirm).toHaveBeenCalledWith(
            "Удалить сотрудника #55 (Petr Sokolov)?"
        );

        await waitFor(() => {
            expect(apiMocks.deleteEmployee).toHaveBeenCalledWith(55);
        });

        expect(await screen.findByText("Сотрудник удалён")).toBeInTheDocument();
    });

    it("не удаляет сотрудника, если пользователь отменил confirm", async () => {
        window.confirm = vi.fn(() => false);

        const employee = {
            id: 5,
            identificator: 55,
            name: "Petr",
            surname: "Sokolov",
            patronymic: "Ivanovich",
            position: "Manager",
            salary: 8000,
        };

        apiMocks.fetchEmployees.mockResolvedValueOnce([employee]);

        render(<App />);

        await screen.findByText("Petr");

        fireEvent.click(screen.getByTitle("Delete"));

        expect(apiMocks.deleteEmployee).not.toHaveBeenCalled();
    });

    it("закрывает модалку редактирования по кнопке Cancel", async () => {
        const employee = {
            id: 9,
            identificator: 99,
            name: "Olga",
            surname: "Romanova",
            patronymic: "Igorevna",
            position: "HR",
            salary: 6100,
        };

        apiMocks.fetchEmployees.mockResolvedValueOnce([employee]);

        render(<App />);

        await screen.findByText("Olga");

        fireEvent.click(screen.getByTitle("Edit"));
        expect(screen.getByText("Редактирование: #99")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await waitFor(() => {
            expect(screen.queryByText("Редактирование: #99")).not.toBeInTheDocument();
        });
    });
});