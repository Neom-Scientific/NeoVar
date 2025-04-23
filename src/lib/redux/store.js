import { configureStore } from "@reduxjs/toolkit";
import authreducer from "./slices/authSlice";
import tabreducer from "./slices/tabSlice";

 
 export const store = configureStore({
    reducer:{
        auth:authreducer,
        tab:tabreducer,
    }
})

