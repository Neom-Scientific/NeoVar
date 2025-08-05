
'use client'

import React, { use, useEffect, useState } from 'react'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { number, set, z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ProjectAnalysis from './ProjectAnalysis'
import { useDispatch } from 'react-redux'
import { setActiveTab } from '@/lib/redux/slices/tabSlice'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import * as XLSX from 'xlsx'
import axios, { all } from 'axios';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast, ToastContainer } from 'react-toastify'
import Cookies from 'js-cookie'
import { get } from 'http'


// 1. Validation schema
// const formSchema = z.object({
//     projectName: z.string().min(1, { message: "Project name is required" }),
//     outputDirectory: z.string().min(1, { message: "Output directory is required" }),
//     localDirectory: z.string().min(1, { message: "Local directory is required" }),
//     // testType: z.string().min(1, { message: "Test type is required" }),
// })

const getFormSchema = (mode) => z.object({
    projectName: z.string().min(1, { message: "Project name is required" }),
    outputDirectory: mode !== 'server_mode'
        ? z.string().min(1, { message: "Output directory is required" })
        : z.string().optional(),
    localDirectory: mode !== 'server_mode'
        ? z.string().min(1, { message: "Local directory is required" })
        : z.string().optional(),
    // testType: z.string().min(1, { message: "Test type is required" }),
});

const NewProject = () => {
    const [showAnalysis, setShowAnalysis] = useState(false)
    const [excelData, setExcelData] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const dispatch = useDispatch();
    const [isUploading, setIsUploading] = useState(false);
    const [progressValue, setProgressValue] = useState(0);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [Files, setFiles] = useState([]);
    const [excelFile, setExcelFile] = useState(null);
    const [runningTasks, setRunningTasks] = useState(false);
    const [testType, setTestType] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [numberOfSamples, setNumberOfSamples] = useState(0);
    const [testTypeName, setTestTypeName] = useState('')
    const [localDirSuggestions, setLocalDirSuggestions] = useState([]);
    const [outputDirSuggestions, setOutputDirSuggestions] = useState([]);
    const [filteredLocalDirSuggestions, setFilteredLocalDirSuggestions] = useState([]);
    const [filteredOutputDirSuggestions, setFilteredOutputDirSuggestions] = useState([]);
    const [showLocalDirSuggestions, setShowLocalDirSuggestions] = useState(false);
    const [showOutputDirSuggestions, setShowOutputDirSuggestions] = useState(false);

    const sampleIds = [];

    // 2. Setup form

    let email, mode;
    const user = Cookies.get('NeoVar_user');
    if (user) {
        try {
            const parsedUser = JSON.parse(user);
            email = parsedUser.email;
            mode = parsedUser.mode;
        }
        catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    else {
        // console.log('User data:', user);
    }

    const form = useForm({
        resolver: zodResolver(getFormSchema(mode)),
        defaultValues: {
            projectName: '',
            outputDirectory: '',
            localDirectory: '',
            // testType: 'select', // Set default value for testType
        },
    })



    // 1. Excel sheet input handler
    const handleSheetData = (e) => {
        const file = e.target.files[0];
        setExcelFile(file);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

            // // console.log('📊 Parsed Sheet Data:', sheetData);
            const sample = sheetData.length;
            setNumberOfSamples(sample);

            setExcelData(sheetData);
        };

        reader.readAsArrayBuffer(file);
    }

    // 2. directory input handler
    const handleDirectory = async (e) => {
        const files = Array.from(e.target.files);
        // // console.log('Selected files:', files);

        if (files.length === 0) {
            setSelectedFolder(''); // Reset if no folder is selected
            return;
        }

        // Extract the folder name from the first file's path
        const folderPath = files[0].webkitRelativePath.split('/')[0];
        setSelectedFolder(folderPath); // Update the selected folder name

        const folders = new Set();

        // Extract folder structure
        files.forEach((file) => {
            const pathParts = file.webkitRelativePath.split('/');
            pathParts.pop(); // Remove file name
            let folderPath = '';
            for (const part of pathParts) {
                folderPath += (folderPath ? '/' : '') + part;
                folders.add(folderPath);
            }
        });

        // Send folder structure metadata

        for (const file of files) {
            const formData = new FormData(); // Create a fresh FormData for each file

            formData.append('file', file, file.webkitRelativePath);
            formData.append('targetDirectory', form.getValues('inputDirectory'));
            setFiles(prevFiles => [...prevFiles, file]); // Update state with selected files
        }

        try {
            setIsUploading(true); // Show progress bar
            setProgressValue(0); // Reset progress value
            setShowPopup(true); // Show popup

            // Simulate upload progress
            const simulateProgress = () => {
                setProgressValue((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval); // Ensure interval is cleared when progress reaches 100%
                        setIsUploading(false); // Hide progress bar
                        setShowPopup(false); // Close popup
                        return 100;
                    }
                    return prev + 10; // Increment progress by 10%
                });
            };

            const interval = setInterval(simulateProgress, 500); // Update progress every 500ms
        } catch (error) {
            console.error('Upload error:', error);
            setIsUploading(false); // Hide progress bar in case of error
        }
    };

    // 3. test type handler
    const handleSelectTestType = (e) => {
        const selectedValue = e.target.value;
        const selectedName = e.target.options[e.target.selectedIndex].getAttribute('name'); // Get the name attribute
        setTestTypeName(selectedValue);
        setTestType(selectedName);
    }

    let inputDir = '';
    // 4. Submit handler
    const handleSubmit = async (data) => {

        let allUploadsSuccessful = true;

        const formData = new FormData();

        if (excelFile) {
            formData.append('file', excelFile);
        }

        for (let i = 0; i < Files.length; i++) {
            formData.append('file', Files[i]);
        }

        // Add project/folder name
        formData.append('project', selectedFolder);

        try {
            formData.append('email', email);
            setShowDialog(true); // Show dialog
            const res = await axios.post('/api/uploads', formData);
            saveToHistory('localDirectoryHistory', data.localDirectory, setLocalDirSuggestions);
            saveToHistory('outputDirectoryHistory', data.outputDirectory, setOutputDirSuggestions)
            inputDir = res.data[0].inputDir;
            for (let i = 0; i < res.data.length; i++) {
                if (!sampleIds.includes(res.data[i].sampleId)) {
                    sampleIds.push(res.data[i].sampleId);
                }
            }


            if (res.data[0].status === 400) {
                allUploadsSuccessful = false;
                setShowDialog(false);
                toast.error(res.data[0].message, {
                    position: "top-right",
                    autoClose: 5000,
                });
            }

        } catch (err) {
            console.error('Error uploading:', err);
            allUploadsSuccessful = false;
            setShowDialog(false); // Hide dialog
        }

        try {
            if (allUploadsSuccessful) {
                toast.success('Analysis Completed');
                let analysisRes;
                if (mode === 'server_mode') {
                    analysisRes = await axios.post('/api/server-mode', {
                        projectName: data.projectName,
                        inputDir,
                        testType: testType,
                        email: email,
                        sampleIds: sampleIds,
                        numberOfSamples: numberOfSamples,
                    })
                }
                else {
                    analysisRes = await axios.post('/api/run-analysis', {
                        projectName: data.projectName,
                        outputDirectory: data.outputDirectory,
                        inputDir,
                        numberOfSamples: numberOfSamples,
                        localDir: data.localDirectory,
                        excelSheet: excelFile?.name,
                        testType: testType,
                        email: email,
                        sampleIds: sampleIds,
                    });
                }

                console.log('analysisRes:', analysisRes.data);

                if (analysisRes.data[0].status === 200) {
                    setShowDialog(false); // Hide dialog
                    localStorage.setItem('taskId', JSON.stringify(analysisRes.data[0].taskId)); // Save task ID to local storage
                    if (analysisRes.data[0].tempDir !== undefined) {
                        localStorage.setItem('tempDir', JSON.stringify(analysisRes.data[0].tempDir));
                    }
                    setRunningTasks(true); // Set running tasks to true
                    dispatch(setActiveTab('analysis'));
                    setShowAnalysis(true);
                }
                else if (analysisRes.data[0].status === 400) {
                    setShowDialog(false); // Hide dialog
                    toast.error(analysisRes.data[0].message);
                }
                else {
                    setShowDialog(false); // Hide dialog
                    toast.error('An error occurred while starting the analysis', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }

            }

        }
        catch (error) {
            if (error.response && error.response.status === 400) {
                setShowDialog(false); // Hide dialog
                toast.error(error.response.data.message);
            }
        }

    }

    // 5. save taskId to local storage
    const saveTaskIdToLocalStorage = (taskId) => {
        const existingTaskIds = JSON.parse(localStorage.getItem('taskId')) || [];
        if (!existingTaskIds.includes(taskId)) {
            existingTaskIds.push(taskId);
            localStorage.setItem('taskId', JSON.stringify(existingTaskIds));
        }
        return taskId;
    }

    useEffect(() => {
        const savedLocalDirs = JSON.parse(localStorage.getItem('localDirectoryHistory')) || [];
        setLocalDirSuggestions(savedLocalDirs);

        const savedOutputDirs = JSON.parse(localStorage.getItem('outputDirectoryHistory')) || [];
        setOutputDirSuggestions(savedOutputDirs);
    }, []);

    const filterLocalDirSuggestions = (input) => {
        const val = input || '';
        if (val.trim() === '') {
            // Optionally show all saved suggestions if input is empty
            setFilteredLocalDirSuggestions(localDirSuggestions);
            setShowLocalDirSuggestions(localDirSuggestions.length > 0);
            return;
        }
        const filtered = localDirSuggestions.filter(dir =>
            dir.toLowerCase().includes(val.toLowerCase())
        );
        setFilteredLocalDirSuggestions(filtered);
        setShowLocalDirSuggestions(filtered.length > 0);
    };


    const filterOutputDirSuggestions = (input) => {
        const val = input || '';
        if (val.trim() === '') {
            // Optionally show all saved suggestions if input is empty
            setFilteredOutputDirSuggestions(outputDirSuggestions);
            setShowOutputDirSuggestions(outputDirSuggestions.length > 0);
            return;
        }
        const filtered = outputDirSuggestions.filter(dir =>
            dir.toLowerCase().includes(val.toLowerCase())
        );
        setFilteredOutputDirSuggestions(filtered);
        setShowOutputDirSuggestions(filtered.length > 0);
    };

    const saveToHistory = (key, value, setter) => {
        if (!value) return;
        let history = JSON.parse(localStorage.getItem(key)) || [];
        if (!history.includes(value)) {
            history = [value, ...history].slice(0, 10); // max 10 entries
            localStorage.setItem(key, JSON.stringify(history));
            setter(history);
        }
    };

    return (
        <div className='mx-5 my-10'>
            {!showAnalysis ? (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Project Name */}
                        <FormField
                            control={form.control}
                            name="projectName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="my-4 text-2xl sm:text-sm md:text-lg">Project Name</FormLabel>
                                    <Input
                                        type="text"
                                        placeholder="Project Name"
                                        {...field}
                                        className="w-[50%] focus-within:ring-orange-500 "
                                    />
                                    {form.formState.errors.projectName && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {form.formState.errors.projectName.message}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Input Directory */}
                        <FormField
                            control={form.control}
                            name="inputDirectory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="my-4 text-2xl">Select Input Directory</FormLabel>
                                    <Input
                                        type="file"
                                        name="inputDirectory"
                                        webkitdirectory="true"
                                        directory="true"
                                        multiple
                                        {...field}
                                        className="w-[50%] cursor-pointer focus-within:ring-orange-500"
                                        placeholder="Input Directory"
                                        onChange={handleDirectory}
                                        disabled={isUploading} // Disable input during upload
                                    />
                                    {/* {form.formState.errors.inputDirectory && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {form.formState.errors.inputDirectory.message}
                                        </p>
                                    )} */}
                                    {selectedFolder && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Selected Folder: <strong>{selectedFolder}</strong>
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        {isUploading && ( // Show progress bar and percentage only during upload
                            <Dialog open={showPopup} onOpenChange={setShowPopup}>
                                <DialogContent className="max-w-sm text-center">
                                    <DialogTitle className="sr-only">Uploading</DialogTitle> {/* Accessible title for screen readers */}

                                    <h2 className="text-lg font-semibold mb-4">Uploading File</h2>
                                    <div className="relative w-full h-4 bg-gray-200 rounded">
                                        {/* Progress bar */}
                                        <div
                                            className="absolute top-0 left-0 h-4 bg-orange-500 rounded"
                                            style={{ width: `${progressValue}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {progressValue < 100 ? `${progressValue}%` : "Upload Complete ✅"}
                                    </p>
                                </DialogContent>
                            </Dialog>
                        )}

                        {mode !== 'server_mode' && (
                            <>
                                {/* Output Directory */}
                                <FormField
                                    control={form.control}
                                    name="outputDirectory"
                                    render={({ field }) => (
                                        <div className='flex justify-start items-center w-[100%] gap-8'>
                                            <div className='w-[50%]'>
                                                <FormItem style={{ position: 'relative' }}>
                                                    <FormLabel className="my-4 text-2xl">Output Directory</FormLabel>
                                                    <Input
                                                        type="text"
                                                        placeholder="paste the path to the output directory here"
                                                        {...field}
                                                        className="focus-within:ring-orange-500"
                                                        autoComplete="off"
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            filterOutputDirSuggestions(e.target.value);
                                                        }}
                                                        onFocus={() => {
                                                            filterOutputDirSuggestions(field.value);
                                                        }}
                                                        onBlur={() => {
                                                            // Delay hiding to allow click
                                                            setTimeout(() => setShowOutputDirSuggestions(false), 200);
                                                        }}
                                                    />
                                                    {showOutputDirSuggestions && filteredOutputDirSuggestions.length > 0 && (
                                                        <ul
                                                            style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                right: 0,
                                                                width: '50%',
                                                                background: 'black',
                                                                color: 'white',
                                                                border: '1px solid #ccc',
                                                                maxHeight: '150px',
                                                                overflowY: 'auto',
                                                                zIndex: 1000,
                                                                margin: 0,
                                                                padding: 0,
                                                                listStyle: 'none',
                                                            }}
                                                        >
                                                            {filteredOutputDirSuggestions.map((suggestion, i) => (
                                                                <li
                                                                    key={i}
                                                                    style={{ padding: '8px', cursor: 'pointer' }}
                                                                    onMouseDown={e => e.preventDefault()} // prevent blur
                                                                    onClick={() => {
                                                                        form.setValue('outputDirectory', suggestion);
                                                                        setShowOutputDirSuggestions(false);
                                                                    }}
                                                                >
                                                                    {suggestion}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {form.formState.errors.outputDirectory && (
                                                        <p className="mt-2 text-sm text-red-500">
                                                            {form.formState.errors.outputDirectory.message}
                                                        </p>
                                                    )}
                                                </FormItem>
                                            </div>
                                        </div>
                                    )}
                                />

                                {/* Local Directory */}
                                <FormField
                                    control={form.control}
                                    name="localDirectory"
                                    render={({ field }) => (
                                        <div className='flex justify-start items-center w-[100%] gap-8'>
                                            <div className='w-[50%]'>
                                                <FormItem style={{ position: 'relative' }}>
                                                    <FormLabel className="my-4 text-2xl">Local Directory</FormLabel>
                                                    <Input
                                                        type="text"
                                                        placeholder="Paste the path to the Local Directory here"
                                                        {...field}
                                                        className="focus-within:ring-orange-500"
                                                        autoComplete="off"
                                                        onFocus={() => {
                                                            // On focus, filter suggestions with current value
                                                            filterLocalDirSuggestions(field.value);
                                                        }}
                                                        onBlur={() => {
                                                            // Delay hiding suggestions so click can register
                                                            setTimeout(() => setShowLocalDirSuggestions(false), 200);
                                                        }}
                                                    />
                                                    {showLocalDirSuggestions && filteredLocalDirSuggestions.length > 0 && (
                                                        <ul
                                                            style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                width: '50%',
                                                                left: 0,
                                                                right: 0,
                                                                background: 'black',
                                                                color: 'white',
                                                                border: '1px solid #ccc',
                                                                maxHeight: '150px',
                                                                overflowY: 'auto',
                                                                zIndex: 1000,
                                                                margin: 0,
                                                                padding: 0,
                                                                listStyle: 'none',
                                                            }}
                                                        >
                                                            {filteredLocalDirSuggestions.map((suggestion, i) => (
                                                                <li
                                                                    key={i}
                                                                    onMouseDown={e => e.preventDefault()} // prevent blur
                                                                    onClick={() => {
                                                                        form.setValue('localDirectory', suggestion);
                                                                        setShowLocalDirSuggestions(false);
                                                                    }}
                                                                    style={{ padding: '8px', cursor: 'pointer' }}
                                                                >
                                                                    {suggestion}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </FormItem>
                                            </div>
                                            <div className='w-[50%]'>
                                                <FormLabel className="my-4 text-2xl">Download Local Directory</FormLabel>
                                                <a
                                                    href="https://drive.google.com/file/d/1HY6fZ2Mnl_0aQ8eZAJ1HOc-NekUJ7aIU/view?usp=sharing"
                                                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                                                    download
                                                >
                                                    Download Local Directory
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                />
                            </>
                        )}



                        {/* Excel Sheet Upload */}
                        <FormItem>
                            <div className='flex justify-start items-center w-[100%] gap-8'>
                                <div className='w-[50%]'>
                                    <FormLabel className="my-4 text-2xl">Upload Excel Sheet</FormLabel>
                                    <Input
                                        type="file"
                                        accept=".xls,.xlsx"
                                        name="excelSheet"
                                        placeholder="Upload Excel Sheet"
                                        className="border rounded-md cursor-pointer p-2 focus-within:ring-orange-500"
                                        onChange={handleSheetData}
                                    />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Supported formats: .xls, .xlsx
                                    </p>
                                </div>
                                <div className='w-[50%]'>
                                    <FormLabel className="my-4 text-2xl">Download Sheet Fromat</FormLabel>
                                    <a
                                        href="/downloads/nipt.xls"
                                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                                        download
                                    >
                                        Download Excel File
                                    </a>
                                </div>
                            </div>
                        </FormItem>

                        {/* Test Type Selection */}
                        <FormField
                            control={form.control}
                            name='testType'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="my-4 text-2xl">Select the Type of Test</FormLabel>
                                    <select
                                        {...field}
                                        className="w-[50%] border rounded-md p-2 focus-within:ring-orange-500"
                                        onChange={handleSelectTestType}
                                    >
                                        <option value="select">Select Test Type</option>
                                        <option name="exome" value="Exome">Exome</option>
                                        <option name="clinical" value="Clinical Exome">Clinical Exome</option>
                                        <option name="carrier" value="Carrier Screening">Carrier Screening</option>
                                    </select>

                                    {/* {form.formState.errors.testType && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {form.formState.errors.testType.message}
                                        </p>
                                    )} */}
                                    {/* {form.formState.errors.testType && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {form.formState.errors.testType.message}
                                        </p>
                                    )} */}
                                    {testType && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Selected Test Type: <strong>{testTypeName}</strong>
                                        </p>
                                    )}
                                </FormItem>

                            )}
                        />


                        <Button
                            type="submit"
                            className="mt-5 cursor-pointer bg-orange-500 text-white font-bold hover:bg-white hover:border hover:border-orange-500 hover:text-orange-500 transition-transform duration-200 hover:scale-110"
                            disabled={isUploading} // Disable button during upload
                        >
                            Start Analysis
                        </Button>

                        {showDialog && (
                            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                                <DialogContent className="max-w-sm text-center">
                                    <DialogTitle className="sr-only">Analysis in Progress</DialogTitle>
                                    <h2 className="text-lg font-semibold mb-4">Analysis in Progress</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Your analysis is being processed. Please wait...
                                    </p>
                                </DialogContent>
                            </Dialog>
                        )}

                    </form>
                </Form>
            ) : (
                <ProjectAnalysis />
            )}

            {/* Table Output */}
            <div className=' overflow-auto max-h-96'>
                <Table className="mt-5 w-[50%] mx-auto">
                    <TableCaption>Check the Sheet Data</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Library Id</TableHead>
                            <TableHead>Sample ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {excelData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{row["Library id"]}</TableCell>
                                <TableCell>{row["Sample ID"]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <ToastContainer />
        </div>
    )
}

export default NewProject