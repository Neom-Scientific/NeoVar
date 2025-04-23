import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import axios from 'axios';
import React, { useEffect, useState } from 'react'


const ProjectAnalysis = () => {
  // const taskId = useSelector((state) => state.tab.taskId);
  const [counterData, setCounterData] = useState(null);
  const [progressData, setPtogressData] = useState({});
  const [apiCall, setApiCall] = useState(false);
  const [callCompleted, setCallCompleted] = useState(false);
  const [progressValue, setProgressValue] = useState({});
  // console.log('taskId:', taskId);
  let taskIds;

  useEffect(() => {
    const fetchCounterData = async () => {
      try {
        const response = await axios.get('/api/read-counter-json');
        setCounterData(response.data);
        setApiCall(true);
      } catch (error) {
        console.error('Error fetching counter data:', error);
      }
    };
    fetchCounterData();
  }, [apiCall]);

  useEffect(() => {
    taskIds = JSON.parse(localStorage.getItem('taskId')) || [];
    console.log('taskId:', taskIds);
    if (taskIds.length === 0) return;

    let previousStatus = {};
    const intervals = [];

    taskIds.forEach((taskId) => {
      const interval = setInterval(async () => {
        try {
          const res = await axios.post('/api/progress', { taskId });
          console.log(`Progress for ${taskId}:`, res.data.progress);

          // Update progressData for the specific taskId
          setPtogressData((prevData) => ({
            ...prevData,
            [taskId]: res.data, // Store data for each taskId
          }));

          setProgressValue((prevProgress) => ({
            ...prevProgress,
            [taskId]: res.data.progress, // Store progress for each taskId
          }));

          // Handle status changes
          if (previousStatus[taskId] && previousStatus[taskId] !== res.data.status) {
            clearInterval(interval); // Stop interval if status changes
          }
          previousStatus[taskId] = res.data.status;

          if (res.data.status === 'done') {
            setCallCompleted(true);
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

  return (
    <div>
      <Table>
        <TableHeader className="">
          <TableRow>
            <TableHead>Project Number</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Analysis Progress</TableHead>
            <TableHead>Creation Time</TableHead>
            <TableHead>Total Time</TableHead>
            <TableHead>Analysis Status</TableHead>
            <TableHead>Number of Sample</TableHead>
            <TableHead>Operation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className='text-sm font-medium text-justify-center'>
          {Object.keys(progressData).map((taskId) => (
            <TableRow key={taskId} className='hover:bg-gray-100'>
              <TableCell>{taskId}</TableCell>
              <TableCell>{progressData[taskId].projectName}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {/* Outer container with border */}
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
              <TableCell>{new Date(progressData[taskId].startTime).toLocaleString()}</TableCell>
              <TableCell>{progressData[taskId].eta}</TableCell>
              <TableCell>{progressData[taskId].status}</TableCell>
              <TableCell>{progressData[taskId].numberOfSamples}</TableCell>
              {progressData[taskId].status === 'done' ? (
                <TableCell>
                  <button className='text-blue-500 hover:underline cursor-pointer'>Download Report</button>
                </TableCell>
              ) : (
                <TableCell>
                  <button className='text-blue-500 hover:underline cursor-pointer'>Details</button>
                  <button className='text-red-500 hover:underline ml-2 cursor-pointer'>Stop</button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {counterData && counterData.details.map((item, index) => (
            <TableRow key={index} className='hover:bg-gray-100'>
              <TableCell>{item.projectId}</TableCell>
              <TableCell>{item.projectName}</TableCell>
              <TableCell>{item.progress}%</TableCell>
              <TableCell>{new Date(item.creationTime).toLocaleString()}</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>{item.analysisStatus}</TableCell>
              <TableCell>{item.numberOfSamples}</TableCell>
              <TableCell>
                {item.analysisStatus === 'done' ? (
                  <button className='text-blue-500 hover:underline cursor-pointer'>Download Report</button>
                ) : (
                  <>
                    <button className='text-blue-500 hover:underline cursor-pointer'>Details</button>
                    <button className='text-red-500 hover:underline ml-2 cursor-pointer'>Stop</button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ProjectAnalysis