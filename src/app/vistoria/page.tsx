import { redirect } from "next/navigation";

// Rota antiga: a lista de obras para vistoria virou a própria home.
export default function VistoriaIndexRedirect() {
  redirect("/");
}
