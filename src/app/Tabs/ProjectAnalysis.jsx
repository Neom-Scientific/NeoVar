import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';

const ProjectAnalysis = () => {
  const [counterData, setCounterData] = useState(null);
  const [progressData, setPtogressData] = useState({});
  const [apiCall, setApiCall] = useState(false);
  const [callCompleted, setCallCompleted] = useState(false);
  const [progressValue, setProgressValue] = useState({});
  const [notFound, setNotFound] = useState('');
  const [showNotFound, setShowNotFound] = useState(false); // State to control showing the notFound message
  const [isLoading, setIsLoading] = useState(true); // State to control the loader
  const [selectedTask, setSelectedTask] = useState(null); // State to control the selected task for details

 let email;
     const user = Cookies.get('user');
     if (user) {
         try {
             const parsedUser = JSON.parse(user);
             email = parsedUser.email;
         }
         catch (error) {
             console.error('Error parsing user data:', error);
         }
     }
     else {
         // console.log('User data:', user);
     }
  useEffect(() => {
    const fetchCounterData = async () => {
      try {
        const response = await axios.get(`/api/read-counter-json?email=${email}`);
        if (response.data.error) {
          setNotFound(response.data.error);
          // Start a timer to show the notFound message after 30 seconds
          setTimeout(() => {
            setShowNotFound(true);
            setIsLoading(false); // Stop the loader
          }, 30000); // 10 seconds
        } else {
          setCounterData(response.data);
          setApiCall(true);
          setIsLoading(false); // Stop the loader if data is found
        }
      } catch (error) {
        console.error('Error fetching counter data:', error);
        setIsLoading(false); // Stop the loader in case of an error
      }
    };
    fetchCounterData();
  }, [apiCall]);

  useEffect(() => {
    const taskIds = JSON.parse(localStorage.getItem('taskId')) || [];
    if (taskIds.length === 0) return;

    let previousStatus = {};
    const intervals = [];

    taskIds.forEach((taskId) => {
      const interval = setInterval(async () => {
        try {
          const res = await axios.post('/api/progress', { taskId, email });

          // Update progressData for the specific taskId
          setPtogressData((prevData) => ({
            ...prevData,
            [taskId]: res.data, // Store data for each taskId
          }));

          setProgressValue((prevProgress) => ({
            ...prevProgress,
            [taskId]: res.data.progress, // Store progress for each taskId
          }));
          setIsLoading(false); // Stop the loader when data is fetched

          // Handle status changes
          if (previousStatus[taskId] && previousStatus[taskId] !== res.data.status) {
            clearInterval(interval); // Stop interval if status changes
          }
          previousStatus[taskId] = res.data.status;

          if (res.data.status === 'done') {
            setCallCompleted(true);
            localStorage.removeItem('taskId'); // Clear taskId from local storage
            clearInterval(interval); // Stop interval if task is done
          }
          if (res.status === 404) {
            setCallCompleted(true);
            clearInterval(interval); // Stop interval if task is not found
          }
        } catch (error) {
          console.error(`Error fetching progress for ${taskId}:`, error);
        }
      }, 10000); // Fetch progress every ten seconds

      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval); // Cleanup all intervals on unmount
  }, [callCompleted]);

  // // console.log('progressData:', progressData);

  const handleOpenDialog=(taskData)=>{
    setSelectedTask(taskData);
  }
  const handleCloseDialog=()=>{
    setSelectedTask(null);
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Number</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Analysis Progress</TableHead>
            <TableHead>Creation Time</TableHead>
            <TableHead>Analysis Status</TableHead>
            <TableHead>Number of Sample</TableHead>
            <TableHead>Operation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-sm font-medium text-justify-center">
          {isLoading ? (
            // Show the loader while loading
            <TableRow>
              <TableCell colSpan="7" className="text-center text-lg">
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-orange-500"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : showNotFound ? (
            // Show the notFound message after the loader
            <TableRow>
              <TableCell colSpan="7" className="text-center text-lg">
                {notFound}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {Object.keys(progressData).map((taskId) => (
                <TableRow key={taskId} className="hover:bg-gray-100">
                  <TableCell>{taskId}</TableCell>
                  <TableCell>{progressData[taskId].projectName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-4 border border-gray-300 rounded bg-gray-100">
                        {/* Inner progress bar */}
                        <div
                          className="h-full bg-orange-500 rounded"
                          style={{ width: `${progressValue[taskId]}%` }}
                        ></div>
                      </div>
                      <div>
                        {progressData[taskId].progress}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {progressData[taskId]?.startTime
                      ? new Date(progressData[taskId].startTime).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{progressData[taskId]?.status || 'N/A'}</TableCell>
                  <TableCell>{progressData[taskId]?.numberOfSamples || 'N/A'}</TableCell>
                  {progressData[taskId]?.status === 'done' ? (
                    <TableCell>
                      <button 
                      
                      className="text-blue-500 hover:underline cursor-pointer">
                        Download Report
                      </button>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <button 
                      onClick={() => handleOpenDialog(progressData[taskId])}
                      className="text-blue-500 hover:underline cursor-pointer">
                        Details
                      </button>
                      <button className="text-red-500 hover:underline ml-2 cursor-pointer">
                        Stop
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {counterData &&
                Array.isArray(counterData) &&
                counterData.length > 0 &&
                counterData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.projectid}</TableCell>
                    <TableCell>{item.projectname}</TableCell>
                    <TableCell>{item.progress}%</TableCell>
                    <TableCell>{new Date(parseInt(item.creationtime)).toLocaleString()}</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>{item.numberofsamples}</TableCell>
                    <TableCell>
                      <button className="text-blue-500 hover:underline cursor-pointer">Download Report</button>
                    </TableCell>
                  </TableRow>
                ))}
            </>
          )}
        </TableBody>
      </Table>
      {selectedTask && 
        <HandleDialog data={selectedTask} onClose={handleCloseDialog} />
      }
    </div>
  );
};

export default ProjectAnalysis;

const HandleDialog = ({ data, onClose }) => {
  // // console.log('data:', data);
  return (
    <div>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-full "> {/* Set width here */}
          <DialogTitle>Task Details</DialogTitle>
          <div className=''>
            <div className="flex justify-between">
              <span>Task ID:</span>
              <span>{data.taskId}</span>
            </div>
            <div className="flex justify-between">
              <span>Project Name:</span>
              <span>{data.projectName}</span>
            </div>
            <div className="flex justify-between">
              <span>Progress:</span>
              <span>{data.progress}%</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span>{data.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Input Directory:</span>
              <span>{data.inputDir}</span>
            </div>
            <div className="flex justify-between">
              <span>Output Directory:</span>
              <span className='text-[13px]'>{data.outputDir}</span>
            </div>
          </div>
          
        </DialogContent>
      </Dialog>
    </div>
  );
};