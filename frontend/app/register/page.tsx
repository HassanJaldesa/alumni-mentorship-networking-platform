import { redirect } from "next/navigation";

// Registration lives on the login page (Figure 4.5).
export default function RegisterPage() {
  redirect("/login#register");
}