import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos, error } = await supabase
    .from("todos")
    .select("id, name");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Todos</h1>
      {error ? (
        <p role="status">Could not load todos. Check the Supabase table and access policy.</p>
      ) : todos?.length ? (
        <ul className="list-disc space-y-2 pl-5">
          {todos.map((todo) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      ) : (
        <p>No todos found.</p>
      )}
    </main>
  );
}
