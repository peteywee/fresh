import { randomUUID } from "node:crypto";

export const demoUsers = [
  {
    id: randomUUID(),
    displayName: "Mary Manager",
    email: "manager@example.com",
    password: "manager123",
    role: "manager" as const
  },
  {
    id: randomUUID(),
    displayName: "Ulysses User",
    email: "user@example.com",
    password: "user123",
    role: "user" as const
  }
];
