import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const storedUser=Cookies.get("user")?JSON.parse(Cookies.get("user")):null;
const initialState = {
    user:storedUser,
    accessToken: Cookies.get("accessToken") || null,
    refreshToken: Cookies.get("refreshToken") || null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            Cookies.set("user", JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.user = null;
            Cookies.remove("access_token");
            Cookies.remove("refreshToken");
            Cookies.remove("user");
        },
        seeUser: (state) => {
            const user = Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null;
            state.user = user;
        }

    },
});
export const { setUser, logout,seeUser } = authSlice.actions;
export default authSlice.reducer;