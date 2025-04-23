const { createSlice } = require("@reduxjs/toolkit");


const initialState = {
    activeTab: "new_project",
    taskId: null,
    tab:[
        { value: "home", name: "Home" },
        { value: "new_project", name: "New Project" },
        { value: "analysis", name: "Project Analysis" },
        { value: "result", name: "Result" },
    ]
};

const tabSlice=createSlice({
    name: "tab",
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setTaskId: (state, action) => {
            state.taskId = action.payload;
        },
    },
})
export const { setActiveTab , setTaskId } = tabSlice.actions;
// export const selectActiveTab = (state) => state.tab.activeTab;
export default tabSlice.reducer;