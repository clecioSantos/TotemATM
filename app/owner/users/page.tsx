"use client";

import { useState } from "react";

// Mock de dados de usuários
const mockUsers = [
  { id: 1, name: "Admin Principal", email: "admin@exemplo.com", role: "Owner" },
  { id: 2, name: "Usuário Teste", email: "teste@exemplo.com", role: "User" },
];

export default function UsersPage() {
  const [filter, setFilter] = useState("");

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(filter.toLowerCase()) || 
    user.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Usuários</h1>
      <input
        type="text"
        placeholder="Filtrar por nome ou e-mail..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded w-full"
      />
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">E-mail</th>
              <th className="px-4 py-2 text-left">Função</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 underline">Tornar Admin</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
