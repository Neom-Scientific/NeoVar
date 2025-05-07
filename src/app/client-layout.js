"use client";
import { store } from "@/lib/redux/store";
import './globals.css';
import { Provider } from "react-redux";

export default function ClientLayout({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
