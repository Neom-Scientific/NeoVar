
'use client'

import React, { useEffect, useState } from 'react'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { set, z } from 'zod'
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
import axios from 'axios';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'


// 1. Validation schema
const formSchema = z.object({
    projectName: z.string().min(1, { message: "Project name is required" }),
    outputDirectory: z.string().min(1, { message: "Output directory is required" }),
    // inputDirectory: z.string().min(1, { message: "Input directory is required" }),
    // testType: z.enum(['exome', 'clinical', 'carrier'], {
    //     required_error: "Test type is required",
    //     invalid_type_error: "Test type must be one of 'exome', 'clinical', or 'carrier'",
    // }),
})

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
    const [inputDir, setInputDir] = useState('');
    const [outputDir, setOutputDir] = useState('');
    const [numberOfSamples, setNumberOfSamples] = useState(0);

    // 2. Setup form
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectName: '',
            outputDirectory: '',
            // inputDirectory: '',
            // testType: '', // Set default value for testType
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

            // console.log('📊 Parsed Sheet Data:', sheetData);
            const sample = sheetData.length;
            setNumberOfSamples(sample);

            setExcelData(sheetData);
        };

        reader.readAsArrayBuffer(file);
    }

    // 3. directory input handler
    const handleDirectory = async (e) => {
        const files = Array.from(e.target.files);
        // console.log('Selected files:', files);

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

    // 4. test type handler
    const handleSelectTestType = (e) => {
        const selectedValue = e.target.value;
        setTestType(selectedValue);
    }

    // 5. Submit handler
    const handleSubmit = async (data) => {
        console.log('data:', data);
        for (let i = 0; i < Files.length; i++) {
            const formData = new FormData();
            formData.append('file', Files[i]);
            formData.append('project', selectedFolder); // Folder name based on project

            // Append Excel file only for the first file
            if (i === 0 && excelFile) {
                formData.append('file', excelFile);
            }

            try {
                setShowDialog(true); // Show dialog
                const res = await fetch('/api/uploads', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }

                if (!res.body) {
                    console.error('Empty response from the server');
                    return;
                }


                console.log('upload response:', res);
            } catch (err) {
                console.error('Error uploading:', err);
            }
        }

        try {
            // console.log('testtype:', testType);
            const res = await axios.post('/api/run-analysis', {
                projectName: data.projectName,
                outputDirectory: data.outputDirectory,
                folderName: selectedFolder,
                numberOfSamples: numberOfSamples,
                excelSheet: excelFile.name,
                testType: testType,
            });

            if (res.status === 200) {
                console.log('Analysis started successfully:', res.data);
            } else {
                console.error('Error starting analysis:', res.statusText);
            }
            // setTaskId(res.data.taskId); // Store the task ID for progress tracking
            setShowDialog(false); // Hide dialog
            saveTaskIdToLocalStorage(res.data.taskId); // Save task ID to local storage
            setRunningTasks(true); // Set running tasks to true
            // console.log('Task ID:', taskId);

        }
        catch (error) {
            console.error('Error:', error);
        }

        dispatch(setActiveTab('analysis'));
        setShowAnalysis(true);
    }


    // const handleSubmit = async (data) => {
    //     console.log('data:', data);
    //     const folder = data.inputDirectory.split('/').pop();
    //     setSelectedFolder(folder);
    //     console.log('folder:', folder);
    //     try {
    //         setShowDialog(true); // Show dialog
    //         const response = await window.electronAPI.startPipeline({
    //             projectName: data.projectName,
    //             folderName: selectedFolder,
    //             excelPath: excelFile.name,
    //             testType: testType,
    //             inputDirectory: data.inputDirectory,
    //             outputDirectory: data.outputDirectory,
    //             numberOfSamples: numberOfSamples,
    //         });

    //         if (response.success) {
    //             console.log('response:', response);
    //             setShowDialog(false); // Hide dialog
    //             saveTaskIdToLocalStorage(response.taskId); // Save task ID to local storage
    //             setRunningTasks(true); // Set running tasks to true
    //             setShowAnalysis(true);
    //             dispatch(setActiveTab('analysis'));
    //         } else {
    //             alert(`❌ Pipeline Error: ${response.error}`);
    //         }
    //     }
    //     catch (error) {
    //         console.error('Error:', error);
    //     }
    // }



    // 6. save taskId to local storage
    const saveTaskIdToLocalStorage = (taskId) => {
        const existingTaskIds = JSON.parse(localStorage.getItem('taskId')) || [];
        if (!existingTaskIds.includes(taskId)) {
            existingTaskIds.push(taskId);
            localStorage.setItem('taskId', JSON.stringify(existingTaskIds));
        }
        return taskId;
    }

    // 7. handle output directory
    const handleOutputDirectory = (e) => {
       console.log('output directory:', e.target.value);
    }

    // const handleInputDirectory = async () => {
    //     // const handle= await window.showDirectoryPicker();
    //     // const folderPath = handle.name;
    //     // console.log('input path:', folderPath);
    //     // setInputDir(folderPath);
    //     try {
    //         // Open the directory picker
    //         const directoryHandle = await window.showDirectoryPicker();
    //         console.log('Selected Directory:', directoryHandle.name);
    //         setInputDir(directoryHandle.name); // Set the input directory name

    //         // Iterate through the directory entries
    //         for await (const [name, handle] of directoryHandle.entries()) {
    //             if (handle.kind === 'file') {
    //                 // If the entry is a file, read its contents
    //                 const file = await handle.getFile();
    //                 console.log('File Name:', file.name);

    //                 // // Read the file contents (optional)
    //                 // const reader = new FileReader();
    //                 // reader.onload = (event) => {
    //                 //     console.log('File Contents:', event.target.result);
    //                 // };
    //                 // reader.readAsText(file); // You can use readAsArrayBuffer or readAsDataURL for other formats
    //             } else if (handle.kind === 'directory') {
    //                 // If the entry is a subdirectory, log its name
    //                 console.log('Subdirectory:', name);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error reading input directory:', error);
    //     }
    // }

    // const handleOutputDirectory= async () => {
    //     const handle= await window.showDirectoryPicker();
    //     const folderPath = handle.name;
    //     console.log('output directory:', folderPath);
    //     setOutputDir(folderPath);
    // }

    // const createDirectory = async () => {
    //     try {
    //       const handle = await window.showDirectoryPicker();
    //       const newFileHandle = await handle.getFileHandle('example.txt', { create: true });
    //       const writable = await newFileHandle.createWritable();
    //       await writable.write('This is a sample file.');
    //       await writable.close();
    //       console.log('File created successfully!');
    //     } catch (error) {
    //       console.error('Error creating directory or file:', error);
    //     }
    //   };


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
                                        className="w-[50%] "
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
                                        className="w-[50%] cursor-pointer"
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
                                        className="border rounded-md cursor-pointer p-2"
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
                                        className="w-[50%] border rounded-md p-2"
                                        onChange={handleSelectTestType}
                                    >
                                        <option value="">Select Test Type</option>
                                        <option value="exome">Exome</option>
                                        <option value="clinical">Clinical Exome</option>
                                        <option value="carrier">Carrier Screening</option>
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
                                            Selected Test Type: <strong>{testType}</strong>
                                        </p>
                                    )}
                                </FormItem>

                            )}
                        />
                        {/* output directory selection */}
                        <FormField
                            control={form.control}
                            name="outputDirectory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="my-4 text-2xl">output directory</FormLabel>
                                    <Input
                                        type="text"
                                        placeholder="paste the path to the output directory here"
                                        {...field}
                                        className="w-[50%]"
                                    />
                                    {form.formState.errors.outputDirectory && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {form.formState.errors.outputDirectory.message}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />



                        {/* <Button type='button' onClick={handleInputDirectory}> select input directory</Button>
                        <Button type='button' onClick={handleOutputDirectory}> select output directory</Button> */}
                        {/* Submit Button */}
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
        </div>
    )
}

export default NewProject