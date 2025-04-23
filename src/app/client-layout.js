"use client";
import { store } from "@/lib/redux/store";
import { Provider } from "react-redux";

export default function ClientLayout({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
